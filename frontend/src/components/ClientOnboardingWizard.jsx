import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';

const ClientOnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [searchRadius, setSearchRadius] = useState(5);
  const [manualLocation, setManualLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Guardar estado en localStorage para evitar pérdidas accidentales
  useEffect(() => {
    const savedState = localStorage.getItem('client_onboarding_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.searchRadius) setSearchRadius(parsed.searchRadius);
        if (parsed.manualLocation) setManualLocation(parsed.manualLocation);
      } catch (e) {
        console.error("Error parsing saved state", e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      currentStep,
      firstName,
      phone,
      searchRadius,
      manualLocation
    };
    localStorage.setItem('client_onboarding_state', JSON.stringify(stateToSave));
  }, [currentStep, firstName, phone, searchRadius, manualLocation]);

  const handleNext = () => {
    if (currentStep === 1 && firstName.trim().length > 0) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        alert('Ubicación obtenida correctamente.');
        setLocationError('');
        setManualLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
      },
      () => {
        setLocationError('No se pudo obtener la ubicación. Puedes continuar igual o ingresarla manualmente.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !user) return;
    
    setIsLoading(true);

    try {
      await apiClient.put('/api/customer/profile', { 
        full_name: firstName,
        phone_number: phone
      });

      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });

      if (updateError) throw updateError;
      await supabase.auth.refreshSession();

      localStorage.removeItem('client_onboarding_state');
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header and Progress Bar */}
        <div className="bg-white px-8 pt-8 pb-4 relative border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Comienza a explorar</h1>
          <p className="text-gray-500 text-sm">Paso {currentStep} de 2</p>
          
          <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
            <div 
              className="h-full bg-green-500 transition-all duration-300" 
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {currentStep === 1 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tu nombre de pila *</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                    placeholder="Ej. María"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lo usaremos para identificar tus pedidos en la tienda.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono Móvil (Opcional)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                    placeholder="Ej. 555-1234"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!firstName.trim()}
                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  >
                    Continuar al Paso 2
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación Actual</label>
                  
                  <button 
                    type="button"
                    onClick={handleGetLocation}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 mb-4 transition-colors"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Capturar Coordenadas GPS
                  </button>
                  {locationError && <p className="text-xs text-red-500 mb-4 text-center">{locationError}</p>}
                  
                  <div className="text-center text-xs text-gray-400 mb-4">O ingresar manualmente:</div>
                  
                  <input 
                    type="text" 
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-colors mb-4"
                    placeholder="Ej. Ciudad de México, Roma Norte"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>Radio de búsqueda predeterminado</span>
                    <span className="text-green-600 text-sm">{searchRadius} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={searchRadius} 
                    onChange={(e) => setSearchRadius(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>1 km</span>
                    <span>30 km</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-1/3 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-2/3 py-3 rounded-xl font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                      isLoading
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : 'Finalizar Registro'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboardingWizard;
