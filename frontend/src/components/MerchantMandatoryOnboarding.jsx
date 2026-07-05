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
  
  const [step, setStep] = useState(1);
  
  // Paso 1
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');

  // Paso 2
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: -99.1332,
    latitude: 19.4326,
    zoom: 12
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Paso 3
  const [pickupStart, setPickupStart] = useState('');
  const [pickupEnd, setPickupEnd] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleVerifyAddress = async () => {
    if (address.trim().length < 5) {
      setError('Ingresa una dirección más detallada antes de verificar.');
      return;
    }

    setIsGeocoding(true);
    setError('');

    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setCoords({ lng, lat });
        setViewState({ longitude: lng, latitude: lat, zoom: 15 });
        setShowMap(true);
      } else {
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
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        store_name: storeName,
        category: category,
        address: address,
        bank_account: bankAccount,
        lng: coords.lng,
        lat: coords.lat,
        manager_name: managerName,
        phone: phone,
        pickup_start: pickupStart,
        pickup_end: pickupEnd
      };
      
      await apiClient.put('/api/merchant/profile', payload);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          store_name: storeName 
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header con Indicador de Progreso */}
        <div className="bg-gray-900 px-8 py-8 text-white relative">
          <h1 className="text-2xl font-bold mb-2">Configuración Inicial del Comercio</h1>
          <p className="text-gray-400 text-sm">Paso {step} de 3</p>
          
          <div className="absolute bottom-0 left-0 h-1 bg-gray-700 w-full">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">1. Identidad y Categoría</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Legal / Responsable</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono Comercial</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. 555-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Público de la Tienda</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Panadería Doña María"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría Gastronómica</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="" disabled>Selecciona una categoría...</option>
                    <option value="Panadería">Panadería</option>
                    <option value="Restaurante">Restaurante</option>
                    <option value="Supermercado">Supermercado</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!managerName || !phone || !storeName || !category}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">2. Geocodificación (Mapbox)</h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Física</label>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Dirección completa"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAddress}
                    disabled={isGeocoding || address.length < 5}
                    className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg disabled:bg-gray-400 transition-colors"
                  >
                    {isGeocoding ? 'Buscando...' : 'Verificar Ubicación'}
                  </button>
                </div>

                {showMap && (
                  <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden relative">
                    <div className="absolute top-2 left-2 z-10 bg-white px-3 py-1 text-xs font-bold rounded-md shadow-md">
                      Haz clic en el mapa para ajustar tu posición
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
              
              <div className="pt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  disabled={!coords}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">3. Datos Operativos y Bancarios</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Horario de Entrega (Inicio)</label>
                  <input
                    type="time"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Horario de Entrega (Fin)</label>
                  <input
                    type="time"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cuenta Bancaria para Liquidaciones (CLABE)</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="18 dígitos"
                  />
                  <p className="text-xs text-gray-500 mt-2">Requerido para transferirte las ganancias de tus ventas.</p>
                </div>
              </div>
              
              <div className="pt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!pickupStart || !pickupEnd || bankAccount.length < 10 || isLoading}
                  className={`px-8 py-3 font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                    !pickupStart || !pickupEnd || bankAccount.length < 10 || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : 'Finalizar Onboarding'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MerchantMandatoryOnboarding;
