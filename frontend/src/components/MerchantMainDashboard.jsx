import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useStoreContext } from '../contexts/StoreContext';
import QRScannerModal from './QRScannerModal';
import { QrCode, Clock, DollarSign, PackageCheck, PackageOpen, ChevronRight, CheckCircle2 } from 'lucide-react';

const MerchantMainDashboard = () => {
  const { user } = useAuth();
  const { activeStore, isLoadingStores } = useStoreContext();
  const navigate = useNavigate();
  
  const [packData, setPackData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const debounceTimer = useRef(null);
  const lastValidStock = useRef(0);
  const pollingInterval = useRef(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!activeStore) return;
    try {
      if (isInitial) setIsLoading(true);
      
      const [stockRes, ordersRes] = await Promise.all([
        apiClient.get(`/api/merchant/stock?storeId=${activeStore.id}`).catch(err => {
          if (err.response?.status === 404) return { data: { pack: null } };
          throw err;
        }),
        apiClient.get(`/api/merchant/orders?storeId=${activeStore.id}`).catch(err => {
          console.error("Error fetching orders:", err);
          return { data: { orders: [] } };
        })
      ]);

      if (stockRes.data.pack) {
        setPackData(stockRes.data.pack);
        if (isInitial) lastValidStock.current = stockRes.data.pack.availableStock;
      } else {
        setPackData(null);
      }

      if (ordersRes.data.orders) {
        setOrders(ordersRes.data.orders);
      }
    } catch (err) {
      if (isInitial) {
        setErrorModal({
          title: 'Error de Conexión',
          message: err.response?.data?.message || 'No se pudo cargar el panel de tienda.'
        });
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    if (user && activeStore) {
      fetchData(true);
      pollingInterval.current = setInterval(() => {
        fetchData(false);
      }, 10000);
    }
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [user, activeStore, fetchData]);

  const syncStockWithBackend = async (newStock, newStatus) => {
    try {
      setIsUpdating(true);
      await apiClient.patch('/api/merchant/stock', {
        packId: packData.id,
        availableStock: newStock,
        status: newStatus,
        storeId: activeStore.id
      });
      lastValidStock.current = newStock;
    } catch (err) {
      setPackData(prev => ({ 
        ...prev, 
        availableStock: lastValidStock.current, 
        status: newStatus === 'SOLD_OUT' ? 'ACTIVE' : prev.status 
      }));
      setErrorModal({
        title: 'Sincronización Rechazada',
        message: err.response?.data?.message || 'No se pudo actualizar el inventario. Verifique su conexión.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStockChange = (delta) => {
    if (!packData) return;
    if (delta < 0 && (packData.availableStock <= 0 || packData.status === 'SOLD_OUT')) return;
    
    const newStock = packData.availableStock + delta;
    if (newStock < 0) return;

    const newStatus = newStock > 0 ? 'ACTIVE' : packData.status;
    setPackData(prev => ({ ...prev, availableStock: newStock, status: newStatus }));

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      syncStockWithBackend(newStock, newStatus);
    }, 600);
  };

  const handleSoldOut = async () => {
    if (!packData || packData.status === 'SOLD_OUT') return;
    const confirmAction = window.confirm('¿Deseas marcar el inventario como agotado por hoy? Esto cancelará todas las reservas que no se hayan pagado aún.');
    if (!confirmAction) return;

    setPackData(prev => ({ ...prev, availableStock: 0, status: 'SOLD_OUT' }));
    await syncStockWithBackend(0, 'SOLD_OUT');
  };

  const handleScannerSuccess = (orderData) => {
    setShowScanner(false);
    alert(`¡Pedido validado exitosamente para el pack: ${orderData.pack_title}!`);
    fetchData(false); 
  };

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
        fetchData(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al validar el pedido manualmente.');
    }
  };

  if (isLoading || isLoadingStores) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Cálculos de métricas
  const reservedOrders = orders.filter(o => o.status === 'PAGADO').reduce((sum, o) => sum + o.quantity, 0);
  const deliveredOrders = orders.filter(o => o.status === 'RECOGIDO').reduce((sum, o) => sum + o.quantity, 0);
  
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.first_name || 'Comerciante';

  return (
    <div className="animate-fade-in pb-12">
      {/* Modales */}
      {showScanner && (
        <QRScannerModal 
          onClose={() => setShowScanner(false)} 
          onSuccess={handleScannerSuccess} 
          activeStore={activeStore}
        />
      )}
      {errorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-black text-red-600 mb-2">{errorModal.title}</h3>
            <p className="text-gray-600 text-sm font-medium mb-6">{errorModal.message}</p>
            <button 
              onClick={() => setErrorModal(null)}
              className="flex items-center justify-center min-h-[48px] w-full bg-gray-900 text-white font-bold rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Grid Asimétrico: Columna Principal (Izquierda) y Barra Lateral (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= COLUMNA IZQUIERDA (2/3) ================= */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Saludo y Resumen */}
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Buenas tardes, {userName}</h1>
            <p className="text-gray-500 mt-1 font-medium">Aquí tienes el resumen de hoy para <span className="text-gray-900 font-bold">{activeStore?.name}</span>.</p>
          </div>

          {/* 2. Tarjetas de Métricas (Quick Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Ventas Hoy</span>
              </div>
              <span className="text-2xl font-black text-gray-900">--</span>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <PackageOpen size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Reservados</span>
              </div>
              <span className="text-2xl font-black text-blue-600">{reservedOrders}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <PackageCheck size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Entregados</span>
              </div>
              <span className="text-2xl font-black text-green-600">{deliveredOrders}</span>
            </div>
          </div>

          {/* 3. Módulo Gigante de Control de Stock Táctil */}
          {packData ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Stock de Hoy</h2>
                  <h3 className="text-xl font-bold text-gray-900">{packData.title}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${packData.status === 'SOLD_OUT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {packData.status === 'SOLD_OUT' ? 'Agotado' : 'Activo'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                <div className="flex-1 w-full text-center sm:text-left">
                  <span className="text-6xl font-black text-gray-900 tracking-tighter block mb-2">
                    {packData.availableStock}
                  </span>
                  <span className="text-sm font-medium text-gray-500">Unidades Disponibles</span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => handleStockChange(-1)}
                    disabled={packData.availableStock <= 0 || packData.status === 'SOLD_OUT'}
                    className="w-20 h-20 bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-4xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation transition-colors"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center justify-center w-16">
                    <span className="text-xs font-bold text-gray-400 uppercase">Sinc.</span>
                    {isUpdating ? (
                      <div className="mt-2 w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 size={16} className="text-green-500 mt-2" />
                    )}
                  </div>
                  <button 
                    onClick={() => handleStockChange(1)}
                    className="w-20 h-20 bg-gray-900 text-white rounded-full flex justify-center items-center font-black text-4xl hover:bg-gray-800 active:bg-gray-700 touch-manipulation transition-colors shadow-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSoldOut}
                disabled={packData.status === 'SOLD_OUT' || isUpdating}
                className={`flex items-center justify-center min-h-[56px] w-full rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${
                  packData.status === 'SOLD_OUT' 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm'
                }`}
              >
                {packData.status === 'SOLD_OUT' ? 'AGOTADO POR HOY' : 'MARCAR COMO AGOTADO (EMERGENCIA)'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 text-center">
              <PackageOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No hay Packs activos</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">No tienes inventario disponible para vender hoy. Crea tu pack para comenzar a recibir reservas.</p>
              <Link 
                to="/merchant/create-pack"
                className="inline-flex items-center justify-center min-h-[48px] bg-gray-900 text-white font-bold px-6 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Crear Pack Sorpresa
              </Link>
            </div>
          )}

          {/* 4. Lista en Vivo de Pedidos del Día */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Pedidos para Hoy</h3>
              <span className="bg-gray-100 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">{orders.length} totales</span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-medium">
                Aún no tienes pedidos para hoy.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="border border-gray-100 rounded-2xl p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900">{order.client_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          order.status === 'RECOGIDO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                        {order.status === 'PAGADO' && (
                          <span className="text-xs text-gray-500 font-mono">Token: {order.validation_token.substring(0,6)}...</span>
                        )}
                      </div>
                    </div>
                    {order.status === 'PAGADO' && (
                      <button
                        onClick={() => markOrderDeliveredManual(order.validation_token)}
                        className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors border border-green-200"
                      >
                        Entregar Manual
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* ================= COLUMNA DERECHA (1/3) ================= */}
        <div className="space-y-6">
          
          {/* Botón Primario de Escáner */}
          <button 
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center justify-center gap-3 w-full bg-black text-white rounded-3xl p-8 shadow-xl hover:bg-gray-900 active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <QrCode size={48} strokeWidth={1.5} className="mb-2" />
            <span className="font-black text-xl">Escanear QR</span>
            <span className="text-gray-400 text-sm font-medium">Validar pedido de cliente</span>
          </button>

          {/* Enlaces Rápidos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Accesos Rápidos</h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/merchant/settings')}
                className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Editar horario</p>
                    <p className="text-xs text-gray-500 font-medium">Ajustar horas de recogida</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/merchant/settings')}
                className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Ajustar precio</p>
                    <p className="text-xs text-gray-500 font-medium">Modificar el valor del Pack</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default MerchantMainDashboard;
