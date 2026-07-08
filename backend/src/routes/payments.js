import Stripe from 'stripe';
import crypto from 'crypto';

export default async function paymentRoutes(fastify, options) {
  
  // Instanciar Stripe con la clave secreta
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  fastify.post('/api/payments/create-checkout-session', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          order_id: { type: 'string', format: 'uuid' }
        },
        required: ['order_id']
      }
    }
  }, async (request, reply) => {
    const { order_id } = request.body;
    const client_id = request.user.sub || request.user.id;

    const client = await fastify.pg.connect();
    
    try {
      const { rows } = await client.query(`
        SELECT o.id, o.pack_id, o.store_id, o.quantity, o.status, p.title, p.discounted_price 
        FROM public.orders o
        JOIN public.surprise_packs p ON o.pack_id = p.id
        WHERE o.id = $1 AND o.client_id = $2
      `, [order_id, client_id]);
      
      if (rows.length === 0) {
        return reply.code(404).send({ status: 'error', message: 'Orden no encontrada o no autorizada.' });
      }
      
      const orderInfo = rows[0];

      // Solo se pueden pagar órdenes pendientes
      if (orderInfo.status !== 'PENDIENTE') {
        return reply.code(400).send({ 
          status: 'error', 
          message: `La orden no puede pagarse porque su estado es: ${orderInfo.status}` 
        });
      }

      // Verificamos que el usuario tiene el "lock" en Redis.
      // Si no lo tiene, su reserva expiró y será cancelada pronto.
      const lockKey = `reservation:${orderInfo.pack_id}:${client_id}`;
      const hasLock = await fastify.redis.get(lockKey);
      
      if (!hasLock) {
        return reply.code(400).send({
          status: 'error',
          message: 'Tu tiempo de reserva ha expirado. Por favor, intenta reservar nuevamente.'
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || request.headers.origin || 'http://localhost:5173';

      // Crear la sesión de Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        // Inyectamos order_id en la metadata
        metadata: {
          order_id: order_id.toString(),
          client_id: client_id.toString(),
          pack_id: orderInfo.pack_id.toString(),
          store_id: orderInfo.store_id.toString(),
          quantity: orderInfo.quantity.toString()
        },
        line_items: [
          {
            price_data: {
              currency: 'gtq', // Quetzales guatemaltecos
              product_data: {
                name: orderInfo.title,
                description: 'Pack Sorpresa - Rescate de Alimentos',
              },
              unit_amount: Math.round(orderInfo.discounted_price * 100),
            },
            quantity: orderInfo.quantity,
          },
        ],
        // Redirección a la vista de confirmación con el session_id para verificación activa
        success_url: `${frontendUrl}/order-confirmation/${order_id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/customer/orders`,
      });

      return reply.code(200).send({
        status: 'success',
        sessionUrl: session.url
      });
      
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        status: 'error',
        message: 'Error al conectar con la pasarela de pagos.'
      });
    } finally {
      client.release();
    }
  });

  // Endpoint de respaldo para verificar el pago activamente desde el frontend
  // Útil si los webhooks fallan o no están configurados en entornos locales/Vercel
  fastify.post('/api/payments/verify-session', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          session_id: { type: 'string' }
        },
        required: ['session_id']
      }
    }
  }, async (request, reply) => {
    const { session_id } = request.body;
    
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (session.payment_status === 'paid') {
        const { order_id, client_id, pack_id, store_id, quantity } = session.metadata;
        const qty = parseInt(quantity, 10);
        
        const lockKey = `reservation:${pack_id}:${client_id}`;
        const client = await fastify.pg.connect();

        try {
          await client.query('BEGIN');

          // Generación del Código QR Encriptado
          const qr_code_secret = fastify.jwt.sign({
            client_id,
            pack_id,
            store_id,
            order_id,
            nonce: crypto.randomUUID(),
            purpose: 'pickup_qr'
          });

          // Intentamos actualizar la orden. Si rowCount es 0, el webhook ya lo hizo o no existe.
          const orderResult = await client.query(`
            UPDATE public.orders 
            SET status = 'PAGADO', qr_code_secret = $1 
            WHERE id = $2 AND status = 'PENDIENTE'
            RETURNING id
          `, [qr_code_secret, order_id]);

          if (orderResult.rowCount > 0) {
            // Solo descontamos inventario si nosotros fuimos quienes marcamos como PAGADO
            const updateResult = await client.query(`
              UPDATE public.surprise_packs 
              SET available_quantity = available_quantity - $1 
              WHERE id = $2 AND available_quantity >= $1 
            `, [qty, pack_id]);

            if (updateResult.rowCount === 0) {
              throw new Error('STOCK_RACE_CONDITION_AFTER_PAYMENT');
            }

            await client.query('COMMIT');
            await fastify.redis.del(lockKey);
            fastify.log.info(`✅ Pago confirmado por Verificación Activa para la orden ${order_id}`);
          } else {
            await client.query('ROLLBACK');
          }

          return reply.code(200).send({ status: 'success', message: 'Verificación completada.' });
        } catch (error) {
          await client.query('ROLLBACK');
          fastify.log.error(`Fallo en Verificación Activa: ${error.message}`);
          return reply.code(500).send({ error: 'Fallo al procesar el asentamiento del pedido.' });
        } finally {
          client.release();
        }
      }
      
      return reply.code(400).send({ status: 'pending', message: 'El pago aún no se ha completado.' });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ status: 'error', message: 'Error verificando la sesión.' });
    }
  });
}
