import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingLayout from './OnboardingLayout';
import StoreBasicInfoStep from './steps/StoreBasicInfoStep';
import StoreLocationStep from './steps/StoreLocationStep';
import StoreCategoryStep from './steps/StoreCategoryStep';

const MerchantStoreWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isStepValid, setIsStepValid] = useState(false);
  const [error, setError] = useState('');

  // Estado centralizado
  const [storeData, setStoreData] = useState({
    storeName: '',
    managerName: '',
    phone: '',
    address: '',
    coords: null,
    category: '',
    pickupStart: '',
    pickupEnd: '',
    legalName: '',
    bankAccount: ''
  });

  // Cargar caché local (opcional para no perder progreso)
  useEffect(() => {
    const saved = localStorage.getItem('merchant_store_wizard_state');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.currentStep) setCurrentStep(p.currentStep);
        if (p.storeData) setStoreData(p.storeData);
      } catch (e) {
        console.error("Error loading wizard state", e);
      }
    }
  }, []);

  // Guardar caché local
  useEffect(() => {
    localStorage.setItem('merchant_store_wizard_state', JSON.stringify({ currentStep, storeData }));
  }, [currentStep, storeData]);

  const handleDataChange = (newData) => {
    setStoreData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    setError('');
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        store_name: storeData.storeName,
        category: storeData.category,
        address: storeData.address,
        bank_account: storeData.bankAccount,
        legal_id: storeData.legalName,
        lng: storeData.coords.lng,
        lat: storeData.coords.lat,
        manager_name: storeData.managerName,
        phone: storeData.phone,
        pickup_start: storeData.pickupStart,
        pickup_end: storeData.pickupEnd
      };
      
      await apiClient.put('/api/merchant/profile', payload);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          store_name: storeData.storeName 
        }
      });
      if (updateError) throw updateError;
      
      await supabase.auth.refreshSession();
      
      localStorage.removeItem('merchant_store_wizard_state');
      navigate('/merchant/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil del comercio.');
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      canContinue={isStepValid}
      isLoading={isLoading}
      nextLabel={currentStep === 3 ? 'Crear Sucursal' : 'Siguiente'}
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <StoreBasicInfoStep 
          data={storeData} 
          onChange={handleDataChange} 
          onValidationChange={setIsStepValid} 
        />
      )}
      
      {currentStep === 2 && (
        <StoreLocationStep 
          data={storeData} 
          onChange={handleDataChange} 
          onValidationChange={setIsStepValid} 
        />
      )}

      {currentStep === 3 && (
        <StoreCategoryStep 
          data={storeData} 
          onChange={handleDataChange} 
          onValidationChange={setIsStepValid} 
        />
      )}
    </OnboardingLayout>
  );
};

export default MerchantStoreWizard;
