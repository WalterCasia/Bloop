import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import OrderQRModal from './OrderQRModal';

const CustomerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'PAST', 'CANCELLED'
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/api/customer/orders');
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('No pudimos cargar tus pedidos. Por favor verifica tu conexión a internet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
    
    if (searchParams.get('success') === 'true') {
      setShowSuccessAlert(true);
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  }, [user, fetchOrders, searchParams, setSearchParams]);


  // Filtrado de pedidos según pestaña
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ACTIVE') return order.status === 'PAGADO' || order.status === 'RESERVED';
    if (activeTab === 'PAST') return order.status === 'RECOGIDO' || order.status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return order.status === 'CANCELADO' || order.status === 'CANCELLED';
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {showSuccessAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold">¡Pago exitoso! Aquí está tu pedido.</span>
          <button onClick={() => setShowSuccessAlert(false)} className="ml-2 font-bold text-green-900">&times;</button>
        </div>
      )}

      {/* Header Fijo */}
      <div className="bg-white px-4 pt-6 pb-2 border-b sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/explore')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mis Pedidos</h1>
        </div>
        {/* Tabs de Navegación */}
        <div className="flex justify-between items-center mt-4">
          {['ACTIVE', 'PAST', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-green-600 text-green-700' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'ACTIVE' ? 'Activos' : tab === 'PAST' ? 'Pasados' : 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-semibold text-gray-500 animate-pulse">Cargando pedidos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center mt-8">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-white px-4 py-2 rounded-full text-xs font-bold text-red-600 border border-red-200 shadow-sm"
            >
              Reintentar
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center pt-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              {activeTab === 'ACTIVE' ? 'No tienes pedidos activos' : activeTab === 'PAST' ? 'Aún no has recogido packs' : 'No tienes cancelaciones'}
            </h3>
            <p className="text-gray-500 text-sm max-w-[250px] mx-auto mb-8">
              {activeTab === 'ACTIVE' 
                ? 'Descubre comercios a tu alrededor y rescata comida deliciosa hoy mismo.' 
                : 'Cuando recojas un Pack Sorpresa, aparecerá aquí.'}
            </p>
            
            {activeTab === 'ACTIVE' && (
              <button 
                onClick={() => navigate('/explore')}
                className="bg-green-600 text-white font-bold px-8 py-3 rounded-full hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                Explorar Packs
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-20">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => {
                  if (activeTab === 'ACTIVE') setSelectedOrder(order);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{order.store_name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{order.store_address}</p>
                  </div>
                  <span className="font-black text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">
                    ${Number(order.total_price || 0).toFixed(2)}
                  </span>
                </div>
                
                <hr className="border-gray-50 my-3" />
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700 flex flex-col">
                    <span className="text-xs text-gray-400 font-bold uppercase mb-1">Recogida</span>
                    {new Date(order.pickup_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(order.pickup_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {activeTab === 'ACTIVE' && (
                    <button className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full">
                      Ver QR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal del QR (Se renderiza si hay un pedido seleccionado) */}
      {selectedOrder && (
        <OrderQRModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onOrderExpired={fetchOrders}
        />
      )}
    </div>
  );
};

export default CustomerOrders;
