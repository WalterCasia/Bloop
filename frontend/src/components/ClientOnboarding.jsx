import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

const ClientOnboarding = () => {
  const [firstName, setFirstName] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);
  const [dietaryPref, setDietaryPref] = useState('ninguna');
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // En una app real podríamos guardar latitude y longitude en el perfil
        // Por ahora, solo confirmamos que dio el permiso
        alert('Ubicación obtenida correctamente.');
        setLocationError('');
      },
      () => {
        setLocationError('No se pudo obtener la ubicación. Puedes continuar igual.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !user) return;
    
    setIsLoading(true);

    try {
      // 1. Actualizar public.profiles con la info adicional
      await apiClient.patch('/api/users/profile', { 
        full_name: firstName,
        preferences: { radius: searchRadius, diet: dietaryPref }
      });

      // 2. Marcar onboarding_completed = true en los metadatos de Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });

      if (updateError) throw updateError;
      await supabase.auth.refreshSession();

      // 3. Redirigir al explorador
      navigate('/explore', { replace: true });
    } catch (err) {
      console.error("Onboarding Error:", err);
      alert('Error al guardar tu perfil. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Comienza a explorar</h1>
          <p className="text-gray-500 text-sm">Solo necesitamos un par de detalles para encontrar los mejores packs cerca de ti.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tu nombre de pila</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Ej. María"
            />
            <p className="text-xs text-gray-400 mt-1">Lo usaremos para identificar tus pedidos en la tienda.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación y Radio de búsqueda</label>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <button 
                type="button"
                onClick={handleGetLocation}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 mb-4 transition-colors"
              >
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Dar permisos de ubicación
              </button>
              {locationError && <p className="text-xs text-red-500 mb-4 text-center">{locationError}</p>}
              
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                <span>Radio de alerta</span>
                <span className="text-green-600">{searchRadius} km</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={searchRadius} 
                onChange={(e) => setSearchRadius(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Preferencia Dietética (Opcional)</label>
            <select 
              value={dietaryPref}
              onChange={(e) => setDietaryPref(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="ninguna">Sin restricciones</option>
              <option value="vegetariano">Vegetariano</option>
              <option value="vegano">Vegano</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !firstName}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
                isLoading || !firstName
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : '¡Listo para salvar comida!'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientOnboarding;
