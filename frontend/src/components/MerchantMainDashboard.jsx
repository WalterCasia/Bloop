import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useStoreContext } from '../contexts/StoreContext';
import MerchantBranchSelector from './MerchantBranchSelector';
import QRScannerModal from './QRScannerModal';

const MerchantMainDashboard = () => {
  const { user } = useAuth();
  const { activeStore, isLoadingStores } = useStoreContext();
  
  const [packData, setPackData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const debounceTimer = useRef(null);
  const lastValidStock = useRef(0);
  const pollingInterval = useRef(null);

  // Cargar datos de stock y pedidos
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
  }, []);

  useEffect(() => {
    if (user && activeStore) {
      fetchData(true);
      
      // Polling cada 10 segundos para actualizar pedidos en vivo
      pollingInterval.current = setInterval(() => {
        fetchData(false);
      }, 10000);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [user, activeStore, fetchData]);

  // Sincronización asíncrona de stock (Optimistic UI)
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
    fetchData(false); // Refrescar lista
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
        fetchData(false); // Refrescar vista
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al validar el pedido manualmente.');
    }
  };

  if (isLoading || isLoadingStores) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        {isLoadingStores && <p className="mt-4 text-gray-500 font-medium">Cargando sucursales...</p>}
      </div>
    );
  }

  if (!packData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="max-w-md mx-auto w-full p-4 mt-2">
          <header className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel Operativo</h1>
            <MerchantBranchSelector />
          </header>
        </div>
        <div className="flex-1 flex justify-center items-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-gray-100">
             <p className="text-gray-800 font-bold mb-2">Sin Packs Activos</p>
           <p className="text-sm text-gray-500 mb-6">No tienes ningún Pack Sorpresa para el día de hoy.</p>
           <Link 
             to="/merchant/create-pack"
             className="flex items-center justify-center min-h-[48px] w-full bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 rounded-xl shadow-md transition-colors"
           >
             Crear mi primer Pack
           </Link>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans touch-manipulation pb-24">
      
      {showScanner && (
        <QRScannerModal 
          onClose={() => setShowScanner(false)} 
          onSuccess={handleScannerSuccess} 
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

      <div className="max-w-md mx-auto mt-2">
        {/* Encabezado de Estado Diario */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel Operativo</h1>
            <p className="text-gray-500 font-medium text-sm mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${packData.status === 'SOLD_OUT' ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {packData.status === 'SOLD_OUT' ? 'Agotado hoy' : 'Activo y visible'}
            </p>
          </div>
          <MerchantBranchSelector />
        </header>

        {/* Tarjeta Central de Control de Stock Efímero */}
        <div className={`bg-white rounded-3xl p-6 shadow-sm border mb-6 transition-colors duration-300 ${
          packData.status === 'SOLD_OUT' ? 'border-red-200 bg-red-50' : 'border-gray-200'
        }`}>
          <h2 className="text-lg font-bold text-gray-900 mb-6 truncate">{packData.title}</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 uppercase mb-1">Reservados</span>
              <span className="text-3xl font-black text-gray-900">{packData.soldUnits || 0}</span>
            </div>
            
            <div className={`p-4 rounded-2xl border flex flex-col items-center ${
              packData.availableStock === 0 ? 'bg-red-100 border-red-200 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
            }`}>
              <span className="text-xs font-bold uppercase mb-1 opacity-80">Disponibles</span>
              <span className="text-4xl font-black">{packData.availableStock}</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-6 mb-6">
            <button 
              onClick={() => handleStockChange(-1)}
              disabled={packData.availableStock <= 0 || packData.status === 'SOLD_OUT'}
              className="w-16 h-16 min-h-[64px] min-w-[64px] bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-3xl shadow-sm hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            >
              -
            </button>
            
            <div className="flex flex-col items-center justify-center w-20">
              <span className="text-xs font-bold text-gray-400 uppercase">Sinc.</span>
              {isUpdating && <div className="mt-2 w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            
            <button 
              onClick={() => handleStockChange(1)}
              className="w-16 h-16 min-h-[64px] min-w-[64px] bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-3xl shadow-sm hover:bg-gray-200 active:bg-gray-300 touch-manipulation"
            >
              +
            </button>
          </div>

          <button 
            onClick={handleSoldOut}
            disabled={packData.status === 'SOLD_OUT' || isUpdating}
            className={`flex items-center justify-center min-h-[56px] w-full rounded-2xl font-black text-base text-white transition-all active:scale-95 ${
              packData.status === 'SOLD_OUT' 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-red-600 hover:bg-red-700 shadow-md'
            }`}
          >
            {packData.status === 'SOLD_OUT' ? 'AGOTADO POR HOY' : 'MARCAR COMO AGOTADO'}
          </button>
        </div>

        {/* Acceso Directo al Validador de Pedidos */}
        <button 
          onClick={() => setShowScanner(true)}
          className="flex items-center justify-center gap-3 min-h-[64px] w-full bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all mb-8 border-2 border-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          <span className="font-black text-lg">Escanear / Validar QR</span>
        </button>

        {/* Lista en Vivo de Pedidos del Día */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Pedidos para Hoy</h3>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{orders.length}</span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-gray-100 rounded-2xl p-6 text-center text-gray-500 text-sm">
              No hay pedidos reservados por el momento.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold text-gray-900">{order.client_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Token: <span className="font-mono bg-gray-100 px-1 rounded">{order.validation_token.substring(0,6)}...</span></p>
                  </div>
                  <button
                    onClick={() => markOrderDeliveredManual(order.validation_token)}
                    className="flex items-center justify-center min-h-[48px] px-4 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition-colors"
                  >
                    Entregar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MerchantMainDashboard;
