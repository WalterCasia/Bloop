export default async function statsRoutes(fastify, options) {
  
  fastify.get('/api/merchant/stats', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const queryStoreId = request.query.storeId;
    const client = await fastify.pg.connect();

    try {
      const userId = request.user.sub || request.user.id;
      let actualStoreId = queryStoreId;

      if (!actualStoreId) {
        const storeRes = await client.query(`SELECT id FROM public.stores WHERE owner_id = $1 LIMIT 1`, [userId]);
        if (storeRes.rows.length > 0) {
          actualStoreId = storeRes.rows[0].id;
        } else {
          const profileRes = await client.query(`SELECT assigned_store_id FROM public.profiles WHERE id = $1`, [userId]);
          if (profileRes.rows.length > 0 && profileRes.rows[0].assigned_store_id) {
            actualStoreId = profileRes.rows[0].assigned_store_id;
          }
        }
      } else {
        // Validar propiedad
        const storeCheck = await client.query(`SELECT id FROM public.stores WHERE id = $1 AND owner_id = $2`, [actualStoreId, userId]);
        if (storeCheck.rowCount === 0) {
          const profileCheck = await client.query(`SELECT id FROM public.profiles WHERE id = $1 AND assigned_store_id = $2`, [userId, actualStoreId]);
          if (profileCheck.rowCount === 0) {
             return reply.code(403).send({ error: 'Forbidden', message: 'No tienes acceso a esta sucursal.' });
          }
        }
      }

      if (!actualStoreId) {
        return reply.code(404).send({ status: 'error', message: 'No tienes una sucursal asignada.' });
      }

      // 1. Calcular packs vendidos y ganancias agrupadas por fecha (Últimos 7 días)
      const salesQuery = `
        SELECT 
          DATE(created_at) as date, 
          SUM(quantity) as saved_packs, 
          SUM(total_amount) as revenue
        FROM public.orders
        WHERE store_id = $1 
          AND status IN ('PAGADO', 'RECOGIDO') 
          AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
      `;
      const { rows: salesRows } = await client.query(salesQuery, [actualStoreId]);

      // 2. Calcular packs desperdiciados (Últimos 7 días)
      const wasteQuery = `
        SELECT 
          DATE(pickup_end_time) as date, 
          SUM(available_quantity) as wasted_packs
        FROM public.surprise_packs
        WHERE store_id = $1 
          AND pickup_end_time < NOW() 
          AND available_quantity > 0
          AND pickup_end_time >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(pickup_end_time)
      `;
      const { rows: wasteRows } = await client.query(wasteQuery, [actualStoreId]);

      // 3. Generar la estructura continua de 7 días (incluyendo días con ceros)
      const today = new Date();
      const last7Days = [];
      const daysMap = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        // Formato YYYY-MM-DD
        const dateStr = d.toISOString().split('T')[0];
        
        // Formato corto para la gráfica (Ej: "Lun", "Mar")
        const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
        
        const initialData = {
          date: dateStr,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          revenue: 0,
          saved: 0,
          wasted: 0
        };
        
        last7Days.push(initialData);
        daysMap[dateStr] = initialData;
      }

      // 4. Mapear resultados de SQL al arreglo
      salesRows.forEach(row => {
        // En pg, los campos de fecha a veces retornan Date objects.
        const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
        if (daysMap[dateStr]) {
          daysMap[dateStr].revenue = parseFloat(row.revenue);
          daysMap[dateStr].saved = parseInt(row.saved_packs, 10);
        }
      });

      wasteRows.forEach(row => {
        const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
        if (daysMap[dateStr]) {
          daysMap[dateStr].wasted = parseInt(row.wasted_packs, 10);
        }
      });

      // 5. Calcular KPIs Totales
      let totalRevenue = 0;
      let totalSaved = 0;
      let totalWasted = 0;

      last7Days.forEach(day => {
        totalRevenue += day.revenue;
        totalSaved += day.saved;
        totalWasted += day.wasted;
      });

      return reply.code(200).send({
        status: 'success',
        summary: {
          totalRevenue,
          totalSaved,
          totalWasted
        },
        chartData: last7Days
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error', message: 'No se pudieron cargar las estadísticas.' });
    } finally {
      client.release();
    }
  });
}
