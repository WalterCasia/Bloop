import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import buildGetJwks from 'get-jwks';
import { config } from '../config/env.js';

// Importante: jwksPath vacío porque pasaremos la URL exacta con los parámetros a `domain`
const getJwks = buildGetJwks({ jwksPath: '' });

async function authPlugin(fastify, opts) {
  await fastify.register(fastifyJwt, {
    // Si la llave cambió a asimétrica (ECC/RS256), obtenemos la pública dinámicamente
    secret: async (request, token) => {
      if (token && token.header && token.header.kid) {
        try {
          // La ruta exacta de JWKS en Supabase es /auth/v1/.well-known/jwks.json
          const domain = `${config.supabaseUrl}/auth/v1/.well-known/jwks.json?apikey=${config.supabaseAnonKey}`;
          
          const publicKey = await getJwks.getPublicKey({ 
            kid: token.header.kid, 
            domain: domain 
          });
          return publicKey;
        } catch (err) {
          request.log.error('Error fetching JWKS: ' + err.message);
          return config.jwtSecret;
        }
      }
      return config.jwtSecret;
    },
    verify: {
      algorithms: ['HS256', 'ES256', 'RS256']
    }
  });

  // Middleware / Hook para proteger rutas privadas
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      request.log.error('JWT Verification Error: ' + err.message);
      reply.code(401).send({ error: 'No autorizado', message: 'Token JWT inválido o ausente', details: err.message });
    }
  });
}

// Envuelve el plugin con fp para que fastify.authenticate esté disponible globalmente
export default fp(authPlugin, { name: 'auth-plugin' });
