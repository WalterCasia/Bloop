import React from 'react';
import { ChevronLeft } from 'lucide-react';

const OnboardingLayout = ({ 
  children, 
  currentStep, 
  totalSteps, 
  onBack, 
  onNext, 
  onSkip,
  canContinue = true,
  nextLabel = "Siguiente",
  isLoading = false
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="flex flex-col h-screen w-full bg-white fixed inset-0 overflow-hidden font-sans text-gray-900">
      {/* Header Fijo */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white shrink-0 relative z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
          aria-label="Volver atrás"
        >
          <ChevronLeft size={24} />
        </button>
        {/* Espacio para logo opcional si se requiere */}
        <div className="w-10"></div>
      </header>

      {/* Barra de Progreso Fluida */}
      <div className="h-1 bg-gray-200 w-full shrink-0">
        <div 
          className="h-full bg-gray-900 transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Contenido Central Desplazable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-12 sm:py-16 pb-32">
          {children}
        </div>
      </main>

      {/* Barra de Acción Inferior Fija */}
      <footer className="h-20 border-t border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div>
          {onSkip ? (
            <button 
              onClick={onSkip}
              className="font-semibold underline text-gray-900 hover:text-gray-600 px-2 py-2"
            >
              Omitir
            </button>
          ) : (
            <div /> /* Espaciador */
          )}
        </div>
        
        <button
          onClick={onNext}
          disabled={!canContinue || isLoading}
          className={`px-8 py-3 rounded-lg font-bold text-white bg-gray-900 transition-all
            ${(!canContinue || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black active:scale-95'}
          `}
        >
          {isLoading ? 'Cargando...' : nextLabel}
        </button>
      </footer>
    </div>
  );
};

export default OnboardingLayout;
