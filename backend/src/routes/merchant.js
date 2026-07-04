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
}
