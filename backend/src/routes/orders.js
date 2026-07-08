import crypto from 'crypto';
import Stripe from 'stripe';

/**
 * Rutas relacionadas a los Pedidos y Reservas Definitivas
 */
export default async function orderRoutes(fastify, options) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  
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
      await client.query('BEGIN');

      // 1. Lazy Evaluation: Cancelar reservas expiradas y devolver stock
      const { rows: expiredRows } = await client.query(`
        SELECT id, pack_id, quantity 
        FROM public.orders 
        WHERE client_id = $1 
          AND status = 'PENDIENTE' 
          AND created_at < NOW() - INTERVAL '10 minutes'
      `, [client_id]);

      for (const exp of expiredRows) {
        await client.query(`UPDATE public.orders SET status = 'CANCELADO' WHERE id = $1`, [exp.id]);
        const stockKey = `pack:${exp.pack_id}:stock`;
        await fastify.redis.incrby(stockKey, exp.quantity);
      }

      // 2. Active Sync con Stripe: Buscar ordenes PENDIENTES que no han expirado
      // Para auto-asentar si el webhook o el verify-session fallaron
      const { rows: pendingRows } = await client.query(`
        SELECT id, pack_id, store_id, quantity, client_id 
        FROM public.orders 
        WHERE client_id = $1 
          AND status = 'PENDIENTE'
      `, [client_id]);

      // Obtenemos las últimas 100 sesiones de Stripe de una vez para minimizar llamadas a la API
      let recentSessions = [];
      if (pendingRows.length > 0) {
        try {
          const sessionsResponse = await stripe.checkout.sessions.list({ limit: 100 });
          recentSessions = sessionsResponse.data;
        } catch (e) {
          fastify.log.error(`[Active Sync Error] No se pudieron obtener sesiones de Stripe: ${e.message}`);
        }
      }

      for (const pending of pendingRows) {
        try {
          const session = recentSessions.find(s => s.metadata?.order_id === pending.id);
          
          if (session && session.payment_status === 'paid') {
            // Asentar orden!
            const qr_code_secret = fastify.jwt.sign({
              client_id: pending.client_id,
              pack_id: pending.pack_id,
              store_id: pending.store_id,
              order_id: pending.id,
              nonce: crypto.randomUUID(),
              purpose: 'pickup_qr'
            });

            const orderResult = await client.query(`
              UPDATE public.orders 
              SET status = 'PAGADO', qr_code_secret = $1 
              WHERE id = $2 AND status = 'PENDIENTE'
              RETURNING id
            `, [qr_code_secret, pending.id]);

            if (orderResult.rowCount > 0) {
              await client.query(`
                UPDATE public.surprise_packs 
                SET available_quantity = available_quantity - $1 
                WHERE id = $2 AND available_quantity >= $1 
              `, [pending.quantity, pending.pack_id]);
              
              const lockKey = `reservation:${pending.pack_id}:${pending.client_id}`;
              await fastify.redis.del(lockKey);
              fastify.log.info(`[Active Sync] Orden ${pending.id} pagada y sincronizada.`);
            }
          }
        } catch (e) {
          fastify.log.error(`[Active Sync Error] Fallo al sincronizar orden ${pending.id}: ${e.message}`);
        }
      }

      // 3. Unimos la tabla orders con surprise_packs y profiles (comercios) 
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
      await client.query('COMMIT');

      return reply.code(200).send({
        status: 'success',
        orders: rows
      });

    } catch (error) {
      await client.query('ROLLBACK');
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
