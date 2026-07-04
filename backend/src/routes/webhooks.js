import Stripe from 'stripe';
import crypto from 'crypto';

export default async function webhookRoutes(fastify, options) {
  
  // Instanciamos el cliente de Stripe. 
  // Requiere: npm install stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', 
  });

  // Usamos fastify.register para crear un contexto aislado y no sobreescribir 
  // el parseador JSON del resto de la aplicación.
  fastify.register(async (instance) => {
    
    // CRÍTICO: Stripe requiere el cuerpo crudo (Raw Buffer) de la petición HTTP 
    // para verificar matemáticamente la firma. Sobrescribimos el parser JSON local.
    instance.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (request, payload, done) {
      done(null, payload);
    });

    instance.post('/api/webhooks/stripe', async (request, reply) => {
      const signature = request.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        // 1. Verificación Criptográfica Asimétrica
        // Si el payload fue alterado o no proviene de Stripe, arrojará un error.
        event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
      } catch (err) {
        fastify.log.error(`⚠️ Stripe Signature Error: ${err.message}`);
        return reply.code(400).send(`Webhook Error: ${err.message}`);
      }

      // 2. Manejo del Evento de Pago Exitoso
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Extraemos los metadatos inyectados previamente al crear la sesión de pago
        const { client_id, pack_id, store_id, quantity } = session.metadata;
        const qty = parseInt(quantity, 10);
        
        const lockKey = `reservation:${pack_id}:${client_id}`;
        const client = await fastify.pg.connect();

        try {
          await client.query('BEGIN');

          // 3. Confirmar inventario en la base de datos maestra (Fuente de verdad)
          const updateResult = await client.query(`
            UPDATE public.surprise_packs 
            SET available_quantity = available_quantity - $1 
            WHERE id = $2 AND available_quantity >= $1 
            RETURNING discounted_price
          `, [qty, pack_id]);

          if (updateResult.rowCount === 0) {
            // Manejo de condición de carrera: Si pagó pero justo se quedó sin stock,
            // la acción correcta aquí es disparar un reembolso automático a través de Stripe.
            throw new Error('STOCK_RACE_CONDITION_AFTER_PAYMENT');
          }

          const total_amount = updateResult.rows[0].discounted_price * qty;

          // 4. Generación del Código QR Encriptado para redención en tienda
          const qr_code_secret = fastify.jwt.sign({
            client_id,
            pack_id,
            store_id,
            nonce: crypto.randomUUID(),
            purpose: 'pickup_qr'
          });

          // 5. Asentar el pedido definitivo
          await client.query(`
            INSERT INTO public.orders 
            (client_id, pack_id, store_id, status, quantity, total_amount, qr_code_secret) 
            VALUES ($1, $2, $3, 'PAGADO', $4, $5, $6)
          `, [client_id, pack_id, store_id, qty, total_amount, qr_code_secret]);

          await client.query('COMMIT');

          // 6. Limpieza: Liberar el candado de Redis ahora que el proceso es definitivo
          await fastify.redis.del(lockKey);

          fastify.log.info(`✅ Pago y reserva confirmados (Webhook) para el cliente ${client_id}`);
        } catch (error) {
          await client.query('ROLLBACK');
          fastify.log.error(`Fallo transaccional en Webhook: ${error.message}`);
          
          if (error.message === 'STOCK_RACE_CONDITION_AFTER_PAYMENT') {
            // Alerta crítica: El usuario pagó pero no obtuvo stock
            // stripe.refunds.create({ payment_intent: session.payment_intent });
            fastify.log.error(`[ACCIÓN REQUERIDA] Ejecutar reembolso para sesión: ${session.id}`);
          }
          return reply.code(500).send({ error: 'Fallo al procesar el asentamiento del pedido.' });
        } finally {
          client.release();
        }
      }

      // 7. Retornar HTTP 200 rápidamente para confirmar recepción y evitar reintentos de Stripe
      return reply.code(200).send({ received: true });
    });
  });
}
