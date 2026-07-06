import React, { useState } from 'react';
import { X, Copy, CheckCircle2, UserPlus, Store } from 'lucide-react';
import apiClient from '../../api/apiClient';

const EmployeeInviteModal = ({ onClose, stores, activeStore }) => {
  const [selectedStoreId, setSelectedStoreId] = useState(activeStore?.id || '');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedStoreId) return;
    setIsGenerating(true);
    
    try {
      const response = await apiClient.post('/api/merchant/invitations', { store_id: selectedStoreId });
      setGeneratedCode(response.data.code);
    } catch (error) {
      console.error('Error generando código:', error);
      alert('Hubo un error al generar el código de invitación.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-gray-900" />
            <h2 className="text-lg font-black text-gray-900">Invitar Empleado</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {!generatedCode ? (
            <>
              <p className="text-sm text-gray-600">
                Genera un código de acceso único para que tu empleado se registre y se vincule automáticamente a una de tus sucursales.
              </p>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Store size={16} />
                  Selecciona la Sucursal Asignada
                </label>
                <div className="relative">
                  <select 
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl focus:ring-green-500 focus:border-green-500 block p-3 pr-8"
                  >
                    <option value="" disabled>Selecciona una sucursal</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedStoreId || isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Generar Código de Acceso'
                )}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 size={32} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-gray-900">¡Código Generado!</h3>
                <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
                  Envía este código a tu empleado para que lo ingrese durante su registro.
                </p>
              </div>

              <div className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center gap-4 relative">
                <span className="text-4xl font-black tracking-widest text-gray-900 font-mono">
                  {generatedCode}
                </span>
                
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition-colors"
                  title="Copiar código"
                >
                  {copied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>

              {copied && (
                <p className="text-sm font-bold text-green-600 bg-green-50 px-4 py-1 rounded-full animate-pulse">
                  ¡Copiado al portapapeles!
                </p>
              )}

              <button
                onClick={onClose}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeInviteModal;
