import React from 'react';
import { Store, UserCircle, Check } from 'lucide-react';

const ROLE_OPTIONS = [
  { 
    id: 'manager', 
    label: 'Soy Propietario / Gerente', 
    description: 'Registraré un nuevo negocio en la plataforma o administraré mis tiendas actuales.',
    icon: Store 
  },
  { 
    id: 'employee', 
    label: 'Soy Empleado', 
    description: 'Tengo un código de invitación de mi gerente para unirme a un local existente.',
    icon: UserCircle 
  }
];

const MerchantRoleStep = ({ selectedRole, setSelectedRole }) => {
  return (
    <div className="w-full animation-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
        ¿Qué rol tienes en la empresa?
      </h1>
      <p className="mt-4 text-gray-500 text-lg mb-8">
        Ayúdanos a configurar tu espacio de trabajo correctamente.
      </p>

      <div className="flex flex-col gap-4">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = selectedRole === option.id;
          const Icon = option.icon;
          
          return (
            <button
              key={option.id}
              onClick={() => setSelectedRole(option.id)}
              className={`relative flex items-start p-6 rounded-2xl border transition-all text-left overflow-hidden min-h-[120px]
                ${isSelected 
                  ? 'border-black ring-2 ring-black bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
            >
              <div className={`p-4 rounded-full mr-6 shrink-0 ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}>
                <Icon size={32} />
              </div>
              <div className="flex-1 pr-8">
                <h3 className={`font-bold text-xl ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                  {option.label}
                </h3>
                <p className="mt-2 text-gray-500 font-medium">
                  {option.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-6 right-6 text-black">
                  <Check size={24} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MerchantRoleStep;
