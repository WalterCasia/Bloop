import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Download, TrendingUp, Package, Leaf, AlertTriangle } from 'lucide-react';

const MerchantPerformanceView = () => {
  const { activeStore, isLoadingStores } = useStoreContext();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!activeStore) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/api/merchant/stats?storeId=${activeStore.id}`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const exportToCSV = () => {
    if (!stats || !stats.chartData) return;
    
    // Headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Dia,Ingresos (Q),Packs Salvados,Packs Desperdiciados\n";
    
    // Rows
    stats.chartData.forEach(row => {
      const line = `${row.date},${row.dayName},${row.revenue},${row.saved},${row.wasted}`;
      csvContent += line + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bloop_Reporte_${activeStore?.name.replace(/\s+/g, '_')}_7dias.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingStores || isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
        <AlertTriangle size={48} className="mb-4 text-gray-300" />
        <p className="font-bold text-lg text-gray-900">No hay datos disponibles</p>
        <p className="text-sm">Vuelve más tarde cuando hayan transcurrido más días.</p>
      </div>
    );
  }

  const { summary, chartData } = stats;
  // Cálculo de Impacto Ecológico (2.5 kg de CO2 por pack salvado estimado)
  const co2Saved = (summary.totalSaved * 2.5).toFixed(1);

  return (
    <div className="animate-fade-in pb-12 max-w-6xl mx-auto">
      
      {/* Header View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Rendimiento</h1>
          <p className="text-gray-500 font-medium">Analíticas de los últimos 7 días para <span className="font-bold text-gray-900">{activeStore?.name}</span>.</p>
        </div>
        
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      {/* Tarjetas de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* KPI: Ingresos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Últimos 7 Días</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Ingresos Totales</p>
            <h3 className="text-4xl font-black text-gray-900">Q{summary.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        {/* KPI: Packs Salvados */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Últimos 7 Días</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Packs Salvados</p>
            <h3 className="text-4xl font-black text-gray-900">{summary.totalSaved}</h3>
          </div>
        </div>

        {/* KPI: Impacto Ecológico (Diferenciado visualmente) */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 shadow-md text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center">
              <Leaf size={20} />
            </div>
            <span className="text-xs font-bold text-green-100 uppercase tracking-wider">Impacto Real</span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-green-100 mb-1">CO₂ Ahorrado al Planeta</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black">{co2Saved}</h3>
              <span className="text-lg font-bold text-green-200">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfica de Tendencias (Recharts) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-black text-gray-900 mb-6">Packs: Salvados vs Desperdiciados</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="dayName" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
              />
              <RechartsTooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="saved" name="Packs Salvados" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="wasted" name="Packs Desperdiciados" fill="#F87171" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};

export default MerchantPerformanceView;
