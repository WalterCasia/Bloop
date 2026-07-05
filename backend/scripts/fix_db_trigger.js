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
    console.log('Eliminando restriccion valid_store_profile que bloquea registros en blanco...');
    await client.query(`
      ALTER TABLE public.profiles 
      DROP CONSTRAINT IF EXISTS valid_store_profile;
    `);

    console.log('Creando funcion trigger para auth.users...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, role, full_name, avatar_url)
        VALUES (
          NEW.id,
          COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'CLIENTE'),
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
          NEW.raw_user_meta_data->>'avatar_url'
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('Asignando trigger a auth.users...');
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    
    // For existing users missing profiles, we insert them manually
    console.log('Sincronizando usuarios existentes...');
    await client.query(`
      INSERT INTO public.profiles (id, role, full_name)
      SELECT id, 
             COALESCE((raw_user_meta_data->>'role')::public.user_role, 'CLIENTE'),
             COALESCE(raw_user_meta_data->>'full_name', email, 'Usuario')
      FROM auth.users
      WHERE id NOT IN (SELECT id FROM public.profiles)
    `);

    console.log('¡Base de datos actualizada con exito!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
});
