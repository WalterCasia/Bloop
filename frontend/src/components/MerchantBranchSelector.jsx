import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreContext } from '../contexts/StoreContext';
import { Store, ChevronDown, Plus } from 'lucide-react';

const MerchantBranchSelector = () => {
  const { stores, activeStore, isLoadingStores, changeActiveStore } = useStoreContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (isLoadingStores) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl animate-pulse">
        <Store size={18} className="text-gray-400" />
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (stores.length === 0) {
    return null;
  }

  if (stores.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
        <Store size={18} className="text-gray-600" />
        <span className="text-sm font-bold text-gray-800">{activeStore?.name}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Store size={18} className="text-gray-700" />
        <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
          {activeStore?.name}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-2">
            <div className="px-3 pb-2 mb-2 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tus Sucursales</p>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => {
                    changeActiveStore(store);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                    activeStore?.id === store.id 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{store.name}</span>
                  {activeStore?.id === store.id && (
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 mt-2 border-t border-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/merchant/branch/new');
                }}
                className="w-full text-left px-4 py-2 text-sm font-bold text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Agregar nueva sucursal
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MerchantBranchSelector;
