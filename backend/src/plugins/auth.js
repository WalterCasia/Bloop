import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import buildGetJwks from 'get-jwks';
import { config } from '../config/env.js';

const getJwks = buildGetJwks();

async function authPlugin(fastify, opts) {
  await fastify.register(fastifyJwt, {
    // Si la llave cambió a asimétrica (ECC/RS256), obtenemos la pública dinámicamente
    secret: async (request, token) => {
      if (token && token.header && token.header.kid) {
        try {
          const domain = `${config.supabaseUrl}/auth/v1/jwks`;
          const publicKey = await getJwks.getPublicKey({ kid: token.header.kid, domain });
          return publicKey;
        } catch (err) {
          request.log.error('Error fetching JWKS: ' + err.message);
          return config.jwtSecret;
        }
      }
      return config.jwtSecret;
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
