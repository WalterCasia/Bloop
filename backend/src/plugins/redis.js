import fp from 'fastify-plugin';
import { Redis } from '@upstash/redis';
import { config } from '../config/env.js';

async function redisPlugin(fastify, opts) {
  const redisClient = new Redis({
    url: config.upstash.url,
    token: config.upstash.token,
  });

  fastify.decorate('redis', redisClient);
}

// Envuelve el plugin con fp para que fastify.redis esté disponible globalmente
export default fp(redisPlugin, { name: 'redis-plugin' });
