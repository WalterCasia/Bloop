import Stripe from 'stripe';

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
          pack_id: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, default: 1 }
        },
        required: ['pack_id', 'quantity']
      }
    }
  }, async (request, reply) => {
    const { pack_id, quantity } = request.body;
    const client_id = request.user.sub || request.user.id;

    // 1. Verificamos que el usuario tiene un "lock" en Redis.
    // Si no lo tiene, su reserva ya expiró y no le permitimos ir a pagar.
    const lockKey = `reservation:${pack_id}:${client_id}`;
    const hasLock = await fastify.redis.get(lockKey);
    
    if (!hasLock) {
      return reply.code(400).send({
        status: 'error',
        message: 'Tu tiempo de reserva ha expirado. Por favor, intenta reservar nuevamente.'
      });
    }

    // 2. Obtenemos la información real del pack en la DB para no confiar en los precios del frontend
    const client = await fastify.pg.connect();
    let packInfo;
    
    try {
      const { rows } = await client.query(`
        SELECT id, store_id, title, discounted_price, available_quantity 
        FROM public.surprise_packs 
        WHERE id = $1
      `, [pack_id]);
      
      if (rows.length === 0) {
        return reply.code(404).send({ status: 'error', message: 'Pack no encontrado.' });
      }
      
      packInfo = rows[0];
      
      // Doble check rápido de stock
      if (packInfo.available_quantity < quantity) {
        return reply.code(409).send({ status: 'error', message: 'Inventario insuficiente.' });
      }
    } finally {
      client.release();
    }

    try {
      // 3. Crear la sesión de Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        // Inyectamos metadatos críticos para procesarlos luego en el Webhook
        metadata: {
          client_id: client_id.toString(),
          pack_id: pack_id.toString(),
          store_id: packInfo.store_id.toString(),
          quantity: quantity.toString()
        },
        line_items: [
          {
            price_data: {
              currency: 'gtq', // Quetzales guatemaltecos (cambiar a USD o EUR según tu país)
              product_data: {
                name: packInfo.title,
                description: 'Pack Sorpresa - Rescate de Alimentos',
              },
              // Stripe espera el precio en centavos
              unit_amount: Math.round(packInfo.discounted_price * 100),
            },
            quantity: quantity,
          },
        ],
        // URLs dinámicas de redirección a tu frontend local (en producción será tu dominio real)
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/orders?success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/explore?canceled=true`,
      });

      // 4. Retornar la URL al frontend
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
    }
  });
}
