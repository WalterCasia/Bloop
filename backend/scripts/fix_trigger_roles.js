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
    const res = await client.query("SELECT pg_get_functiondef('public.handle_new_user'::regproc);");
    console.log("OLD TRIGGER:");
    console.log(res.rows[0].pg_get_functiondef);

    console.log('Updating handle_new_user to map OWNER and STAFF to COMERCIO...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, role, full_name, avatar_url)
        VALUES (
          NEW.id,
          CASE 
            WHEN NEW.raw_user_meta_data->>'role' IN ('OWNER', 'STAFF', 'COMERCIO') THEN 'COMERCIO'::public.user_role
            WHEN NEW.raw_user_meta_data->>'role' IS NULL THEN 'CLIENTE'::public.user_role
            ELSE (NEW.raw_user_meta_data->>'role')::public.user_role
          END,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
          NEW.raw_user_meta_data->>'avatar_url'
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    console.log("TRIGGER UPDATED!");
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
});
