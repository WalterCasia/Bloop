export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  // GET /api/favorites
  // Retorna los locales favoritos del usuario, calculando el stock de packs disponibles
  fastify.get('/api/favorites', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      const clientId = request.user.sub || request.user.id;

      // Obtener locales favoritos con su stock disponible
      // Un left join con surprise_packs que estén activos y dentro del horario
      const query = `
        SELECT 
          s.id,
          s.name,
          s.cover_url,
          s.address,
          COALESCE(
            (
              SELECT SUM(available_quantity)
              FROM public.surprise_packs sp
              WHERE sp.store_id = s.id 
                AND sp.is_active = true
                AND sp.pickup_end_time > NOW()
            ), 0
          ) as active_packs_count
        FROM public.favorite_stores fs
        JOIN public.stores s ON fs.store_id = s.id
        WHERE fs.client_id = $1
        ORDER BY fs.created_at DESC
      `;

      const { rows } = await client.query(query, [clientId]);

      return { favorites: rows };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    } finally {
      client.release();
    }
  });

  // POST /api/favorites/toggle
  // Recibe storeId y alterna su estado de favorito
  fastify.post('/api/favorites/toggle', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      const clientId = request.user.sub || request.user.id;
      const { storeId } = request.body;

      if (!storeId) {
        return reply.status(400).send({ error: 'storeId is required' });
      }

      await client.query('BEGIN');

      // Verificar si ya es favorito
      const checkQuery = `
        SELECT id FROM public.favorite_stores 
        WHERE client_id = $1 AND store_id = $2
      `;
      const checkResult = await client.query(checkQuery, [clientId, storeId]);

      let isFavorite = false;

      if (checkResult.rowCount > 0) {
        // Eliminar
        const deleteQuery = `
          DELETE FROM public.favorite_stores 
          WHERE client_id = $1 AND store_id = $2
        `;
        await client.query(deleteQuery, [clientId, storeId]);
        isFavorite = false;
      } else {
        // Agregar
        const insertQuery = `
          INSERT INTO public.favorite_stores (client_id, store_id)
          VALUES ($1, $2)
        `;
        await client.query(insertQuery, [clientId, storeId]);
        isFavorite = true;
      }

      await client.query('COMMIT');

      return { isFavorite };
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    } finally {
      client.release();
    }
  });
}
