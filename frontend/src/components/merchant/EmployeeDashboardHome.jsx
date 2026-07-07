import React, { useState } from 'react';
import { QrCode, Plus, Minus, Package } from 'lucide-react';
import MerchantOrdersView from './MerchantOrdersView';

const EmployeeDashboardHome = () => {
  const [stock, setStock] = useState(5); // Valor inicial simulado

  const handleStockUpdate = (delta) => {
    setStock(prev => Math.max(0, prev + delta));
    // Aquí idealmente se haría un call a apiClient para actualizar el stock en el backend
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

            <div className="flex items-center justify-center gap-8 mb-8 w-full">
              <button 
                onClick={() => handleStockUpdate(-1)}
                disabled={stock <= 0}
                className="w-20 h-20 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                <Minus size={40} strokeWidth={3} />
              </button>
              
              <div className="text-6xl font-black text-gray-900 w-24 tabular-nums">
                {stock}
              </div>

              <button 
                onClick={() => handleStockUpdate(1)}
                className="w-20 h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black active:scale-90 transition-all"
              >
                <Plus size={40} strokeWidth={3} />
              </button>
            </div>

            <div className="w-full p-4 bg-green-50 text-green-700 rounded-xl font-semibold border border-green-200">
              Inventario en línea
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboardHome;
