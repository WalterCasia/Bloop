import crypto from 'crypto';

/**
 * Rutas relacionadas a los Pedidos y Reservas Definitivas
 */
export default async function orderRoutes(fastify, options) {
  
  // Endpoint para reservar temporalmente un pack sorpresa y asentar orden PENDIENTE
  fastify.post('/api/orders/reserve', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          pack_id: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, default: 1 }
        },
        required: ['pack_id']
      }
    }
  }, async (request, reply) => {
    const { pack_id, quantity = 1 } = request.body;
    const client_id = request.user.sub || request.user.id;

    // Claves en Redis
    const stockKey = `pack:${pack_id}:stock`;
    const lockKey = `reservation:${pack_id}:${client_id}`;

    const client = await fastify.pg.connect();

    try {
      // 1. Operación Atómica en Redis: Decrementar el stock
      const newStock = await fastify.redis.decrby(stockKey, quantity);

      if (newStock < 0) {
        // Revertir
        await fastify.redis.incrby(stockKey, quantity);
        return reply.code(409).send({ 
          error: 'Agotado', 
          message: 'No hay stock disponible para esta cantidad.' 
        });
      }

      // 2. Bloqueo Temporal: Guardar reserva (10 minutos = 600 segundos)
      const reservationCreated = await fastify.redis.set(lockKey, 'pending_payment', { ex: 600, nx: true });

      if (!reservationCreated) {
        // Ya tiene una reserva activa, devolvemos el stock que acabamos de tomar
        await fastify.redis.incrby(stockKey, quantity);
        return reply.code(409).send({ 
          error: 'Reserva Activa', 
          message: 'Ya tienes una reserva pendiente para este pack.' 
        });
      }

      // 3. Crear el registro en Supabase (PENDIENTE)
      await client.query('BEGIN');
      
      // Obtener info del pack para crear la orden
      const { rows: packRows } = await client.query(`
        SELECT store_id, discounted_price FROM public.surprise_packs WHERE id = $1
      `, [pack_id]);

      if (packRows.length === 0) {
        throw new Error('PACK_NOT_FOUND');
      }

      const store_id = packRows[0].store_id;
      const total_amount = packRows[0].discounted_price * quantity;
      
      // Generamos qr_code_secret temporal (se oficializa en webhook)
      const qr_code_secret = crypto.randomUUID(); 

      const insertResult = await client.query(`
        INSERT INTO public.orders 
        (client_id, pack_id, store_id, status, quantity, total_amount, qr_code_secret) 
        VALUES ($1, $2, $3, 'PENDIENTE', $4, $5, $6) 
        RETURNING id, created_at
      `, [client_id, pack_id, store_id, quantity, total_amount, qr_code_secret]);

      await client.query('COMMIT');
      const order = insertResult.rows[0];

      // 4. Temporizador para cancelar la orden si no se paga en 10 minutos
      setTimeout(async () => {
        try {
          const pgClient = await fastify.pg.connect();
          const { rows } = await pgClient.query(`
            SELECT status FROM public.orders WHERE id = $1
          `, [order.id]);
          
          if (rows.length > 0 && rows[0].status === 'PENDIENTE') {
            await pgClient.query(`
              UPDATE public.orders SET status = 'CANCELADO' WHERE id = $1
            `, [order.id]);
            // Devolver stock a Redis
            await fastify.redis.incrby(stockKey, quantity);
            fastify.log.info(`Reserva ${order.id} expirada y cancelada automáticamente.`);
          }
          pgClient.release();
        } catch (e) {
          fastify.log.error(`Error en timeout de reserva ${order.id}: ${e.message}`);
        }
      }, 600 * 1000);

      return reply.code(200).send({
        status: 'success',
        message: 'Reserva creada. Tienes 10 minutos para pagar.',
        order: {
          id: order.id,
          created_at: order.created_at,
          reservation_expires_in: 600
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      
      if (error.message === 'PACK_NOT_FOUND') {
        // Devolver stock y eliminar lock
        await fastify.redis.incrby(stockKey, quantity);
        await fastify.redis.del(lockKey);
        return reply.code(404).send({ error: 'Not Found', message: 'Pack no encontrado.' });
      }

      return reply.code(500).send({ 
        error: 'Internal Server Error', 
        message: 'Hubo un problema al procesar la reserva.' 
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
          st.address as store_address,
          CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
        FROM public.orders o
        JOIN public.surprise_packs p ON o.pack_id = p.id
        JOIN public.stores st ON o.store_id = st.id
        LEFT JOIN public.reviews r ON o.id = r.order_id
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
