import crypto from 'crypto';

/**
 * Rutas relacionadas a los Pedidos y Reservas Definitivas
 */
export default async function orderRoutes(fastify, options) {
  
  // Endpoint para confirmar el pago y asentar el pedido
  fastify.post('/api/orders/confirm', {
    // Requiere autenticación de cliente activo
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          pack_id: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, default: 1 },
          payment_reference: { type: 'string' } // Dato simulado del proveedor de pagos
        },
        required: ['pack_id', 'quantity']
      }
    }
  }, async (request, reply) => {
    const { pack_id, quantity } = request.body;
    const client_id = request.user.sub || request.user.id;

    // Clave temporal que indica que este cliente tiene el pack bloqueado
    const lockKey = `reservation:${pack_id}:${client_id}`;

    // 1. Verificación del bloqueo temporal en Redis
    const hasLock = await fastify.redis.get(lockKey);
    if (!hasLock) {
      return reply.code(400).send({
        error: 'Timeout',
        message: 'La reserva temporal expiró o no existe. Debes reservar nuevamente el pack.'
      });
    }

    // Solicitar un cliente del pool de PostgreSQL para manejar una transacción SQL
    const client = await fastify.pg.connect();
    
    try {
      await client.query('BEGIN');

      // 2. Descontar el inventario real en la DB principal y obtener info del pack
      // Usamos el bloqueo a nivel de fila y chequeo de cantidad atómico
      const updateResult = await client.query(`
        UPDATE public.surprise_packs 
        SET available_quantity = available_quantity - $1 
        WHERE id = $2 AND available_quantity >= $1 
        RETURNING store_id, discounted_price
      `, [quantity, pack_id]);

      // Si no retorna filas, significa que un race condition superó al redis o el backend
      // fue inconsistente y la DB detiene la venta (Fuente de verdad).
      if (updateResult.rowCount === 0) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const store_id = updateResult.rows[0].store_id;
      const total_amount = updateResult.rows[0].discounted_price * quantity;

      // 3. Generar firma encriptada para el Código QR
      // Utilizamos JWT firmado por el backend para evitar falsificaciones. 
      // Se inserta un 'nonce' (UUID aleatorio) para asegurar entropía única.
      const qr_code_secret = fastify.jwt.sign({
        client_id,
        pack_id,
        store_id,
        nonce: crypto.randomUUID(),
        purpose: 'pickup_qr'
      });

      // 4. Insertar el pedido en estado PAGADO (ya que este endpoint simula confirmación)
      const insertResult = await client.query(`
        INSERT INTO public.orders 
        (client_id, pack_id, store_id, status, quantity, total_amount, qr_code_secret) 
        VALUES ($1, $2, $3, 'PAGADO', $4, $5, $6) 
        RETURNING id, created_at
      `, [client_id, pack_id, store_id, quantity, total_amount, qr_code_secret]);

      // Confirmar la transacción
      await client.query('COMMIT');

      // 5. Limpieza: Liberar el bloqueo en Redis ya que la compra se concretó exitosamente
      await fastify.redis.del(lockKey);

      const newOrder = insertResult.rows[0];

      return reply.code(201).send({
        status: 'success',
        message: 'Pedido procesado y confirmado exitosamente.',
        order: {
          id: newOrder.id,
          qr_code_secret: qr_code_secret,
          total_amount,
          created_at: newOrder.created_at
        }
      });

    } catch (error) {
      // Reversar toda la transacción en caso de falla
      await client.query('ROLLBACK');
      
      if (error.message === 'INSUFFICIENT_STOCK') {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'El inventario en la base de datos se agotó antes de asentar el pago.'
        });
      }

      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error', 
        message: 'Fallo crítico al asentar la reserva final en la base de datos.' 
      });
    } finally {
      client.release();
    }
  });

  // Endpoint para obtener el historial de pedidos del cliente (CustomerOrders.jsx)
  fastify.get('/api/customer/orders', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const client_id = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();
    
    try {
      // Unimos la tabla orders con surprise_packs y profiles (comercios) 
      // para obtener el nombre, dirección y horarios de recogida.
      const query = `
        SELECT 
          o.id,
          o.status,
          o.total_amount as total_price,
          o.qr_code_secret as validation_token,
          o.created_at,
          p.title as pack_title,
          p.pickup_start_time,
          p.pickup_end_time,
          st.name as store_name,
          st.address as store_address
        FROM public.orders o
        JOIN public.surprise_packs p ON o.pack_id = p.id
        JOIN public.profiles st ON o.store_id = st.id
        WHERE o.client_id = $1
        ORDER BY o.created_at DESC
      `;
      
      const { rows } = await client.query(query, [client_id]);

      return reply.code(200).send({
        status: 'success',
        orders: rows
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error', 
        message: 'No pudimos cargar tus pedidos en este momento.' 
      });
    } finally {
      client.release();
    }
  });
}
