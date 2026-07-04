import fp from 'fastify-plugin';
import fastifyPostgres from '@fastify/postgres';
import { config } from '../config/env.js';

async function dbPlugin(fastify, opts) {
  await fastify.register(fastifyPostgres, {
    connectionString: config.databaseUrl,
  });
}

// Envuelve el plugin con fp para que fastify.pg esté disponible globalmente
export default fp(dbPlugin, { name: 'db-plugin' });
