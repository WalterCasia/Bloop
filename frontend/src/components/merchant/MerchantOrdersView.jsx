import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';
import { Search, CheckCircle2, Clock, XCircle, SearchX } from 'lucide-react';

const MerchantOrdersView = () => {
  const { activeStore, isLoadingStores } = useStoreContext();
  
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchOrders = useCallback(async () => {
    if (!activeStore) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/api/merchant/orders?storeId=${activeStore.id}&type=${activeTab}&limit=50`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore, activeTab]);

  useEffect(() => {
    fetchOrders();
    // Refresh periodicamente solo en activos
    let interval;
    if (activeTab === 'active') {
      interval = setInterval(fetchOrders, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchOrders, activeTab]);

  const markOrderDeliveredManual = async (validationToken) => {
    try {
      const confirmAction = window.confirm('¿Confirmar entrega manual de este pedido?');
      if (!confirmAction) return;
      
      const response = await apiClient.post('/api/merchant/orders/validate', { 
        qr_code: validationToken,
        storeId: activeStore.id
      });
      if (response.data.status === 'success') {
        alert('Pedido marcado como entregado.');
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al validar el pedido manualmente.');
    }
  };

  // Filtrado local
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    const nameMatch = order.client_name?.toLowerCase().includes(query);
    const tokenMatch = order.validation_token?.toLowerCase().includes(query);
    return nameMatch || tokenMatch;
  });

  if (isLoadingStores) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12">
      {/* Header View */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Gestión de Pedidos</h1>
        <p className="text-gray-500 font-medium">Visualiza y administra las reservas de tus clientes.</p>
      </div>

      {/* Toolbar: Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('active'); setSearchQuery(''); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => { setActiveTab('history'); setSearchQuery(''); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
            <SearchX size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-900 mb-1">No se encontraron pedidos</p>
            <p className="text-sm">Prueba ajustando tu búsqueda o cambiando de pestaña.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Cliente</th>
                  <th className="p-4">Pack</th>
                  <th className="p-4">Cantidad</th>
                  <th className="p-4">Código / Estado</th>
                  <th className="p-4">Fecha</th>
                  {activeTab === 'active' && <th className="p-4 pr-6 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-gray-900">{order.client_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600 font-medium">{order.pack_title}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200">
                        {order.quantity} un.
                      </span>
                    </td>
                    <td className="p-4">
                      {order.status === 'PAGADO' && (
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">
                          {order.validation_token?.substring(0, 8)}...
                        </span>
                      )}
                      {order.status === 'RECOGIDO' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-100">
                          <CheckCircle2 size={14} /> Entregado
                        </span>
                      )}
                      {order.status === 'CANCELADO' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-100">
                          <XCircle size={14} /> Cancelado
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <Clock size={14} />
                        {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    {activeTab === 'active' && (
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => markOrderDeliveredManual(order.validation_token)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm"
                        >
                          Entregar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantOrdersView;
