import React, { useEffect } from 'react';
import { Store, Phone, User } from 'lucide-react';

const StoreBasicInfoStep = ({ data, onChange, onValidationChange }) => {
  const { storeName, managerName, phone } = data;

  useEffect(() => {
    // Validación: nombre > 2 caracteres, responsable > 2 caracteres, teléfono >= 8 dígitos
    const isValid = storeName.trim().length > 2 &&
                    managerName.trim().length > 2 &&
                    phone.trim().length >= 8;
    onValidationChange(isValid);
  }, [storeName, managerName, phone, onValidationChange]);

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-8">
        ¿Cómo se llama tu negocio?
      </h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda/sucursal</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Store className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={storeName}
              onChange={(e) => onChange({ storeName: e.target.value })}
              className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors"
              placeholder="Ej. Panadería Doña María"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Responsable Legal</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={managerName}
              onChange={(e) => onChange({ managerName: e.target.value })}
              className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors"
              placeholder="Ej. Juan Pérez"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de teléfono de contacto</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors"
              placeholder="Ej. 12345678"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreBasicInfoStep;
