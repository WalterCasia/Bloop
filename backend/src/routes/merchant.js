/**
 * Rutas exclusivas para el panel operativo de los Comercios (Merchants)
 */
export default async function merchantRoutes(fastify, options) {
  
  // Endpoint para crear una nueva sucursal (Multi-Store)
  fastify.post('/api/merchant/stores', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 255 },
          address: { type: 'string', minLength: 5, maxLength: 255 },
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          cover_url: { type: 'string' }
        },
        required: ['name', 'address', 'lat', 'lng']
      }
    }
  }, async (request, reply) => {
    const owner_id = request.user.sub || request.user.id;
    const { name, address, lat, lng, cover_url } = request.body;
    
    const client = await fastify.pg.connect();
    try {
      const query = `
        INSERT INTO public.stores (owner_id, name, address, location, cover_url)
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
        RETURNING id, name, address, cover_url
      `;
      const { rows } = await client.query(query, [owner_id, name, address, lng, lat, cover_url || null]);
      
      return reply.code(201).send({
        status: 'success',
        store: rows[0]
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo crear la sucursal.' });
    } finally {
      client.release();
    }
  });

  // Endpoint para eliminar una sucursal (Soft Delete)
  fastify.delete('/api/merchant/stores/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const owner_id = request.user.sub || request.user.id;
    const store_id = request.params.id;
    
    const client = await fastify.pg.connect();
    try {
      await client.query('BEGIN');

      // 1. Verificar propiedad y actualizar estado (Soft Delete)
      const updateStore = await client.query(`
        UPDATE public.stores 
        SET is_active = false, updated_at = NOW() 
        WHERE id = $1 AND owner_id = $2 
        RETURNING id
      `, [store_id, owner_id]);

      if (updateStore.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(403).send({ status: 'error', message: 'No tienes permisos para eliminar esta sucursal o no existe.' });
      }

      // 2. Eliminar packs activos asociados (Cascade lógico)
      await client.query(`
        DELETE FROM public.surprise_packs WHERE store_id = $1
      `, [store_id]);

      await client.query('COMMIT');
      
      return reply.code(200).send({
        status: 'success',
        message: 'Sucursal eliminada correctamente.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo eliminar la sucursal.' });
    } finally {
      client.release();
    }
  });

  // Endpoint para generar un código de invitación (Multi-Store)
  fastify.post('/api/merchant/invitations', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          store_id: { type: 'string', format: 'uuid' }
        },
        required: ['store_id']
      }
    }
  }, async (request, reply) => {
    const owner_id = request.user.sub || request.user.id;
    const { store_id } = request.body;
    
    const client = await fastify.pg.connect();
    try {
      // Validar que la tienda pertenezca al dueño
      const checkStore = await client.query(`SELECT id FROM public.stores WHERE id = $1 AND owner_id = $2`, [store_id, owner_id]);
      if (checkStore.rows.length === 0) {
        return reply.code(403).send({ status: 'error', message: 'No tienes permisos para esta sucursal.' });
      }

      // Generar código corto (ej: B-XXXX)
      const code = `B-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const query = `
        INSERT INTO public.store_invitations (store_id, created_by, code, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
        RETURNING code
      `;
      const { rows } = await client.query(query, [store_id, owner_id, code]);
      
      return reply.code(201).send({
        status: 'success',
        code: rows[0].code
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo generar el código.' });
    } finally {
      client.release();
    }
  });

  // Endpoint para que un empleado canjee un código de invitación
  fastify.post('/api/merchant/invitations/redeem', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        },
        required: ['code']
      }
    }
  }, async (request, reply) => {
    const user_id = request.user.sub || request.user.id;
    const { code } = request.body;
    
    const client = await fastify.pg.connect();
    try {
      // Iniciar transacción
      await client.query('BEGIN');

      // 1. Buscar el código activo
      const inviteQuery = `
        SELECT id, store_id FROM public.store_invitations 
        WHERE code = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())
        FOR UPDATE
      `;
      const inviteRes = await client.query(inviteQuery, [code]);
      
      if (inviteRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ status: 'error', message: 'El código es inválido o ha expirado.' });
      }

      const invite = inviteRes.rows[0];

      // 2. Actualizar el perfil del usuario a EMPLOYEE y asignarlo a la tienda
      const updateProfileQuery = `
        INSERT INTO public.profiles (id, role, merchant_role, assigned_store_id, full_name)
        VALUES ($1, 'STAFF', 'EMPLOYEE', $2, 'Empleado Bloop')
        ON CONFLICT (id) DO UPDATE SET
          role = 'STAFF',
          merchant_role = 'EMPLOYEE',
          assigned_store_id = EXCLUDED.assigned_store_id,
          updated_at = NOW()
      `;
      await client.query(updateProfileQuery, [user_id, invite.store_id]);

      // También actualizamos el app_metadata en auth.users si es necesario para los tokens JWT (solo si se usa db en auth)
      // Omitido temporalmente, el login relies on perfiles.

      // 3. Marcar el código como inactivo
      await client.query(`UPDATE public.store_invitations SET is_active = false WHERE id = $1`, [invite.id]);

      await client.query('COMMIT');

      return reply.code(200).send({
        status: 'success',
        message: 'Te has unido exitosamente a la sucursal.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo canjear el código.' });
    } finally {
      client.release();
    }
  });

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

    const client = await fastify.pg.connect();
    
    try {
      const userId = request.user.sub || request.user.id;
      let actualStoreId = null;
      const storeRes = await client.query(`SELECT id FROM public.stores WHERE owner_id = $1 LIMIT 1`, [userId]);
      if (storeRes.rows.length > 0) {
        actualStoreId = storeRes.rows[0].id;
      } else {
        const profileRes = await client.query(`SELECT assigned_store_id FROM public.profiles WHERE id = $1`, [userId]);
        if (profileRes.rows.length > 0 && profileRes.rows[0].assigned_store_id) {
          actualStoreId = profileRes.rows[0].assigned_store_id;
        }
      }

      // 2. Control de Acceso: El QR debe pertenecer estricamente al comercio que escanea
      if (decodedQR.store_id !== actualStoreId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Intento de validación rechazado: Este código QR pertenece a otra sucursal o comercio.'
        });
      }

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

      const result = await client.query(updateQuery, [qr_code, actualStoreId]);

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
  // Obtener pedidos vivos (PAGADO) del día para el dashboard (GET)
  // ----------------------------------------------------------------------
  fastify.get('/api/merchant/orders', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          storeId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['dashboard', 'active', 'history'], default: 'dashboard' },
          limit: { type: 'integer', default: 50 },
          offset: { type: 'integer', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    // Si storeId viene por query, lo priorizamos (para multi-sucursal)
    const storeId = request.query.storeId || request.user.sub || request.user.id;
    const { type, limit, offset } = request.query;
    
    const client = await fastify.pg.connect();
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let query = '';
      let queryParams = [];

      if (type === 'dashboard') {
        // Dashboard: PAGADO y RECOGIDO de hoy (para métricas y lista en vivo)
        query = `
          SELECT 
            o.id, o.status, o.quantity, o.qr_code_secret as validation_token, o.created_at,
            c.full_name as client_name, sp.title as pack_title
          FROM public.orders o
          JOIN public.profiles c ON o.client_id = c.id
          JOIN public.surprise_packs sp ON o.pack_id = sp.id
          WHERE o.store_id = $1 
            AND o.status IN ('PAGADO', 'RECOGIDO') 
            AND DATE(o.created_at AT TIME ZONE 'UTC') = $2
          ORDER BY o.created_at ASC
        `;
        queryParams = [storeId, today];
      } else if (type === 'active') {
        // Pedidos Activos (PAGADO) sin restricción de fecha, ordenados por los más antiguos primero
        query = `
          SELECT 
            o.id, o.status, o.quantity, o.qr_code_secret as validation_token, o.created_at,
            c.full_name as client_name, sp.title as pack_title
          FROM public.orders o
          JOIN public.profiles c ON o.client_id = c.id
          JOIN public.surprise_packs sp ON o.pack_id = sp.id
          WHERE o.store_id = $1 
            AND o.status = 'PAGADO'
          ORDER BY o.created_at ASC
          LIMIT $2 OFFSET $3
        `;
        queryParams = [storeId, limit, offset];
      } else if (type === 'history') {
        // Historial (RECOGIDO, CANCELADO) de cualquier fecha, ordenados por los más recientes primero
        query = `
          SELECT 
            o.id, o.status, o.quantity, o.qr_code_secret as validation_token, o.created_at,
            c.full_name as client_name, sp.title as pack_title
          FROM public.orders o
          JOIN public.profiles c ON o.client_id = c.id
          JOIN public.surprise_packs sp ON o.pack_id = sp.id
          WHERE o.store_id = $1 
            AND o.status IN ('RECOGIDO', 'CANCELADO')
          ORDER BY o.created_at DESC
          LIMIT $2 OFFSET $3
        `;
        queryParams = [storeId, limit, offset];
      }
      
      const { rows } = await client.query(query, queryParams);

      return reply.code(200).send({
        status: 'success',
        orders: rows
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudieron cargar los pedidos.' });
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
    
    const client = await fastify.pg.connect();
    try {
      const userId = request.user.sub || request.user.id;
      let actualStoreId = null;
      const storeRes = await client.query(`SELECT id FROM public.stores WHERE owner_id = $1 LIMIT 1`, [userId]);
      if (storeRes.rows.length > 0) {
        actualStoreId = storeRes.rows[0].id;
      } else {
        const profileRes = await client.query(`SELECT assigned_store_id FROM public.profiles WHERE id = $1`, [userId]);
        if (profileRes.rows.length > 0 && profileRes.rows[0].assigned_store_id) {
          actualStoreId = profileRes.rows[0].assigned_store_id;
        }
      }

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
        SET 
          available_quantity = $1, 
          total_quantity = GREATEST(total_quantity, $1),
          updated_at = NOW() 
        WHERE id = $2 AND store_id = $3 
        RETURNING id
      `, [availableStock, packId, actualStoreId]);

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
          endTime: { type: 'string' },
          imageBase64: { type: 'string' }
        },
        required: ['title', 'originalPrice', 'salePrice', 'startTime', 'endTime']
      }
    }
  }, async (request, reply) => {
    const { title, originalPrice, salePrice, startTime, endTime, imageBase64 } = request.body;
    
    // Construir timestamps para la recogida (hoy a las startTime y endTime)
    const today = new Date().toISOString().split('T')[0];
    const pickupStart = `${today} ${startTime}:00-06`; // Asumimos zona horaria UTC-6 para Centroamérica, ideal para el MVP
    const pickupEnd = `${today} ${endTime}:00-06`;

    let imageUrl = null;
    try {
      if (imageBase64) {
        const uploadResponse = await fastify.cloudinary.uploader.upload(imageBase64, {
          folder: 'bloop_packs',
          resource_type: 'image'
        });
        imageUrl = uploadResponse.secure_url;
      }
    } catch (err) {
      fastify.log.error('Error uploading image to Cloudinary:', err);
      // We continue even if image upload fails, or we could throw. Let's continue with null.
    }

    const client = await fastify.pg.connect();
    try {
      const userId = request.user.sub || request.user.id;
      let actualStoreId = null;
      const storeRes = await client.query(`SELECT id FROM public.stores WHERE owner_id = $1 LIMIT 1`, [userId]);
      if (storeRes.rows.length > 0) {
        actualStoreId = storeRes.rows[0].id;
      } else {
        const profileRes = await client.query(`SELECT assigned_store_id FROM public.profiles WHERE id = $1`, [userId]);
        if (profileRes.rows.length > 0 && profileRes.rows[0].assigned_store_id) {
          actualStoreId = profileRes.rows[0].assigned_store_id;
        }
      }
      
      if (!actualStoreId) {
        return reply.code(400).send({ error: 'No Store', message: 'No tienes una sucursal asignada o creada.' });
      }

      // Inactivamos packs anteriores del comercio para que solo haya 1 activo (Regla de negocio MVP)
      await client.query(`UPDATE public.surprise_packs SET is_active = false WHERE store_id = $1`, [actualStoreId]);

      // Insertamos el nuevo pack
      const insertQuery = `
        INSERT INTO public.surprise_packs 
        (store_id, title, original_price, discounted_price, available_quantity, total_quantity, pickup_start_time, pickup_end_time, is_active, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
        RETURNING id
      `;
      // Inicializamos available_quantity y total_quantity en 0 para que el comercio lo ajuste manualmente desde el dashboard
      const values = [actualStoreId, title, originalPrice, salePrice, 0, 0, pickupStart, pickupEnd, imageUrl];
      
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
  // ----------------------------------------------------------------------
  // 4. ACTUALIZAR CONFIGURACIÓN DE SUCURSAL Y PACK (PATCH)
  // ----------------------------------------------------------------------
  fastify.patch('/api/merchant/settings', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          storeId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          salePrice: { type: 'number' },
          startTime: { type: 'string' },
          endTime: { type: 'string' }
        },
        required: ['storeId']
      }
    }
  }, async (request, reply) => {
    const { storeId, isActive, lat, lng, salePrice, startTime, endTime } = request.body;
    const owner_id = request.user.sub || request.user.id;
    
    const client = await fastify.pg.connect();
    try {
      await client.query('BEGIN');

      // Validar permisos
      const storeCheck = await client.query('SELECT id FROM public.stores WHERE id = $1 AND owner_id = $2', [storeId, owner_id]);
      if (storeCheck.rowCount === 0) {
        throw new Error('UNAUTHORIZED');
      }

      // Actualizar Sucursal
      let updateStoreQuery = `UPDATE public.stores SET updated_at = NOW()`;
      const storeParams = [];
      let storeParamIndex = 1;
      
      if (isActive !== undefined) {
        updateStoreQuery += `, is_active = $${storeParamIndex}`;
        storeParams.push(isActive);
        storeParamIndex++;
      }
      
      if (lat !== undefined && lng !== undefined) {
        updateStoreQuery += `, location = ST_SetSRID(ST_MakePoint($${storeParamIndex}, $${storeParamIndex+1}), 4326)`;
        storeParams.push(lng, lat);
        storeParamIndex += 2;
      }
      
      updateStoreQuery += ` WHERE id = $${storeParamIndex}`;
        storeParams.push(storeId);
      
      await client.query(updateStoreQuery, storeParams);

      // Actualizar Pack de Hoy si existe
      if (salePrice !== undefined || (startTime && endTime)) {
        const today = new Date().toISOString().split('T')[0];
        const packQuery = `SELECT id FROM public.surprise_packs WHERE store_id = $1 AND DATE(created_at AT TIME ZONE 'UTC') = $2 AND is_active = true`;
        const packRes = await client.query(packQuery, [storeId, today]);
        
        if (packRes.rowCount > 0) {
          const packId = packRes.rows[0].id;
          let updatePackQuery = `UPDATE public.surprise_packs SET updated_at = NOW()`;
          const packParams = [];
          let packParamIndex = 1;
          
          if (salePrice !== undefined) {
            updatePackQuery += `, discounted_price = $${packParamIndex}`;
            packParams.push(salePrice);
            packParamIndex++;
          }
          
          if (startTime && endTime) {
            updatePackQuery += `, pickup_start_time = $${packParamIndex}::timestamptz, pickup_end_time = $${packParamIndex+1}::timestamptz`;
            packParams.push(`${today} ${startTime}:00-06`, `${today} ${endTime}:00-06`);
            packParamIndex += 2;
          }
          
          updatePackQuery += ` WHERE id = $${packParamIndex}`;
          packParams.push(packId);
          
          await client.query(updatePackQuery, packParams);
        }
      }

      await client.query('COMMIT');
      return reply.code(200).send({ status: 'success', message: 'Configuración actualizada.' });

    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      if (error.message === 'UNAUTHORIZED') {
        return reply.code(403).send({ error: 'Forbidden', message: 'No tienes permisos sobre esta sucursal.' });
      }
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo actualizar la configuración.' });
    } finally {
      client.release();
    }
  });

  // ----------------------------------------------------------------------
  // 5. OBTENER CONFIGURACIÓN DE SUCURSAL Y PACK (GET)
  // ----------------------------------------------------------------------
  fastify.get('/api/merchant/settings', {
    onRequest: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          storeId: { type: 'string', format: 'uuid' }
        },
        required: ['storeId']
      }
    }
  }, async (request, reply) => {
    const { storeId } = request.query;
    const owner_id = request.user.sub || request.user.id;
    
    const client = await fastify.pg.connect();
    try {
      // Validar permisos y obtener store
      const storeRes = await client.query(`
        SELECT id, is_active, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
        FROM public.stores 
        WHERE id = $1 AND owner_id = $2
      `, [storeId, owner_id]);
      
      if (storeRes.rowCount === 0) {
        return reply.code(403).send({ error: 'Forbidden', message: 'No tienes permisos sobre esta sucursal.' });
      }
      
      const store = storeRes.rows[0];
      
      // Obtener pack activo de hoy (si existe)
      const today = new Date().toISOString().split('T')[0];
      const packRes = await client.query(`
        SELECT discounted_price as sale_price, 
               to_char(pickup_start_time AT TIME ZONE 'UTC', 'HH24:MI') as start_time,
               to_char(pickup_end_time AT TIME ZONE 'UTC', 'HH24:MI') as end_time
        FROM public.surprise_packs 
        WHERE store_id = $1 AND DATE(created_at AT TIME ZONE 'UTC') = $2 AND is_active = true
      `, [storeId, today]);
      
      let pack = null;
      if (packRes.rowCount > 0) {
        pack = packRes.rows[0];
      }
      
      return reply.code(200).send({
        status: 'success',
        settings: {
          store: {
            isActive: store.is_active,
            lat: store.lat,
            lng: store.lng
          },
          pack: pack
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo obtener la configuración.' });
    } finally {
      client.release();
    }
  });

};
