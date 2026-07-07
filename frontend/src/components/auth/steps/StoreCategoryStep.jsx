import React, { useEffect } from 'react';
import { Clock, Building, CreditCard, ShoppingBag, Utensils, Croissant } from 'lucide-react';

const CATEGORIES = [
  { id: 'Panadería', label: 'Panadería / Pastelería', icon: <Croissant size={32} /> },
  { id: 'Restaurante', label: 'Restaurante', icon: <Utensils size={32} /> },
  { id: 'Supermercado', label: 'Supermercado', icon: <ShoppingBag size={32} /> },
];

const StoreCategoryStep = ({ data, onChange, onValidationChange }) => {
  const { category, pickupStart, pickupEnd, legalName, bankAccount } = data;

  useEffect(() => {
    // Validación: categoría seleccionada, horas coherentes (fin > inicio), legalName y bankAccount > 2 chars
    let isTimeValid = false;
    if (pickupStart && pickupEnd) {
      // Comparación simple asumiendo formato HH:MM
      isTimeValid = pickupEnd > pickupStart;
    }

    const isValid = category !== '' &&
                    isTimeValid &&
                    legalName.trim().length > 2 &&
                    bankAccount.trim().length > 5;
                    
    onValidationChange(isValid);
  }, [category, pickupStart, pickupEnd, legalName, bankAccount, onValidationChange]);

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in pb-12">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-8">
        Casi listos. Detalles finales
      </h2>
      
      <div className="space-y-8">
        
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">¿Qué tipo de comercio eres?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => onChange({ category: cat.id })}
                  className={`
                    relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-black bg-gray-50 ring-1 ring-black shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className={`mb-3 ${isSelected ? 'text-black' : 'text-gray-500'}`}>
                    {cat.icon}
                  </div>
                  <span className={`text-sm text-center font-bold ${isSelected ? 'text-black' : 'text-gray-700'}`}>
                    {cat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horarios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Horario habitual de recogida (Surprise Packs)</label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                value={pickupStart}
                onChange={(e) => onChange({ pickupStart: e.target.value })}
                className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors bg-white"
              />
            </div>
            <span className="text-gray-500 font-bold">a</span>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                value={pickupEnd}
                onChange={(e) => onChange({ pickupEnd: e.target.value })}
                className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors bg-white"
              />
            </div>
          </div>
          {pickupStart && pickupEnd && pickupStart >= pickupEnd && (
            <p className="mt-2 text-sm text-red-600 font-medium">La hora de fin debe ser mayor a la de inicio.</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100"></div>

        {/* Legal y Bancario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social (Para facturación)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors"
              placeholder="Ej. Panadería S.A."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria (Para recibir depósitos)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => onChange({ bankAccount: e.target.value })}
              className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors"
              placeholder="Ej. 1234567890 (Banco X)"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default StoreCategoryStep;
