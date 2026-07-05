import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MerchantMandatoryOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    storeName: '',
    category: '',
    address: '',
    bankAccount: ''
  });

  const [coords, setCoords] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: -99.1332,
    latitude: 19.4326,
    zoom: 12
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');

  // Validaciones
  const isFormValid = () => {
    return (
      formData.storeName.trim().length >= 3 &&
      formData.category !== '' &&
      formData.address.trim().length >= 10 &&
      formData.bankAccount.trim().length >= 10 &&
      coords !== null // Debe tener coordenadas
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Simulación de Geocodificación o uso real con fetch a Mapbox
  const handleVerifyAddress = async () => {
    if (formData.address.trim().length < 5) {
      setError('Ingresa una dirección más detallada antes de verificar.');
      return;
    }

    setIsGeocoding(true);
    setError('');

    try {
      // Intento de geocodificación con la API real de Mapbox
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(formData.address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setCoords({ lng, lat });
        setViewState({ longitude: lng, latitude: lat, zoom: 15 });
        setShowMap(true); // Mostrar el mapa para confirmación
      } else {
        // Fallback: Si no se encuentra, habilitar el mapa manual
        setError('No pudimos encontrar la ubicación exacta. Por favor, ubícala manualmente en el mapa.');
        setShowMap(true);
        setCoords(null);
      }
    } catch (err) {
      setError('Error al conectar con el servicio de mapas. Intenta de nuevo o ubica manualmente.');
      setShowMap(true);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapClick = (e) => {
    setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Enviar la data al Backend (Fastify) para guardar en PostGIS
      const payload = {
        store_name: formData.storeName,
        category: formData.category,
        address: formData.address,
        bank_account: formData.bankAccount,
        lng: coords.lng,
        lat: coords.lat
      };
      
      await apiClient.put('/api/merchant/profile', payload);

      // 2. Actualizar el estado en Supabase Auth para liberar el acceso
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          store_name: formData.storeName 
        }
      });
      if (updateError) throw updateError;
      
      await supabase.auth.refreshSession();
      
      navigate('/merchant/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil del comercio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-gray-900 px-8 py-8 text-white">
          <h1 className="text-2xl font-bold mb-2">Configuración Inicial del Comercio</h1>
          <p className="text-gray-400 text-sm">Completa todos los campos obligatorios para activar tu cuenta y comenzar a vender tus excedentes.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre de la tienda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Comercial *</label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  minLength={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej. Panadería Doña María"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  <option value="Panadería">Panadería / Pastelería</option>
                  <option value="Restaurante">Restaurante</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Cafetería">Cafetería</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Dirección y Mapa */}
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <h3 className="text-md font-bold text-gray-900 mb-4">Ubicación Física *</h3>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  minLength={10}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Dirección completa (Calle, número, colonia, ciudad)"
                />
                <button
                  type="button"
                  onClick={handleVerifyAddress}
                  disabled={isGeocoding || formData.address.length < 10}
                  className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg disabled:bg-gray-400 transition-colors"
                >
                  {isGeocoding ? 'Buscando...' : 'Verificar Ubicación'}
                </button>
              </div>

              {showMap && (
                <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden relative">
                  <div className="absolute top-2 left-2 z-10 bg-white px-3 py-1 text-xs font-bold rounded-md shadow-md">
                    Haz clic en el mapa para ajustar tu posición exacta
                  </div>
                  <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    onClick={handleMapClick}
                    style={{ width: '100%', height: '300px' }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    cursor="crosshair"
                  >
                    {coords && (
                      <Marker longitude={coords.lng} latitude={coords.lat} color="red" />
                    )}
                  </Map>
                </div>
              )}
            </div>

            {/* Datos Bancarios */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cuenta Bancaria para Liquidaciones (CLABE) *</label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                required
                pattern="\d{10,18}"
                maxLength={18}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="18 dígitos"
              />
              <p className="text-xs text-gray-500 mt-2">Requerido para transferirte las ganancias de tus packs vendidos.</p>
            </div>

            <div className="pt-6 border-t flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
                  !isFormValid() || isLoading
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {isLoading ? 'Finalizando...' : 'Completar Registro'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default MerchantMandatoryOnboarding;
