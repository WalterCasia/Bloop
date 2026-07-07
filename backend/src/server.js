import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { v2 as cloudinary } from 'cloudinary';
import { config, validateEnv } from './config/env.js';

// Importar plugins modulares
import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';

// 1. Validación estricta de variables de entorno antes de iniciar
validateEnv();

// 2. Inicialización de la instancia de Fastify
const fastify = Fastify({
  logger: true, // Habilitado para trazabilidad de errores en producción/desarrollo
  bodyLimit: 10485760 // 10MB para permitir subida de imágenes en base64
});

// Configuración de Cloudinary (no requiere plugin asíncrono)
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// 3. Registro de Plugins Asíncronos
async function registerPlugins() {
  await fastify.register(cors, {
    origin: '*', // Nota: Restringir a dominios específicos de Vercel en producción
  });
  
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret
  });

  // Plugins personalizados
  await fastify.register(dbPlugin);
  await fastify.register(redisPlugin);
  await fastify.register(authPlugin);

  // Rutas de la API
  await fastify.register(import('./routes/packs.js'));
  await fastify.register(import('./routes/orders.js'));
  await fastify.register(import('./routes/merchant.js'));
  await fastify.register(import('./routes/profiles.js'));
  await fastify.register(import('./routes/stats.js'));
  await fastify.register(import('./routes/webhooks.js'));
  await fastify.register(import('./routes/payments.js'));
  await fastify.register(import('./routes/reviews.js'));
  await fastify.register(import('./routes/reports.js'));

  // 4. Inyección de dependencias síncronas en la instancia de Fastify
  fastify.decorate('cloudinary', cloudinary);
}

// 5. Arranque del Servidor
async function startServer() {
  try {
    await registerPlugins();
    
    // Endpoint de prueba (Healthcheck)
    fastify.get('/api/health', async (request, reply) => {
      // Verificación de conexión a PostgreSQL
      const client = await fastify.pg.connect();
      client.release();
      
      return { status: 'ok', service: 'Bloop API Core', timestamp: new Date().toISOString() };
    });

    await fastify.listen({ port: config.port, host: config.host });
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

startServer();
