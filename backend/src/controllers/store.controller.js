import axios from 'axios';

/**
 * Esquema de validación para la entrada de datos del comercio.
 * Fastify validará automáticamente el payload entrante contra este JSON Schema.
 */
export const updateProfileSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['store_name', 'address', 'category'],
      properties: {
        store_name: { type: 'string', minLength: 3 },
        address: { type: 'string', minLength: 5 },
        category: { type: 'string' },
        legal_id: { type: 'string' },
        bank_account: { type: 'string' },
        lng: { type: 'number' },
        lat: { type: 'number' },
        manager_name: { type: 'string' },
        phone: { type: 'string' },
        pickup_start: { type: 'string' },
        pickup_end: { type: 'string' }
      },
      additionalProperties: true
    }
  }
};

/**
 * Endpoint PUT /api/merchant/profile
 * Actualiza la información del comercio y geocodifica la dirección usando Mapbox.
 */
export const updateMerchantProfile = async (request, reply) => {
  const { store_name, address, category, lng, lat, phone } = request.body;
  
  // En un sistema real, este ID provendría del token JWT decodificado en request.user
  const merchantId = request.user?.sub || '22222222-2222-2222-2222-222222222222'; 

  try {
    if (lng === undefined || lat === undefined) {
      return reply.code(400).send({
        status: 'error',
        message: 'Las coordenadas (lng, lat) son requeridas para la ubicación.'
      });
    }

    // Insertar la primera sucursal principal en la tabla stores
    const queryStores = `
      INSERT INTO public.stores (owner_id, name, address, location, cover_url)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), null)
      RETURNING id, name, address;
    `;
    
    const valuesStores = [merchantId, store_name, address, lng, lat];
    const { rows: storeRows } = await request.server.pg.query(queryStores, valuesStores);

    // Actualizar también profiles por retrocompatibilidad con vistas existentes
    const queryProfiles = `
      UPDATE public.profiles 
      SET 
        store_name = $1, 
        address = $2, 
        category = $3,
        location = ST_SetSRID(ST_MakePoint($4, $5), 4326)
      WHERE id = $6
    `;
    await request.server.pg.query(queryProfiles, [store_name, address, category, lng, lat, merchantId]);

    return reply.send({
      status: 'success',
      message: 'Perfil comercial geolocalizado y actualizado exitosamente.',
      data: {
        ...storeRows[0],
        coordinates: { lng, lat }
      }
    });

  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ 
      status: 'error', 
      message: 'Error interno al procesar y geocodificar el perfil del comercio.' 
    });
  }
};
