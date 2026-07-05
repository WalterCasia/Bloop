import 'dotenv/config';

// Definimos las variables de entorno estrictamente necesarias para operar
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  supabaseUrl: (process.env.SUPABASE_URL || 'https://rcatkcuspudpmunpjzjm.supabase.co').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYXRrY3VzcHVkcG11bnBqemptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTkyMTMsImV4cCI6MjA5ODY3NTIxM30.vzNghUbiFNo0I1oXakz9uc1bGr6Hyz9p0ksiu7Wa100',
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  }
};

/**
 * Valida de forma estricta que todas las variables de entorno requeridas existan.
 * Debe ejecutarse antes de levantar el servidor Fastify.
 */
export function validateEnv() {
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(`CRÍTICO: Faltan variables de entorno obligatorias para levantar el servidor: ${missingVars.join(', ')}`);
  }
}
