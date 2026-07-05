/**
 * Rutas exclusivas para el panel operativo de los Comercios (Merchants)
 */
export default async function merchantRoutes(fastify, options) {
  
  // Endpoint para validar el código QR y entregar el pedido
  fastify.post('/api/merchant/orders/validate', {
    // Requiere autenticación (debe ser el token del comercio)
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          qr_code: { type: 'string' }
        },
        required: ['qr_code']
      }
    }
  }, async (request, reply) => {
    const { qr_code } = request.body;
    const store_id = request.user.sub || request.user.id; 
    
    let decodedQR;
    try {
      // 1. Verificación criptográfica de la firma del QR (asegura que fue generado por nosotros)
      decodedQR = fastify.jwt.verify(qr_code);
    } catch (err) {
      return reply.code(400).send({
        error: 'Invalid Token',
        message: 'El código QR proporcionado es inválido o está corrupto.'
      });
    }

    // Validación de propósito (evita que otros tipos de JWT se usen aquí)
    if (decodedQR.purpose !== 'pickup_qr') {
      return reply.code(400).send({
        error: 'Invalid Purpose',
        message: 'Este código QR no tiene permisos para redención de pedidos.'
      });
    }

    // 2. Control de Acceso: El QR debe pertenecer estricamente al comercio que escanea
    if (decodedQR.store_id !== store_id) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Intento de validación rechazado: Este código QR pertenece a otra sucursal o comercio.'
      });
    }

    const client = await fastify.pg.connect();
    
    try {
      // 3. Verificación de reglas de negocio en BD y actualización atómica
      // Nota: El usuario solicitó el estado "DELIVERED", pero en nuestro ENUM SQL es "RECOGIDO". 
      // Se utiliza "RECOGIDO" para respetar estrictamente la integridad referencial de la BD.
      const updateQuery = `
        UPDATE public.orders AS o
        SET status = 'RECOGIDO', updated_at = NOW()
        FROM public.surprise_packs sp
        WHERE o.pack_id = sp.id
          AND o.qr_code_secret = $1
          AND o.store_id = $2
          AND o.status = 'PAGADO'
          AND NOW() >= sp.pickup_start_time 
          AND NOW() <= sp.pickup_end_time
        RETURNING o.id, o.client_id, sp.title
      `;

      const result = await client.query(updateQuery, [qr_code, store_id]);

      if (result.rowCount === 0) {
        // Si no se actualizó nada, analizamos el motivo específico para un feedback claro al local
        const checkQuery = `
          SELECT o.status, sp.pickup_start_time, sp.pickup_end_time
          FROM public.orders o
          JOIN public.surprise_packs sp ON o.pack_id = sp.id
          WHERE o.qr_code_secret = $1 AND o.store_id = $2
        `;
        const checkResult = await client.query(checkQuery, [qr_code, store_id]);
        
        if (checkResult.rowCount === 0) {
          return reply.code(404).send({ error: 'Not Found', message: 'El pedido no existe en la base de datos.' });
        }

        const orderInfo = checkResult.rows[0];
        
        if (orderInfo.status === 'RECOGIDO') {
          return reply.code(409).send({ error: 'Already Delivered', message: 'Alerta: Este pedido ya fue entregado anteriormente.' });
        }
        if (orderInfo.status === 'CANCELADO') {
          return reply.code(409).send({ error: 'Cancelled', message: 'El pedido se encuentra cancelado.' });
        }

        // Validación de ventana de tiempo
        const now = new Date();
        const start = new Date(orderInfo.pickup_start_time);
        const end = new Date(orderInfo.pickup_end_time);

        if (now < start || now > end) {
          return reply.code(400).send({ 
            error: 'Out of Time Window', 
            message: `El pedido está fuera del horario de recogida. Horario válido: ${start.toLocaleTimeString()} a ${end.toLocaleTimeString()}.` 
          });
        }

        return reply.code(400).send({ error: 'Bad Request', message: 'El pedido no cumple las condiciones para ser entregado.' });
      }

      return reply.code(200).send({
        status: 'success',
        message: 'Pedido validado y marcado como RECOGIDO exitosamente.',
        order: {
          id: result.rows[0].id,
          pack_title: result.rows[0].title
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Error en la base de datos al validar el código QR.' });
    } finally {
      client.release();
    }
  });

  // ----------------------------------------------------------------------
  // 1. OBTENER ESTADO DEL INVENTARIO DEL DÍA (GET)
  // ----------------------------------------------------------------------
  fastify.get('/api/merchant/stock', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const storeId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();
    
    try {
      // Obtenemos el pack activo del comercio (asumimos 1 por comercio al día en el MVP)
      const packQuery = `
        SELECT id, title, available_quantity, original_price 
        FROM public.surprise_packs 
        WHERE store_id = $1
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const packResult = await client.query(packQuery, [storeId]);
      
      if (packResult.rowCount === 0) {
        return reply.code(404).send({ status: 'error', message: 'No tienes un pack configurado.' });
      }
      
      const pack = packResult.rows[0];

      // Calculamos las unidades "Reservadas" (Vendidas hoy, estado PAGADO o RECOGIDO)
      const soldQuery = `
        SELECT COUNT(*) as count 
        FROM public.orders 
        WHERE pack_id = $1 AND store_id = $2 AND status IN ('PAGADO', 'RECOGIDO')
      `;
      const soldResult = await client.query(soldQuery, [pack.id, storeId]);
      const soldUnits = parseInt(soldResult.rows[0].count, 10);

      // Verificamos si hay stock en Redis para determinar el estado visual
      const stockKey = `pack:${pack.id}:stock`;
      const redisStock = await fastify.redis.get(stockKey);
      
      // Si en Redis es 0 y en BD es 0, está SOLD_OUT (o si no existe la llave y BD es 0)
      const currentAvailable = parseInt(pack.available_quantity, 10);
      const isSoldOut = currentAvailable === 0 && (redisStock === null || parseInt(redisStock, 10) === 0);

      return reply.code(200).send({
        status: 'success',
        pack: {
          id: pack.id,
          title: pack.title,
          soldUnits: soldUnits,
          availableStock: currentAvailable,
          status: isSoldOut ? 'SOLD_OUT' : 'ACTIVE'
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'Error al cargar el inventario.' });
    } finally {
      client.release();
    }
  });

  // ----------------------------------------------------------------------
  // 2. SINCRONIZACIÓN MANUAL DE INVENTARIO (PATCH)
  // ----------------------------------------------------------------------
  fastify.patch('/api/merchant/stock', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          packId: { type: 'string', format: 'uuid' },
          availableStock: { type: 'integer', minimum: 0 },
          status: { type: 'string', enum: ['ACTIVE', 'SOLD_OUT'] }
        },
        required: ['packId', 'availableStock', 'status']
      }
    }
  }, async (request, reply) => {
    const { packId, availableStock, status } = request.body;
    const storeId = request.user.sub || request.user.id;

    const client = await fastify.pg.connect();
    try {
      await client.query('BEGIN');

      // Regla de Negocio: Evitar reducir stock si choca con reservas activas en Redis
      const keysToDelete = await fastify.redis.keys(`reservation:${packId}:*`);
      const activeLocks = keysToDelete.length;

      if (status !== 'SOLD_OUT' && availableStock < activeLocks) {
        // El cajero intentó reducir con el botón "-", pero hay gente comprando
        await client.query('ROLLBACK');
        return reply.code(409).send({ 
          error: 'Conflict', 
          message: 'No es posible reducir el stock por debajo de la cantidad actual porque ya existen clientes que han reservado y están pagando estos packs en este instante. Si ha ocurrido un imprevisto y no puedes despachar más pedidos, por favor utiliza el botón "Marcar como Agotado" en la parte inferior.' 
        });
      }

      // 1. Verificamos pertenencia y actualizamos BD Maestra
      const updateResult = await client.query(`
        UPDATE public.surprise_packs 
        SET available_quantity = $1, updated_at = NOW() 
        WHERE id = $2 AND store_id = $3 
        RETURNING id
      `, [availableStock, packId, storeId]);

      if (updateResult.rowCount === 0) {
        throw new Error('UNAUTHORIZED_OR_NOT_FOUND');
      }

      // 2. Sincronizamos la verdad absoluta en Redis para los consumidores
      const stockKey = `pack:${packId}:stock`;
      await fastify.redis.set(stockKey, availableStock);

      // 3. Cancelación Estricta (Hard Cancel) solo si se usa el botón de emergencia
      if (status === 'SOLD_OUT' || availableStock === 0) {
        if (activeLocks > 0) {
          // Eliminamos todos los bloqueos (los usuarios verán error al intentar pagar)
          await fastify.redis.del(...keysToDelete);
          fastify.log.info(`Hard Cancel ejecutado: Se liberaron ${activeLocks} bloqueos de Redis.`);
        }
      }

      await client.query('COMMIT');
      return reply.code(200).send({ status: 'success', message: 'Inventario sincronizado correctamente.' });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      
      if (error.message === 'UNAUTHORIZED_OR_NOT_FOUND') {
        return reply.code(403).send({ error: 'Forbidden', message: 'No tienes permiso para modificar este pack.' });
      }

      return reply.code(500).send({ error: 'Internal Server Error', message: 'Error al sincronizar el inventario.' });
    } finally {
      client.release();
    }
  });

  // ----------------------------------------------------------------------
  // 3. CREAR PACK SORPRESA (POST)
  // ----------------------------------------------------------------------
  fastify.post('/api/merchant/packs/template', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          originalPrice: { type: 'number' },
          salePrice: { type: 'number' },
          startTime: { type: 'string' },
          endTime: { type: 'string' }
        },
        required: ['title', 'originalPrice', 'salePrice', 'startTime', 'endTime']
      }
    }
  }, async (request, reply) => {
    const { title, originalPrice, salePrice, startTime, endTime } = request.body;
    const storeId = request.user.sub || request.user.id;
    
    // Construir timestamps para la recogida (hoy a las startTime y endTime)
    const today = new Date().toISOString().split('T')[0];
    const pickupStart = `${today} ${startTime}:00-06`; // Asumimos zona horaria UTC-6 para Centroamérica, ideal para el MVP
    const pickupEnd = `${today} ${endTime}:00-06`;

    const client = await fastify.pg.connect();
    try {
      // Inactivamos packs anteriores del comercio para que solo haya 1 activo (Regla de negocio MVP)
      await client.query(`UPDATE public.surprise_packs SET is_active = false WHERE store_id = $1`, [storeId]);

      // Insertamos el nuevo pack
      const insertQuery = `
        INSERT INTO public.surprise_packs 
        (store_id, title, original_price, discounted_price, available_quantity, total_quantity, pickup_start_time, pickup_end_time, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id
      `;
      // Inicializamos available_quantity y total_quantity en 0 para que el comercio lo ajuste manualmente desde el dashboard
      const values = [storeId, title, originalPrice, salePrice, 0, 0, pickupStart, pickupEnd];
      
      const result = await client.query(insertQuery, values);
      
      return reply.code(201).send({ 
        status: 'success', 
        message: 'Plantilla de pack creada exitosamente.',
        packId: result.rows[0].id
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo crear el pack.' });
    } finally {
      client.release();
    }
  });
}
