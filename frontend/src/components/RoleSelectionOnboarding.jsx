import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const RoleSelectionOnboarding = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleConfirm = async () => {
    if (!selectedRole || !user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Actualizar los metadatos del usuario en Supabase Auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      if (updateError) throw updateError;

      // Refrescar la sesión para asegurar que los metadatos se apliquen inmediatamente
      await supabase.auth.refreshSession();

      if (selectedRole === 'CLIENTE') {
        navigate('/explore', { replace: true });
      } else if (selectedRole === 'COMERCIO') {
        navigate('/merchant/dashboard', { replace: true });
      }
    } catch (err) {
      setError('Hubo un problema al guardar tu selección. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gray-900 px-8 py-10 text-center">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Bienvenido a Bloop.</h1>
          <p className="text-gray-300 text-sm max-w-md mx-auto">Para ofrecerte la mejor experiencia, indícanos cómo tienes planeado utilizar la plataforma.</p>
        </div>

        {/* Contenido */}
        <div className="p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Opción A: Cliente */}
            <div 
              onClick={() => !isLoading && setSelectedRole('CLIENTE')}
              className={`relative cursor-pointer transition-all duration-200 rounded-xl p-6 border-2 ${
                selectedRole === 'CLIENTE' 
                  ? 'border-green-500 bg-green-50 shadow-md transform scale-[1.02]' 
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50'
              }`}
            >
              <div className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors duration-200">
                {selectedRole === 'CLIENTE' ? (
                  <div className="w-full h-full rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full border-2 border-gray-300 bg-white"></div>
                )}
              </div>
              
              <div className="mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-700 rounded-lg text-2xl font-black">C</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quiero comprar packs</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Soy un Cliente. Mi objetivo es salvar comida deliciosa de comercios locales y ahorrar dinero haciéndolo.</p>
            </div>

            {/* Opción B: Comercio */}
            <div 
              onClick={() => !isLoading && setSelectedRole('COMERCIO')}
              className={`relative cursor-pointer transition-all duration-200 rounded-xl p-6 border-2 ${
                selectedRole === 'COMERCIO' 
                  ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors duration-200">
                {selectedRole === 'COMERCIO' ? (
                  <div className="w-full h-full rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full border-2 border-gray-300 bg-white"></div>
                )}
              </div>
              
              <div className="mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 rounded-lg text-2xl font-black">N</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tengo un negocio</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Soy un Comercio. Quiero registrar mi local para vender mis excedentes del día y llegar a más clientes.</p>
            </div>

          </div>

          <div className="mt-10 border-t border-gray-100 pt-8 flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={!selectedRole || isLoading}
              className={`px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-sm ${
                !selectedRole || isLoading
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                  : 'bg-gray-900 hover:bg-gray-800 hover:shadow-lg active:scale-95'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : 'Confirmar Selección'}
            </button>
          </div>

        </div>
      </div>
      <p className="mt-8 text-xs text-gray-400 font-medium">Esta decisión es permanente y configurará tu cuenta.</p>
    </div>
  );
};

export default RoleSelectionOnboarding;
