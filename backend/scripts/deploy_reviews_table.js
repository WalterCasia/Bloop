import fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = fastify();

app.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL
});

app.ready(async (err) => {
  if (err) throw err;
  
  const client = await app.pg.connect();
  try {
    console.log('Creando tabla reviews...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        tags JSONB DEFAULT '[]'::jsonb,
        comment TEXT,
        merchant_reply TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    console.log('Creando indices para reviews...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON public.reviews(store_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
    `);

    console.log('¡Tabla reviews creada con éxito!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
});
