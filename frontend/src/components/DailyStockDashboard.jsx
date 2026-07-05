import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

/**
 * DailyStockDashboard
 * Panel de control rápido ("Touch-First") para operadores en tienda.
 * Permite ajustar el stock efímero diario de Packs Sorpresa instantáneamente.
 */
const DailyStockDashboard = () => {
  // Estado local que representa la plantilla activa del día
  const [packData, setPackData] = useState({
    id: 'pack_123',
    title: 'Pack Sorpresa de Bollería',
    soldUnits: 3,
    availableStock: 5,
    status: 'ACTIVE' // ACTIVE o SOLD_OUT
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  // Referencia para manejar el Debounce (evitar clics compulsivos)
  const debounceTimer = useRef(null);

  // Función genérica para sincronizar el estado con el Backend (Upstash Redis)
  const syncStockWithBackend = async (newStock, newStatus) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Llamada HTTP real al endpoint POST /api/merchant/stock/sync
      await apiClient.post('/api/merchant/stock/sync', {
        packId: packData.id,
        availableStock: newStock,
        status: newStatus
      });

    } catch (err) {
      // Si falla el backend, deberíamos revertir el Optimistic UI Update.
      // Por brevedad, aquí solo informamos del error crítico.
      setError('Error crítico de sincronización de inventario. Revise conexión.');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Manejador de incremento y decremento con Optimistic UI Update.
   * Se actualiza la interfaz instantáneamente para el cajero y luego sincroniza.
   */
  const handleStockChange = (delta) => {
    if (packData.status === 'SOLD_OUT' || packData.availableStock + delta < 0) return;

    // 1. Optimistic Update (Actualización instantánea en pantalla)
    const newStock = packData.availableStock + delta;
    setPackData(prev => ({ ...prev, availableStock: newStock }));

    // 2. Debounce Sincronización (Solo envía HTTP si deja de pulsar por 500ms)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      syncStockWithBackend(newStock, 'ACTIVE');
    }, 500);
  };

  /**
   * Acción Crítica: Detener ventas del día
   */
  const handleSoldOut = async () => {
    // Si ya está agotado, no hacemos nada
    if (packData.status === 'SOLD_OUT') return;
    
    const confirmAction = window.confirm('¿Está seguro de querer detener las ventas y poner el stock a cero por hoy?');
    if (!confirmAction) return;

    // Optimistic Update a Cero
    setPackData(prev => ({ ...prev, availableStock: 0, status: 'SOLD_OUT' }));
    await syncStockWithBackend(0, 'SOLD_OUT');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans touch-manipulation">
      <div className="max-w-md mx-auto mt-6">
        
        <header className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Tienda</h1>
          <p className="text-gray-500 font-medium text-sm">Control rápido de inventario diario</p>
        </header>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-xl text-sm font-bold shadow-lg mb-6 animate-pulse">
            {error}
          </div>
        )}

        {/* TARJETA PRINCIPAL DEL PACK ACTIVO */}
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
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vendidos Hoy</span>
              <span className="text-3xl font-black text-gray-900">{packData.soldUnits}</span>
            </div>
            
            <div className={`p-4 rounded-2xl border flex flex-col items-center transition-colors ${
              packData.availableStock === 0 ? 'bg-red-100 border-red-200 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Stock Actual</span>
              <span className="text-4xl font-black">{packData.availableStock}</span>
            </div>
          </div>

          {/* CONTROLES TÁCTILES RÁPIDOS (Touch-First) */}
          <div className="flex justify-center items-center gap-6 mb-8">
            <button 
              onClick={() => handleStockChange(-1)}
              disabled={packData.availableStock <= 0 || packData.status === 'SOLD_OUT'}
              className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-3xl shadow-sm hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Reducir stock"
            >
              -
            </button>
            
            <div className="flex flex-col items-center justify-center w-20">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ajuste</span>
              {isUpdating && <div className="mt-2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
            </div>
            
            <button 
              onClick={() => handleStockChange(1)}
              disabled={packData.status === 'SOLD_OUT'}
              className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 text-gray-900 rounded-full flex justify-center items-center font-black text-3xl shadow-sm hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Aumentar stock"
            >
              +
            </button>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* BOTÓN CRÍTICO DE PARADA */}
          <button 
            onClick={handleSoldOut}
            disabled={packData.status === 'SOLD_OUT' || isUpdating}
            className={`w-full py-5 rounded-2xl font-black text-lg text-white shadow-lg transition-transform active:scale-95 ${
              packData.status === 'SOLD_OUT' 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {packData.status === 'SOLD_OUT' ? 'AGOTADO POR HOY' : 'AGOTADO / DETENER VENTAS'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DailyStockDashboard;
