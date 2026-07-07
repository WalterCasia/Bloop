/**
 * Rutas relacionadas a los Packs Sorpresa
 */
export default async function packRoutes(fastify, options) {
  
  // Endpoint para explorar packs cercanos (Búsqueda Geoespacial)
  fastify.get('/api/packs/explore', {
    // Si la exploración es pública, no requiere autenticación obligatoria
    schema: {
      querystring: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
          radius: { type: 'number', default: 5.0 } // Búsqueda por defecto en un radio de 5km
        },
        required: ['lat', 'lng']
      }
    }
  }, async (request, reply) => {
    const { lat, lng, radius } = request.query;
    
    // Consulta SQL bruta optimizada con PostGIS
    // Importante: ST_MakePoint requiere el orden (Longitud, Latitud)
    const query = `
      SELECT 
        sp.id AS pack_id,
        sp.title,
        sp.original_price,
        sp.discounted_price,
        sp.available_quantity,
        sp.pickup_start_time,
        sp.pickup_end_time,
        sp.image_url,
        s.name AS store_name,
        s.address,
        s.cover_url,
        ST_Y(s.location::geometry) AS location_lat,
        ST_X(s.location::geometry) AS location_lng,
        -- Calcular distancia exacta en kilómetros (ST_Distance con geography devuelve metros)
        (ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0) AS distance_km
      FROM public.surprise_packs sp
      INNER JOIN public.stores s ON s.id = sp.store_id
      WHERE sp.is_active = true
        AND s.is_active = true
        AND sp.available_quantity > 0
        -- Filtrar packs cuya ventana de recogida esté activa o en un futuro próximo
        AND sp.pickup_end_time >= NOW()
        -- Condición espacial: Dentro del radio en metros
        AND ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) <= ($3 * 1000.0)
      ORDER BY distance_km ASC
      LIMIT 50;
    `;

    try {
      const { rows } = await fastify.pg.query(query, [lng, lat, radius]);
      
      return reply.code(200).send({
        status: 'success',
        results: rows.length,
        data: rows
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error', 
        message: 'Error al realizar la búsqueda geoespacial de comercios.' 
      });
    }
  });

  // Endpoint para reservar temporalmente un pack sorpresa
  fastify.post('/api/packs/:id/reserve', {
    // Requiere autenticación JWT obligatoria
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const packId = request.params.id;
    // En los JWT de Supabase, el ID del usuario se guarda en el claim 'sub'
    const clientId = request.user.sub || request.user.id; 

    // Claves en Redis
    const stockKey = `pack:${packId}:stock`;
    const lockKey = `reservation:${packId}:${clientId}`;

    try {
      // 1. Operación Atómica: Decrementar el stock directamente en Redis
      const newStock = await fastify.redis.decr(stockKey);

      if (newStock < 0) {
        // Si el inventario baja de cero, no hay stock. Revertimos el decremento.
        await fastify.redis.incr(stockKey);
        
        // Retornar 409 Conflict rápido sin tocar PostgreSQL
        return reply.code(409).send({ 
          error: 'Agotado', 
          message: 'No hay stock disponible para este pack sorpresa en este momento.' 
        });
      }

      // 2. Bloqueo Temporal: Guardar reserva para el cliente (10 minutos = 600 segundos)
      // El flag NX (Not eXists) evita que un mismo usuario reserve dos veces el mismo pack
      const reservationCreated = await fastify.redis.set(lockKey, 'pending_payment', { ex: 600, nx: true });

      if (!reservationCreated) {
        // Si ya existía un bloqueo para este usuario, liberamos el stock que acabamos de tomar
        await fastify.redis.incr(stockKey);
        return reply.code(409).send({ 
          error: 'Reserva Activa', 
          message: 'Ya tienes una reserva pendiente de pago para este pack.' 
        });
      }

      return reply.code(200).send({
        status: 'success',
        message: 'Reserva temporal exitosa. Tienes 10 minutos para completar el pago.',
        reservation_expires_in: 600,
        pack_id: packId
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error', 
        message: 'Hubo un problema al procesar la reserva.' 
      });
    }
  });

  // Endpoint para cancelar voluntariamente (o por timeout) una reserva temporal
  fastify.post('/api/packs/:id/cancel-reservation', {
    onRequest: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const packId = request.params.id;
    const clientId = request.user.sub || request.user.id; 
    
    const stockKey = `pack:${packId}:stock`;
    const lockKey = `reservation:${packId}:${clientId}`;

    try {
      // Intentamos eliminar el bloqueo de este usuario
      const deletedCount = await fastify.redis.del(lockKey);
      
      if (deletedCount > 0) {
        // Si efectivamente se borró (el usuario tenía un lock activo),
        // devolvemos atómicamente la unidad al stock disponible de Redis.
        await fastify.redis.incr(stockKey);
        fastify.log.info(`Reserva liberada para el cliente ${clientId} en el pack ${packId}`);
      }

      return reply.code(200).send({
        status: 'success',
        message: 'Reserva cancelada y stock liberado correctamente.'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Internal Server Error', 
        message: 'Error al liberar el stock en Redis.' 
      });
    }
  });
}
