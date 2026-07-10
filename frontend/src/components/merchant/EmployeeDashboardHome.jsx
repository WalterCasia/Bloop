import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Plus, Minus, Package } from 'lucide-react';
import MerchantOrdersView from './MerchantOrdersView';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';

const EmployeeDashboardHome = () => {
  const { activeStore } = useStoreContext();
  const [packData, setPackData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const debounceTimer = useRef(null);
  const lastValidStock = useRef(0);
  const pollingInterval = useRef(null);

  const fetchStock = useCallback(async (isInitial = false) => {
    if (!activeStore) return;
    try {
      if (isInitial) setIsLoading(true);
      const response = await apiClient.get(`/api/merchant/stock?storeId=${activeStore.id}`);
      if (response.data.status === 'success') {
        setPackData(response.data.pack);
        if (isInitial) lastValidStock.current = response.data.pack.availableStock;
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setPackData(null);
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    if (activeStore) {
      fetchStock(true);
      pollingInterval.current = setInterval(() => fetchStock(false), 10000);
    }
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [activeStore, fetchStock]);

  const syncStockWithBackend = async (newStock, newStatus) => {
    if (!activeStore || !packData) return;
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
      alert(err.response?.data?.message || 'No se pudo actualizar el inventario.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStockUpdate = (delta) => {
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

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 flex flex-col animate-fade-in">
      <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Inicio Operativo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Área Principal (Izquierda) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Acción Primaria: Escáner QR */}
          <div className="bg-white p-8 rounded-3xl border-4 border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <QrCode size={48} className="text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Validar Pedido</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Escanea el código QR que el cliente te mostrará en su pantalla para entregar el paquete.
            </p>
            <button className="w-full sm:w-auto px-12 py-5 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-900 active:scale-95 transition-all shadow-lg">
              Abrir Escáner QR
            </button>
          </div>

          {/* Tabla Minimalista de Pedidos */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">
              Pendientes de Retiro (Hoy)
            </h3>
            <MerchantOrdersView hideHeader={true} defaultTab="active" />
          </div>

        </div>

        {/* Área Lateral (Derecha): Control de Stock */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sticky top-24 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excedente Diario</h3>
            <p className="text-gray-500 text-sm mb-8">
              Ajusta la cantidad de paquetes sorpresa disponibles para hoy.
            </p>

            {isLoading ? (
              <div className="py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : packData ? (
              <>
                <div className="flex items-center justify-center gap-8 mb-8 w-full relative">
                  <button 
                    onClick={() => handleStockUpdate(-1)}
                    disabled={packData.availableStock <= 0 || packData.status === 'SOLD_OUT'}
                    className="w-20 h-20 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-50 disabled:active:scale-100"
                  >
                    <Minus size={40} strokeWidth={3} />
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-6xl font-black text-gray-900 w-24 tabular-nums">
                      {packData.availableStock}
                    </div>
                    {isUpdating && <div className="absolute top-0 right-0 mt-2 mr-2 w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>}
                  </div>

                  <button 
                    onClick={() => handleStockUpdate(1)}
                    className="w-20 h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black active:scale-90 transition-all"
                  >
                    <Plus size={40} strokeWidth={3} />
                  </button>
                </div>

                <div className={`w-full p-4 rounded-xl font-semibold border ${packData.status === 'SOLD_OUT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {packData.status === 'SOLD_OUT' ? 'Agotado por hoy' : 'Inventario en línea'}
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 text-sm w-full">
                No hay packs activos hoy. Pídele a tu gerente que configure uno.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboardHome;
