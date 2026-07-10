import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useStoreContext } from '../contexts/StoreContext';
import { Edit2, Trash2 } from 'lucide-react';

const DailyStockDashboard = () => {
  const { user } = useAuth();
  const { activeStore } = useStoreContext();
  
  const [packData, setPackData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorModal, setErrorModal] = useState(null); // { title: '', message: '' }
  const navigate = useNavigate();
  
  const debounceTimer = useRef(null);
  const lastValidStock = useRef(0);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialStock = async () => {
      if (!activeStore) return;
      try {
        setIsLoading(true);
        // El interceptor de Axios (apiClient) inyecta el token automáticamente.
        // Fastify valida el store_id a partir del JWT.
        const response = await apiClient.get(`/api/merchant/stock?storeId=${activeStore.id}`);
        
        if (response.data.status === 'success') {
          setPackData(response.data.pack);
          lastValidStock.current = response.data.pack.availableStock;
        }
      } catch (err) {
        // Si el error es 404, significa que simplemente no hay packs.
        // No mostramos un error, dejamos que muestre la pantalla "Sin Packs Activos".
        if (err.response && err.response.status === 404) {
          setPackData(null);
        } else {
          setErrorModal({
            title: 'Error de Conexión',
            message: err.response?.data?.message || 'No se pudo cargar el inventario actual.'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user && activeStore) {
      fetchInitialStock();
    }
  }, [user, activeStore]);

  // Sincronización asíncrona (PATCH)
  const syncStockWithBackend = async (newStock, newStatus) => {
    if (!activeStore) return;
    try {
      setIsUpdating(true);
      
      await apiClient.patch('/api/merchant/stock', {
        packId: packData.id,
        availableStock: newStock,
        status: newStatus,
        storeId: activeStore.id
      });

      // Si tiene éxito, validamos que este es el nuevo estado real
      lastValidStock.current = newStock;
    } catch (err) {
      // Reversión visual si falla el servidor
      setPackData(prev => ({ ...prev, availableStock: lastValidStock.current, status: newStatus === 'SOLD_OUT' ? 'ACTIVE' : prev.status }));
      
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
    
    // Si queremos restar y está en SOLD_OUT o stock 0, ignoramos
    if (delta < 0 && (packData.availableStock <= 0 || packData.status === 'SOLD_OUT')) return;
    
    const newStock = packData.availableStock + delta;
    if (newStock < 0) return;

    // Optimistic Update: Si el nuevo stock es > 0, lo reactivamos
    const newStatus = newStock > 0 ? 'ACTIVE' : packData.status;
    setPackData(prev => ({ ...prev, availableStock: newStock, status: newStatus }));

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      syncStockWithBackend(newStock, newStatus);
    }, 600);
  };

  const handleSoldOut = async () => {
    if (!packData || packData.status === 'SOLD_OUT') return;
    const confirmAction = window.confirm('¿Deseas detener las ventas y marcar el inventario como agotado por hoy? Las reservas ya pagadas se mantendrán.');
    if (!confirmAction) return;

    setPackData(prev => ({ ...prev, availableStock: 0, status: 'SOLD_OUT' }));
    await syncStockWithBackend(0, 'SOLD_OUT');
  };

  const handleDeletePack = async () => {
    if (!packData) return;
    const confirmAction = window.confirm('¿Estás seguro de que deseas eliminar este pack? Las reservas que ya hayan sido pagadas seguirán siendo válidas, pero ya no aceptará nuevas reservas.');
    if (!confirmAction) return;
    
    try {
      setIsUpdating(true);
      await apiClient.delete(`/api/merchant/packs/${packData.id}`);
      alert('El pack ha sido eliminado correctamente.');
      // Refetch after delete
      setIsLoading(true);
      const response = await apiClient.get(`/api/merchant/stock?storeId=${activeStore.id}`);
      if (response.data.status === 'success') {
        setPackData(response.data.pack);
        lastValidStock.current = response.data.pack.availableStock;
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setPackData(null);
      } else {
        alert(err.response?.data?.message || 'Error al intentar eliminar el pack.');
      }
    } finally {
      setIsUpdating(false);
      setIsLoading(false);
    }
  };

  const handleEditPack = () => {
    if (!packData) return;
    navigate('/merchant/create-pack', { state: { editMode: true, packData } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-semibold tracking-wide animate-pulse">Cargando inventario...</p>
      </div>
    );
  }

  if (!packData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
         <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-gray-100">
           <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
           </svg>
           <p className="text-gray-800 font-bold mb-2">Sin Packs Activos</p>
           <p className="text-sm text-gray-500 mb-6">No tienes ningún Pack Sorpresa configurado para el día de hoy.</p>
           <Link 
             to="/merchant/create-pack"
             className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors"
           >
             Crear mi primer Pack
           </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans touch-manipulation">
      {/* Modal de Error (Tailwind) */}
      {errorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-black">{errorModal.title}</h3>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-6">{errorModal.message}</p>
            <button 
              onClick={() => setErrorModal(null)}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto mt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Tienda</h1>
          <p className="text-gray-500 font-medium text-sm">Control de inventario en tiempo real</p>
        </header>

        <div className={`bg-white rounded-3xl p-6 shadow-sm border mb-6 transition-colors duration-300 ${
          packData.status === 'SOLD_OUT' ? 'border-red-200 bg-red-50' : 'border-gray-200'
        }`}>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{packData.title}</h2>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-black uppercase rounded-full ${
                packData.status === 'SOLD_OUT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {packData.status === 'SOLD_OUT' ? 'Venta Detenida' : 'Venta Activa'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleEditPack}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                title="Editar Pack"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={handleDeletePack}
                className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                title="Eliminar Pack"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reservados</span>
              <span className="text-3xl font-black text-gray-900">{packData.soldUnits || 0}</span>
            </div>
            
            <div className={`p-4 rounded-2xl border flex flex-col items-center transition-colors ${
              packData.availableStock === 0 ? 'bg-red-100 border-red-200 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Disponibles</span>
              <span className="text-4xl font-black">{packData.availableStock}</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-6 mb-8">
            <button 
              onClick={() => handleStockChange(-1)}
              disabled={packData.availableStock <= 0 || packData.status === 'SOLD_OUT'}
              className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-3xl shadow-sm hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              -
            </button>
            
            <div className="flex flex-col items-center justify-center w-20">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sinc.</span>
              {isUpdating && <div className="mt-2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            
            <button 
              onClick={() => handleStockChange(1)}
              className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-3xl shadow-sm hover:bg-gray-200 active:bg-gray-300 transition-all"
            >
              +
            </button>
          </div>

          <hr className="border-gray-100 mb-6" />

          <button 
            onClick={handleSoldOut}
            disabled={packData.status === 'SOLD_OUT' || isUpdating}
            className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-lg transition-transform active:scale-95 ${
              packData.status === 'SOLD_OUT' 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {packData.status === 'SOLD_OUT' ? 'AGOTADO POR HOY' : 'MARCAR COMO AGOTADO'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyStockDashboard;
