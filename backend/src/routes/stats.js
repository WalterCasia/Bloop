export default async function statsRoutes(fastify, options) {
  
  fastify.get('/api/merchant/stats', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const storeId = request.user.sub || request.user.id;
    const client = await fastify.pg.connect();

    try {
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
      const { rows: salesRows } = await client.query(salesQuery, [storeId]);

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
      const { rows: wasteRows } = await client.query(wasteQuery, [storeId]);

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
