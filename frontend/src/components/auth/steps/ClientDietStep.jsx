import React from 'react';
import { Leaf, Vegan, WheatOff, Utensils, Check } from 'lucide-react';

const DIETARY_OPTIONS = [
  { id: 'none', label: 'Sin restricciones', icon: Utensils },
  { id: 'vegetarian', label: 'Vegetariano', icon: Leaf },
  { id: 'vegan', label: 'Vegano', icon: Vegan },
  { id: 'gluten_free', label: 'Sin Gluten', icon: WheatOff }
];

const ClientDietStep = ({ selectedDiets, setSelectedDiets }) => {
  
  const toggleDiet = (dietId) => {
    if (dietId === 'none') {
      // Si selecciona "Sin restricciones", limpia las demás
      setSelectedDiets(['none']);
      return;
    }
    
    // Si selecciona otra, quita "none" si estaba
    let newSelection = selectedDiets.filter(id => id !== 'none');
    
    if (newSelection.includes(dietId)) {
      newSelection = newSelection.filter(id => id !== dietId);
    } else {
      newSelection.push(dietId);
    }
    
    setSelectedDiets(newSelection);
  };

  return (
    <div className="w-full animation-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
        ¿Cómo prefieres tu comida?
      </h1>
      <p className="mt-4 text-gray-500 text-lg">
        Esto nos ayuda a recomendarte packs sorpresa ideales para ti.
      </p>

      <div className="grid grid-cols-2 gap-4 mt-8">
        {DIETARY_OPTIONS.map((option) => {
          const isSelected = selectedDiets.includes(option.id);
          const Icon = option.icon;
          
          return (
            <button
              key={option.id}
              onClick={() => toggleDiet(option.id)}
              className={`relative flex flex-col items-start p-6 rounded-2xl border transition-all text-left overflow-hidden min-h-[140px]
                ${isSelected 
                  ? 'border-black ring-2 ring-black bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
            >
              <div className="mb-auto">
                <Icon size={32} className={isSelected ? "text-gray-900" : "text-gray-500"} />
              </div>
              <h3 className={`mt-4 font-bold text-lg sm:text-xl ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                {option.label}
              </h3>

              {isSelected && (
                <div className="absolute top-4 right-4 bg-black rounded-full p-1 text-white">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ClientDietStep;
