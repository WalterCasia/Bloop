import pg from "pg";
const { Client } = pg;
const client = new Client("postgresql://postgres:OcarinA1721$@db.rcatkcuspudpmunpjzjm.supabase.co:5432/postgres");
async function run() {
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.favorite_stores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          UNIQUE(client_id, store_id)
      );

      ALTER TABLE public.favorite_stores ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view their own favorite stores" ON public.favorite_stores;
      CREATE POLICY "Users can view their own favorite stores"
          ON public.favorite_stores FOR SELECT
          USING (auth.uid() = client_id);

      DROP POLICY IF EXISTS "Users can insert their own favorite stores" ON public.favorite_stores;
      CREATE POLICY "Users can insert their own favorite stores"
          ON public.favorite_stores FOR INSERT
          WITH CHECK (auth.uid() = client_id);

      DROP POLICY IF EXISTS "Users can delete their own favorite stores" ON public.favorite_stores;
      CREATE POLICY "Users can delete their own favorite stores"
          ON public.favorite_stores FOR DELETE
          USING (auth.uid() = client_id);
    `);
    console.log("Migration applied successfully!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}
run();
