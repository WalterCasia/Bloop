
import pg from "pg";
const { Client } = pg;
const client = new Client("postgresql://postgres:OcarinA1721$@db.rcatkcuspudpmunpjzjm.supabase.co:5432/postgres");
async function run() {
  try {
    await client.connect();
    console.log("Connected to DB!");
    const res = await client.query("SELECT id FROM public.stores LIMIT 1");
    if(res.rows.length === 0) { console.log("No stores"); return; }
    const storeId = res.rows[0].id;
    console.log("Using storeId", storeId);
    
    const insertQuery = `
      INSERT INTO public.surprise_packs 
      (store_id, title, original_price, discounted_price, available_quantity, total_quantity, pickup_start_time, pickup_end_time, is_active, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
      RETURNING id
    `;
    const values = [storeId, "Test Pack", 75.0, 24.75, 0, 0, "2026-07-08 01:00:00-06", "2026-07-08 22:00:00-06", null];
    const insertRes = await client.query(insertQuery, values);
    console.log("Inserted:", insertRes.rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}
run();

