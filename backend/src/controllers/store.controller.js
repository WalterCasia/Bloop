import axios from 'axios';

/**
 * Esquema de validación para la entrada de datos del comercio.
 * Fastify validará automáticamente el payload entrante contra este JSON Schema.
 */
export const updateProfileSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['store_name', 'address', 'category', 'legal_id', 'bank_account'],
      properties: {
        store_name: { type: 'string', minLength: 3 },
        address: { type: 'string', minLength: 10 },
        category: { type: 'string', minLength: 3 },
        legal_id: { type: 'string', minLength: 5 },
        bank_account: { type: 'string', minLength: 10 }
      },
      additionalProperties: false
    }
  }
};

/**
 * Endpoint PUT /api/merchant/profile
 * Actualiza la información del comercio y geocodifica la dirección usando Mapbox.
 */
export const updateMerchantProfile = async (request, reply) => {
  const { store_name, address, category, legal_id, bank_account } = request.body;
  
  // En un sistema real, este ID provendría del token JWT decodificado en request.user
  const merchantId = request.user?.sub || '22222222-2222-2222-2222-222222222222'; 

  try {
    // 1. Obtener Token de Mapbox (Validar en el servidor por seguridad)
    const mapboxToken = process.env.MAPBOX_SECRET_TOKEN || process.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      return reply.code(500).send({ 
        status: 'error', 
        message: 'Error de configuración: Falta el token de Mapbox en el servidor.' 
      });
    }

    // 2. Ejecutar Geocodificación (Texto plano -> Coordenadas)
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
    const mapboxResponse = await axios.get(geocodeUrl, {
      params: {
        access_token: mapboxToken,
        limit: 1,
        types: 'address,poi' // Priorizar direcciones precisas y puntos de interés
      }
    });

    const features = mapboxResponse.data.features;
    if (!features || features.length === 0) {
      return reply.code(404).send({ 
        status: 'error', 
        message: 'No se encontraron coordenadas exactas para la dirección proporcionada. Intenta ser más específico.' 
      });
    }

    // Mapbox siempre devuelve el formato [longitud, latitud]
    const [lng, lat] = features[0].center;

    // 3. Persistencia en Supabase (PostGIS)
    // Utilizamos el cliente nativo fastify.pg para poder ejecutar ST_MakePoint directamente
    const query = `
      UPDATE public.profiles 
      SET 
        store_name = $1, 
        address = $2, 
        category = $3,
        -- Almacenar metadatos extra si es necesario (asumiendo columna JSON o campos nativos)
        -- legal_id = $4,
        -- bank_account = $5,
        location = ST_SetSRID(ST_MakePoint($4, $5), 4326)
      WHERE id = $6
      RETURNING id, store_name, address;
    `;
    
    // NOTA: Ajustar los índices del query dependiendo de si las columnas legal_id y bank_account 
    // existen estructuralmente en la tabla. Por ahora actualizamos las columnas base confirmadas.
    const values = [store_name, address, category, lng, lat, merchantId];
    
    const { rows } = await request.server.pg.query(query, values);

    if (rows.length === 0) {
      return reply.code(404).send({ 
        status: 'error', 
        message: 'Perfil de comercio no encontrado o no tienes permisos para editarlo.' 
      });
    }

    return reply.send({
      status: 'success',
      message: 'Perfil comercial geolocalizado y actualizado exitosamente.',
      data: {
        ...rows[0],
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
