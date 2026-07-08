export default async function publicRoutes(fastify, options) {
  // Configuración de la base de datos
  const { pg } = fastify;

  /**
   * GET /api/public/explore/preview
   * Devuelve únicamente un listado ofuscado (coordenadas e ID) de locales 
   * que actualmente tienen stock de packs sorpresa disponibles.
   * Utilizado en la Landing Page (Map Preview).
   */
  fastify.get('/api/public/explore/preview', async (request, reply) => {
    try {
      const query = `
        SELECT DISTINCT
          s.id AS store_id,
          ST_Y(s.location::geometry) AS lat,
          ST_X(s.location::geometry) AS lng
        FROM public.surprise_packs sp
        INNER JOIN public.stores s ON s.id = sp.store_id
        WHERE sp.is_active = true
          AND s.is_active = true
          AND sp.available_quantity > 0
          AND sp.pickup_end_time >= NOW()
        LIMIT 100;
      `;

      const { rows } = await pg.query(query);

      return reply.code(200).send({
        status: 'success',
        results: rows.length,
        data: rows
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        status: 'error',
        message: 'Error interno del servidor al procesar el mapa de previsualización.'
      });
    }
  });
}
