import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Package, XCircle, Leaf } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';

const MerchantReportsView = () => {
  const { activeStore } = useStoreContext();
  
  // Rango de fechas por defecto: Últimos 30 días
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: { total_revenue: 0, packs_saved: 0, packs_cancelled: 0 },
    timeseries: [],
    raw_orders: []
  });

  useEffect(() => {
    if (!activeStore) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Añadimos T00:00:00Z para start y T23:59:59Z para end si queremos ser precisos
        const start = `${startDate}T00:00:00Z`;
        const end = `${endDate}T23:59:59Z`;

        const response = await apiClient.get('/api/merchant/reports/analytics', {
          params: { storeId: activeStore.id, startDate: start, endDate: end }
        });

        if (response.data.status === 'success') {
          setData(response.data);
        }
      } catch (err) {
        setError('No se pudieron cargar los datos analíticos.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [activeStore, startDate, endDate]);

  const exportToCSV = () => {
    if (!data.raw_orders || data.raw_orders.length === 0) return;

    const headers = ['Fecha', 'ID Pedido', 'Estado', 'Monto (GTQ)'];
    
    const rows = data.raw_orders.map(order => {
      return [
        new Date(order.created_at).toLocaleString('es-ES'),
        order.id,
        order.status,
        Number(order.total_amount).toFixed(2)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${activeStore.name}_${startDate}_al_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  };

  if (!activeStore) {
    return (
      <div className="p-8 flex justify-center text-gray-500 font-medium">
        Por favor, selecciona una sucursal para ver sus reportes.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Rendimiento y Reportes</h1>
          <p className="text-gray-500 font-medium text-lg">Métricas analíticas de {activeStore.name}</p>
        </div>
        
        {/* Filtros de Fecha y Exportación */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer px-2"
            />
            <span className="text-gray-400 font-bold text-sm">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer px-2"
            />
          </div>
          
          <button
            onClick={exportToCSV}
            disabled={loading || data.raw_orders.length === 0}
            className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar a CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">Ventas Totales</h3>
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">
            {loading ? <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div> : formatCurrency(data.summary.total_revenue)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">Packs Salvados</h3>
            <div className="p-2 bg-blue-50 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">
            {loading ? <div className="h-9 bg-gray-200 rounded w-16 animate-pulse"></div> : data.summary.packs_saved}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">Cancelados</h3>
            <div className="p-2 bg-red-50 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900">
            {loading ? <div className="h-9 bg-gray-200 rounded w-16 animate-pulse"></div> : data.summary.packs_cancelled}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">CO2 Evitado</h3>
            <div className="p-2 bg-emerald-50 rounded-lg"><Leaf className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
            {loading ? <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div> : (data.summary.packs_saved * 2.5).toFixed(1)}
            {!loading && <span className="text-sm font-bold text-gray-400">kg</span>}
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencia */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="text-xl font-extrabold text-gray-900 mb-8">Tendencia de Ventas Diarias</h3>
        
        {loading ? (
          <div className="h-80 w-full flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : data.timeseries.length === 0 ? (
          <div className="h-80 w-full flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-500 font-bold text-sm">No hay datos suficientes para mostrar el gráfico.</p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeseries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value) => `Q${value}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '14px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  name="Ingresos (GTQ)"
                  dataKey="revenue" 
                  stroke="#111827" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  name="Packs Salvados"
                  dataKey="saved" 
                  stroke="#2563EB" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};

export default MerchantReportsView;
