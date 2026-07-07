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
        WHERE id = $1 AND role IN ('COMERCIO', 'OWNER', 'STAFF')
      `;
      const { rows } = await client.query(query, [userId]);

      if (rows.length === 0) {
        return reply.code(200).send({ 
          status: 'success', 
          profile: {} // Perfil vacío para primera vez
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
      // Validamos que sea comercio (revisando en perfiles o directamente en auth.users si no existe)
      let isMerchant = false;
      let actualRole = 'COMERCIO';
      const checkProfile = await client.query(`SELECT role FROM public.profiles WHERE id = $1`, [userId]);
      if (checkProfile.rows.length > 0) {
        actualRole = checkProfile.rows[0].role;
        isMerchant = ['COMERCIO', 'OWNER', 'STAFF'].includes(actualRole);
      } else {
        const checkAuth = await client.query(`SELECT raw_user_meta_data->>'role' as role FROM auth.users WHERE id = $1`, [userId]);
        if (checkAuth.rows.length > 0) {
          actualRole = checkAuth.rows[0].role;
          isMerchant = ['COMERCIO', 'OWNER', 'STAFF'].includes(actualRole);
        }
      }

      if (!isMerchant) {
        return reply.code(403).send({ status: 'error', message: 'Acceso denegado. Solo comercios pueden actualizar este perfil.' });
      }

      // Usamos UPSERT (INSERT ... ON CONFLICT DO UPDATE)
      // Para poder crear el registro si no existe, respetando las validaciones NOT NULL de comercio
      const query = `
        INSERT INTO public.profiles (id, role, full_name, store_name, description, address, location, avatar_url, cover_url)
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          store_name = EXCLUDED.store_name,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          location = EXCLUDED.location,
          avatar_url = EXCLUDED.avatar_url,
          cover_url = EXCLUDED.cover_url,
          updated_at = NOW()
        RETURNING id, store_name, address
      `;
      
      const full_name_fallback = request.user.email || 'Comercio Bloop';
      const values = [userId, 'COMERCIO', full_name_fallback, store_name, description || null, address, lng, lat, avatar_url || null, cover_url || null];
      
      const { rows } = await client.query(query, values);

      // Crear automáticamente la sucursal principal en la tabla stores si es el Onboarding (0 sucursales)
      const storeQuery = `
        INSERT INTO public.stores (owner_id, name, address, location, cover_url)
        SELECT $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6
        WHERE NOT EXISTS (
          SELECT 1 FROM public.stores WHERE owner_id = $1
        )
      `;
      await client.query(storeQuery, [userId, store_name, address, lng, lat, cover_url || null]);

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
        return reply.code(200).send({ 
          status: 'success', 
          profile: { total_packs_saved: 0 } 
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
      let isCustomer = false;
      const checkProfile = await client.query(`SELECT role FROM public.profiles WHERE id = $1`, [userId]);
      if (checkProfile.rows.length > 0) {
        isCustomer = checkProfile.rows[0].role === 'CLIENTE';
      } else {
        const checkAuth = await client.query(`SELECT raw_user_meta_data->>'role' as role FROM auth.users WHERE id = $1`, [userId]);
        isCustomer = checkAuth.rows.length > 0 && checkAuth.rows[0].role === 'CLIENTE';
      }

      if (!isCustomer) {
        return reply.code(403).send({ status: 'error', message: 'Acceso denegado. Solo clientes pueden actualizar este perfil.' });
      }

      const query = `
        INSERT INTO public.profiles (id, role, full_name, phone_number, avatar_url)
        VALUES ($1, 'CLIENTE', $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone_number = EXCLUDED.phone_number,
          avatar_url = EXCLUDED.avatar_url,
          updated_at = NOW()
        RETURNING id, full_name, phone_number, avatar_url
      `;
      
      const values = [userId, full_name, phone_number || null, avatar_url || null];
      
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

  // 5. Establecer Rol del Usuario (Usado en el Onboarding)
  fastify.patch('/api/users/profile', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['CLIENTE', 'COMERCIO', 'OWNER', 'STAFF'] },
          full_name: { type: 'string' }
        },
        required: ['role']
      }
    }
  }, async (request, reply) => {
    const userId = request.user.sub || request.user.id;
    const { role, full_name } = request.body;
    
    const client = await fastify.pg.connect();

    try {
      const defaultName = full_name || 'Usuario Bloop';
      const query = `
        INSERT INTO public.profiles (id, role, full_name, store_name, address, location)
        VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint(0, 0), 4326))
        ON CONFLICT (id) DO UPDATE SET
          role = EXCLUDED.role,
          updated_at = NOW()
        RETURNING id, role, full_name
      `;
      
      const storeName = ['COMERCIO', 'OWNER', 'STAFF'].includes(role) ? 'Pendiente' : null;
      const address = ['COMERCIO', 'OWNER', 'STAFF'].includes(role) ? 'Pendiente' : null;
      const mappedRole = ['OWNER', 'STAFF'].includes(role) ? 'COMERCIO' : role;
      const { rows } = await client.query(query, [userId, mappedRole, defaultName, storeName, address]);

      return reply.code(200).send({
        status: 'success',
        message: 'Rol actualizado correctamente',
        profile: rows[0]
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudo actualizar el rol.' });
    } finally {
      client.release();
    }
  });
}
