import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config/env.js';

async function authPlugin(fastify, opts) {
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
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
