export default async function reviewRoutes(fastify, options) {
  // 1. POST /api/reviews (B2C)
  // Cliente califica un pedido
  fastify.post('/api/reviews', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['orderId', 'rating'],
        properties: {
          orderId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          tags: { type: 'array', items: { type: 'string' } },
          comment: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { orderId, rating, tags, comment } = request.body;
    const clientId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();

    try {
      // Verificar la orden
      const orderRes = await client.query(`
        SELECT id, status, store_id FROM public.orders 
        WHERE id = $1 AND client_id = $2
      `, [orderId, clientId]);

      if (orderRes.rowCount === 0) {
        return reply.code(404).send({ error: 'Order no encontrada o no te pertenece.' });
      }

      const order = orderRes.rows[0];

      if (order.status !== 'DELIVERED') {
        return reply.code(400).send({ error: 'Solo puedes calificar pedidos que ya fueron entregados.' });
      }

      // Intentar insertar reseña
      const insertRes = await client.query(`
        INSERT INTO public.reviews (order_id, client_id, store_id, rating, tags, comment)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [orderId, clientId, order.store_id, rating, JSON.stringify(tags || []), comment]);

      return reply.code(201).send({ status: 'success', data: { id: insertRes.rows[0].id } });
    } catch (err) {
      if (err.code === '23505') { // Unique violation (ya existe reseña para la orden)
        return reply.code(409).send({ error: 'Este pedido ya ha sido calificado.' });
      }
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error interno del servidor.' });
    } finally {
      client.release();
    }
  });

  // 2. GET /api/merchant/reviews/:storeId (B2B)
  // Comercio ve sus reseñas
  fastify.get('/api/merchant/reviews/:storeId', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['storeId'],
        properties: { storeId: { type: 'string', format: 'uuid' } }
      }
    }
  }, async (request, reply) => {
    const { storeId } = request.params;
    const userId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();

    try {
      // Verificar permisos de comercio
      const authCheck = await client.query(`
        SELECT 1 FROM public.stores WHERE id = $1 AND owner_id = $2
        UNION
        SELECT 1 FROM public.profiles WHERE id = $2 AND assigned_store_id = $1
      `, [storeId, userId]);

      if (authCheck.rowCount === 0) {
        return reply.code(403).send({ error: 'No tienes acceso a esta sucursal.' });
      }

      // Obtener reseñas con LEFT JOIN para sacar datos del cliente
      const reviewsRes = await client.query(`
        SELECT r.id, r.rating, r.tags, r.comment, r.merchant_reply, r.created_at, r.order_id,
               p.full_name as client_name, p.avatar_url as client_avatar,
               (SELECT COUNT(*) FROM public.orders o2 WHERE o2.client_id = p.id) as client_order_count
        FROM public.reviews r
        JOIN public.profiles p ON r.client_id = p.id
        WHERE r.store_id = $1
        ORDER BY r.created_at DESC
      `, [storeId]);

      // Calcular promedio general
      const statsRes = await client.query(`
        SELECT COUNT(id) as total_reviews, AVG(rating) as average_rating
        FROM public.reviews
        WHERE store_id = $1
      `, [storeId]);

      const stats = statsRes.rows[0];

      // Formatear la data
      const reviews = reviewsRes.rows.map(r => ({
        id: r.id,
        rating: r.rating,
        tags: r.tags,
        comment: r.comment,
        merchant_reply: r.merchant_reply,
        created_at: r.created_at,
        order_id: r.order_id,
        client: {
          name: r.client_name,
          avatar: r.client_avatar,
          is_new_client: parseInt(r.client_order_count) <= 1
        }
      }));

      return reply.code(200).send({
        status: 'success',
        stats: {
          totalReviews: parseInt(stats.total_reviews) || 0,
          averageRating: parseFloat(stats.average_rating) || 0
        },
        reviews
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error interno del servidor.' });
    } finally {
      client.release();
    }
  });

  // 3. PATCH /api/merchant/reviews/:reviewId/reply (B2B)
  // Comercio responde a reseña
  fastify.patch('/api/merchant/reviews/:reviewId/reply', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['reviewId'],
        properties: { reviewId: { type: 'string', format: 'uuid' } }
      },
      body: {
        type: 'object',
        required: ['reply'],
        properties: { reply: { type: 'string' } }
      }
    }
  }, async (request, reply) => {
    const { reviewId } = request.params;
    const { reply: merchantReply } = request.body;
    const userId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();

    try {
      // 1. Obtener la reseña para saber de qué sucursal es
      const reviewRes = await client.query(`SELECT store_id FROM public.reviews WHERE id = $1`, [reviewId]);
      if (reviewRes.rowCount === 0) {
        return reply.code(404).send({ error: 'Reseña no encontrada.' });
      }
      const storeId = reviewRes.rows[0].store_id;

      // 2. Verificar permisos
      const authCheck = await client.query(`
        SELECT 1 FROM public.stores WHERE id = $1 AND owner_id = $2
        UNION
        SELECT 1 FROM public.profiles WHERE id = $2 AND assigned_store_id = $1
      `, [storeId, userId]);

      if (authCheck.rowCount === 0) {
        return reply.code(403).send({ error: 'No tienes acceso a esta sucursal.' });
      }

      // 3. Actualizar la reseña
      const updateRes = await client.query(`
        UPDATE public.reviews
        SET merchant_reply = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [merchantReply, reviewId]);

      return reply.code(200).send({ status: 'success', data: updateRes.rows[0] });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Error interno del servidor.' });
    } finally {
      client.release();
    }
  });
}
