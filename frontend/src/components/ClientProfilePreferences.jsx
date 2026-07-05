import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const ClientProfilePreferences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
  });

  const [locationMode, setLocationMode] = useState('GPS'); // 'GPS' | 'MANUAL'
  const [manualArea, setManualArea] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGPSLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('La geolocalización no está soportada por tu navegador.');
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        setSuccess('Ubicación obtenida correctamente.');
        // Aquí podrías guardar las coordenadas en el estado si lo deseas
      },
      (err) => {
        setIsLoading(false);
        setError('No pudimos acceder a tu ubicación. Por favor revisa los permisos del navegador.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates = {
        full_name: formData.fullName,
        phone: formData.phone,
        location_preference: locationMode,
        search_radius: locationMode === 'MANUAL' ? searchRadius : null,
        manual_area: locationMode === 'MANUAL' ? manualArea : null
      };

      const { error: updateError } = await supabase.auth.updateUser({
        data: updates
      });

      if (updateError) throw updateError;
      
      await supabase.auth.refreshSession();
      setSuccess('Preferencias guardadas exitosamente.');
      
      setTimeout(() => {
        navigate('/profile');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al guardar tus preferencias.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="bg-gray-900 px-6 py-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Preferencias de Cliente</h1>
          <p className="text-gray-400 text-sm">Personaliza cómo descubres packs sorpresa a tu alrededor.</p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-semibold">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Información Básica */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Datos de Contacto (Opcional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
            </section>

            {/* Selector de Ubicación */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Modo de Ubicación</h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                
                <button
                  type="button"
                  onClick={() => setLocationMode('GPS')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    locationMode === 'GPS' 
                    ? 'border-green-500 bg-green-50 text-green-800' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold mb-1">Ubicación Exacta (GPS)</div>
                  <div className="text-xs opacity-80">Mejor para buscar mientras te mueves</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMode('MANUAL')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    locationMode === 'MANUAL' 
                    ? 'border-blue-500 bg-blue-50 text-blue-800' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold mb-1">Área Específica</div>
                  <div className="text-xs opacity-80">Ideal para buscar cerca de casa o trabajo</div>
                </button>
              </div>

              {/* Contenido Dinámico según modo */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 min-h-[140px] flex flex-col justify-center">
                {locationMode === 'GPS' ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">Permite el acceso a tu ubicación para mostrarte los packs más cercanos en tiempo real.</p>
                    <button 
                      type="button"
                      onClick={handleGPSLocation}
                      className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      Solicitar Ubicación Ahora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ciudad o Zona de Búsqueda</label>
                      <input
                        type="text"
                        value={manualArea}
                        onChange={(e) => setManualArea(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Ej. Centro, Ciudad de México"
                        required={locationMode === 'MANUAL'}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                        <label>Radio de búsqueda</label>
                        <span>{searchRadius} km</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>1 km (Caminando)</span>
                        <span>20 km (En auto)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="pt-6 border-t flex justify-end">
              <button
                type="submit"
                disabled={isLoading || (locationMode === 'MANUAL' && !manualArea)}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
                  isLoading || (locationMode === 'MANUAL' && !manualArea)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
                }`}
              >
                {isLoading ? 'Guardando...' : 'Guardar Preferencias'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePreferences;
