export default async function profileRoutes(fastify, options) {
  
  // 1. Obtener el Perfil del Comercio
  fastify.get('/api/merchant/profile', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();

    try {
      const query = `
        SELECT 
          id, store_name, description, address, avatar_url, cover_url,
          ST_X(location::geometry) as lng, 
          ST_Y(location::geometry) as lat
        FROM public.profiles
        WHERE id = $1 AND role = 'COMERCIO'
      `;
      const { rows } = await client.query(query, [userId]);

      if (rows.length === 0) {
        return reply.code(404).send({ 
          status: 'error', 
          message: 'Perfil de comercio no encontrado' 
        });
      }

      return reply.code(200).send({
        status: 'success',
        profile: rows[0]
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo cargar el perfil.' });
    } finally {
      client.release();
    }
  });

  // 2. Actualizar el Perfil del Comercio
  fastify.put('/api/merchant/profile', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          store_name: { type: 'string', minLength: 2, maxLength: 255 },
          description: { type: 'string' },
          address: { type: 'string', minLength: 5, maxLength: 255 },
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          avatar_url: { type: 'string' },
          cover_url: { type: 'string' }
        },
        required: ['store_name', 'address', 'lat', 'lng']
      }
    }
  }, async (request, reply) => {
    const userId = request.user.sub || request.user.id;
    const { store_name, description, address, lat, lng, avatar_url, cover_url } = request.body;
    
    const client = await fastify.pg.connect();

    try {
      // Validamos que sea comercio
      const checkRole = await client.query(`SELECT role FROM public.profiles WHERE id = $1`, [userId]);
      if (checkRole.rows.length === 0 || checkRole.rows[0].role !== 'COMERCIO') {
        return reply.code(403).send({ status: 'error', message: 'Acceso denegado. Solo comercios pueden actualizar este perfil.' });
      }

      // Actualizamos, usamos ST_SetSRID(ST_MakePoint(lng, lat), 4326) para la columna location
      const query = `
        UPDATE public.profiles
        SET 
          store_name = $1,
          description = $2,
          address = $3,
          location = ST_SetSRID(ST_MakePoint($4, $5), 4326),
          avatar_url = $6,
          cover_url = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING id, store_name, address
      `;
      
      const values = [store_name, description || null, address, lng, lat, avatar_url || null, cover_url || null, userId];
      
      const { rows } = await client.query(query, values);

      return reply.code(200).send({
        status: 'success',
        message: 'Perfil actualizado correctamente',
        profile: rows[0]
      });

    } catch (error) {
      fastify.log.error(error);
      
      if (error.constraint === 'valid_store_profile') {
         return reply.code(400).send({ status: 'error', message: 'Datos incompletos para el perfil de comercio.' });
      }

      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo actualizar el perfil.' });
    } finally {
      client.release();
    }
  });

  // 3. Obtener el Perfil del Cliente
  fastify.get('/api/customer/profile', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();

    try {
      const query = `
        SELECT 
          p.id, p.full_name, p.phone_number, p.avatar_url, p.role,
          COALESCE(
            (SELECT SUM(quantity) 
             FROM public.orders 
             WHERE client_id = p.id AND status IN ('PAGADO', 'RECOGIDO')
            ), 0
          ) as total_packs_saved
        FROM public.profiles p
        WHERE p.id = $1 AND p.role = 'CLIENTE'
      `;
      
      const { rows } = await client.query(query, [userId]);

      if (rows.length === 0) {
        return reply.code(404).send({ 
          status: 'error', 
          message: 'Perfil de cliente no encontrado' 
        });
      }

      return reply.code(200).send({
        status: 'success',
        profile: rows[0]
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo cargar el perfil.' });
    } finally {
      client.release();
    }
  });

  // 4. Actualizar el Perfil del Cliente
  fastify.put('/api/customer/profile', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          full_name: { type: 'string', minLength: 2, maxLength: 255 },
          phone_number: { type: 'string', maxLength: 50 },
          avatar_url: { type: 'string' }
        },
        required: ['full_name']
      }
    }
  }, async (request, reply) => {
    const userId = request.user.sub || request.user.id;
    const { full_name, phone_number, avatar_url } = request.body;
    
    const client = await fastify.pg.connect();

    try {
      // Validamos que sea cliente
      const checkRole = await client.query(`SELECT role FROM public.profiles WHERE id = $1`, [userId]);
      if (checkRole.rows.length === 0 || checkRole.rows[0].role !== 'CLIENTE') {
        return reply.code(403).send({ status: 'error', message: 'Acceso denegado. Solo clientes pueden actualizar este perfil.' });
      }

      const query = `
        UPDATE public.profiles
        SET 
          full_name = $1,
          phone_number = $2,
          avatar_url = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, full_name, phone_number, avatar_url
      `;
      
      const values = [full_name, phone_number || null, avatar_url || null, userId];
      
      const { rows } = await client.query(query, values);

      return reply.code(200).send({
        status: 'success',
        message: 'Perfil actualizado correctamente',
        profile: rows[0]
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo actualizar el perfil.' });
    } finally {
      client.release();
    }
  });
}
