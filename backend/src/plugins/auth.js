import fp from 'fastify-plugin';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

// Inicializamos el cliente de Supabase con las variables sanitizadas
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

async function authPlugin(fastify, opts) {
  // Middleware / Hook para proteger rutas privadas
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new Error('Falta el encabezado Authorization');
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Utilizamos Supabase directamente para validar el JWT
      // Esto resuelve automáticamente todos los problemas de JWKS, ES256 y rotación de llaves,
      // y además asegura que el usuario no haya sido eliminado o baneado.
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        throw error;
      }
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Inyectamos el usuario en el request para que las rutas puedan usarlo
      request.user = user;
    } catch (err) {
      request.log.error('Authentication Error: ' + err.message);
      reply.code(401).send({ 
        error: 'No autorizado', 
        message: 'Token JWT inválido, expirado o asimétrico', 
        details: err.message 
      });
    }
  });
}

export default fp(authPlugin, { name: 'auth-plugin' });
