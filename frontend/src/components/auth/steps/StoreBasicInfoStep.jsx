import React, { useEffect, useState } from 'react';
import { Store, Phone, User, Image as ImageIcon } from 'lucide-react';

const StoreBasicInfoStep = ({ data, onChange, onValidationChange }) => {
  const { storeName, managerName, phone, logoBase64 } = data;
  const [imagePreview, setImagePreview] = useState(logoBase64 || null);

  useEffect(() => {
    // Validación: nombre > 2 caracteres, responsable > 2 caracteres, teléfono >= 8 dígitos
    const isValid = storeName.trim().length > 2 &&
                    managerName.trim().length > 2 &&
                    phone.trim().length >= 8;
    onValidationChange(isValid);
  }, [storeName, managerName, phone, onValidationChange]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        onChange({ logoBase64: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

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
              maxLength={50}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo del Local (Opcional)</label>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
              Seleccionar Imagen
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">Esta imagen será visible en tus packs sorpresa.</p>
        </div>
      </div>
    </div>
  );
};

export default StoreBasicInfoStep;
