import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const CATEGORIES = [
  { 
    id: 'Panadería', 
    icon: (
      <svg className="w-8 h-8 mb-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
    ), 
    label: 'Panadería' 
  },
  { 
    id: 'Restaurante', 
    icon: (
      <svg className="w-8 h-8 mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4h8zM7 21v-4a2 2 0 00-2-2H1a2 2 0 00-2 2v4h8z"></path></svg>
    ), 
    label: 'Restaurante' 
  },
  { 
    id: 'Supermercado', 
    icon: (
      <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
    ), 
    label: 'Supermercado' 
  },
  { 
    id: 'Cafetería', 
    icon: (
      <svg className="w-8 h-8 mb-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    ), 
    label: 'Cafetería' 
  }
];

const MerchantOnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  
  // Paso 1
  const [storeName, setStoreName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
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
  const [legalName, setLegalName] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('merchant_onboarding_state');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.currentStep) setCurrentStep(p.currentStep);
        if (p.storeName) setStoreName(p.storeName);
        if (p.managerName) setManagerName(p.managerName);
        if (p.phone) setPhone(p.phone);
        if (p.category) setCategory(p.category);
        if (p.address) setAddress(p.address);
        if (p.coords) setCoords(p.coords);
        if (p.showMap) setShowMap(p.showMap);
        if (p.viewState) setViewState(p.viewState);
        if (p.pickupStart) setPickupStart(p.pickupStart);
        if (p.pickupEnd) setPickupEnd(p.pickupEnd);
        if (p.legalName) setLegalName(p.legalName);
        if (p.bankAccount) setBankAccount(p.bankAccount);
      } catch (e) {
        console.error("Error loading state", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const state = {
      currentStep, storeName, managerName, phone, category,
      address, coords, showMap, viewState, pickupStart, pickupEnd,
      legalName, bankAccount
    };
    localStorage.setItem('merchant_onboarding_state', JSON.stringify(state));
  }, [
    currentStep, storeName, managerName, phone, category,
    address, coords, showMap, viewState, pickupStart, pickupEnd,
    legalName, bankAccount
  ]);

  const handleNext = () => {
    setError('');
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const isStep1Valid = () => {
    return storeName.trim().length > 2 && managerName.trim().length > 2 && phone.trim().length > 5 && category !== '';
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
        setError('No pudimos encontrar la ubicación exacta. Por favor, ingresa una mejor dirección o ajusta el mapa.');
      }
    } catch (err) {
      setError('Error al conectar con el servicio de mapas.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMarkerDragEnd = (event) => {
    setCoords({ lng: event.lngLat.lng, lat: event.lngLat.lat });
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
      
      localStorage.removeItem('merchant_onboarding_state');
      navigate('/merchant/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil del comercio.');
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = currentStep === 1 ? '33.33%' : currentStep === 2 ? '66.66%' : '100%';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header con Indicador de Progreso */}
        <div className="bg-gray-900 px-8 py-8 text-white relative">
          <h1 className="text-2xl font-bold mb-2">Configuración de Negocio Aliado</h1>
          <p className="text-gray-400 text-sm">Paso {currentStep} de 3</p>
          
          <div className="absolute bottom-0 left-0 h-1 bg-gray-700 w-full">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: progressPercentage }}
            ></div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">1. Perfil Operativo</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Comercial del Establecimiento</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Panadería Doña María"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Responsable Legal</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono Operativo Directo</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ej. 555-1234"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Categoría del Negocio</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        category === cat.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {cat.icon}
                      <span className="text-sm font-bold text-gray-700">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!isStep1Valid()}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  Continuar al Paso 2
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">2. Geocodificación Exacta</h2>
              <p className="text-sm text-gray-500">
                Los clientes usarán este punto exacto en el mapa para navegar hacia tu negocio.
              </p>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Física</label>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Calle, número, colonia, código postal, ciudad"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAddress}
                    disabled={isGeocoding || address.length < 5}
                    className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg disabled:bg-gray-400 transition-colors"
                  >
                    {isGeocoding ? 'Buscando...' : 'Ubicar en Mapa'}
                  </button>
                </div>

                {showMap && coords && (
                  <div className="mt-4 border-2 border-blue-200 rounded-lg overflow-hidden relative shadow-inner">
                    <div className="absolute top-2 left-2 z-10 bg-white px-3 py-1 text-xs font-bold text-blue-800 rounded-md shadow-md border border-blue-100 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                      ¡Arrastra el marcador rojo para ajustar la posición exacta de tu puerta!
                    </div>
                    <Map
                      {...viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      style={{ width: '100%', height: '350px' }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                    >
                      <Marker 
                        longitude={coords.lng} 
                        latitude={coords.lat} 
                        color="#EF4444"
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                      />
                    </Map>
                  </div>
                )}
              </div>
              
              <div className="pt-6 flex gap-4">
                <button
                  onClick={handleBack}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleNext}
                  disabled={!coords}
                  className="w-2/3 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  Confirmar Ubicación
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">3. Logística y Liquidación</h2>
              <p className="text-sm text-gray-500">
                Define en qué ventana de tiempo los clientes deben recoger sus packs y a dónde depositaremos tus ventas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Ventana Horaria de Recolección</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Desde (Apertura)</label>
                  <input
                    type="time"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hasta (Cierre)</label>
                  <input
                    type="time"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Datos Bancarios o Tributarios</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Razón Social o Beneficiario</label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Nombre tal como aparece en el banco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cuenta Bancaria (CLABE)</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="18 dígitos"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-6 flex gap-4">
                <button
                  onClick={handleBack}
                  disabled={isLoading}
                  className="w-1/3 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!pickupStart || !pickupEnd || bankAccount.length < 10 || !legalName || isLoading}
                  className={`w-2/3 py-3 font-bold text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                    !pickupStart || !pickupEnd || bankAccount.length < 10 || !legalName || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Completando Registro...
                    </>
                  ) : 'Finalizar y Entrar al Dashboard'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MerchantOnboardingWizard;
