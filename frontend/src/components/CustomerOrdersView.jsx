import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import OrderRedemptionModal from './OrderRedemptionModal';

/**
 * Vista de Gestión de Pedidos del Consumidor con Pestañas
 */
const CustomerOrdersView = () => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past' | 'cancelled'
  const [orders, setOrders] = useState({ active: [], past: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/api/orders/me');
        if (response.data.status === 'success') {
          const fetchedOrders = response.data.data;
          
          setOrders({
            active: fetchedOrders.filter(o => o.status === 'RESERVED'),
            past: fetchedOrders.filter(o => o.status === 'DELIVERED'),
            cancelled: fetchedOrders.filter(o => o.status === 'CANCELLED' || o.status === 'EXPIRED')
          });
        }
      } catch (err) {
        setError('Ocurrió un error al cargar tus pedidos.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const displayedOrders = orders[activeTab];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Cabecera y Tabs */}
      <div className="bg-white px-5 pt-8 pb-0 shadow-sm shrink-0 z-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">Mis Pedidos</h1>
        <div className="flex space-x-6 border-b border-gray-200 overflow-x-auto hide-scrollbar">
          {[
            { id: 'active', label: 'Activos' },
            { id: 'past', label: 'Pasados' },
            { id: 'cancelled', label: 'Cancelados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-bold text-sm transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.id === 'active' && orders.active.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px]">
                  {orders.active.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Pedidos */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
            <p className="text-red-600 font-medium text-sm">{error}</p>
          </div>
        )}
        
        {!loading && !error && displayedOrders.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">No tienes pedidos en esta categoría.</p>
          </div>
        )}
        
        {!loading && !error && displayedOrders.map(order => (
          <div 
            key={order.id} 
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 flex flex-col transition-shadow hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-900 truncate pr-2">{order.store_name}</h3>
              <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded tracking-widest uppercase">
                #{String(order.id).slice(0, 8)}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 mb-5">{order.pack_title}</p>
            
            <div className="flex justify-between items-center mt-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total pagado</span>
                <span className="font-black text-lg text-green-600 leading-none">${Number(order.total_price || 0).toFixed(2)}</span>
              </div>
              
              {activeTab === 'active' && (
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-transform active:scale-95"
                >
                  Ver Ticket QR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Renderizado Condicional del Modal */}
      {selectedOrder && (
        <OrderRedemptionModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default CustomerOrdersView;
