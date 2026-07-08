import fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const app = fastify();
app.register(fastifyPostgres, { connectionString: process.env.DATABASE_URL });
app.ready(async () => {
  const client = await app.pg.connect();
  try {
    const res = await client.query("SELECT * FROM public.profiles WHERE merchant_role = 'EMPLOYEE'");
    console.log(res.rows);
  } finally {
    client.release();
    process.exit(0);
  }
});
