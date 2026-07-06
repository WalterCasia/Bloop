import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, MapPin, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const filters = [
  'Todos',
  'Panadería y Pastelería',
  'Restaurantes',
  'Supermercados',
  'Recogida Hoy',
  'Recogida Mañana',
  'Vegano/Vegetariano'
];

const zones = [
  'Antigua Guatemala',
  'Zona 10 - Ciudad de Guatemala',
  'Zona 4 - Cuatro Grados Norte',
  'Zona 15',
  'Cayalá'
];

const ClientTopNav = ({
  activeLocationMode = 'GPS', // 'GPS' o 'ZONE'
  selectedZone = 'Antigua Guatemala',
  selectedRadius = 5,
  activeFilter = 'Todos',
  pendingOrdersCount = 0,
  onLocationChange,
  onZoneChange,
  onRadiusChange,
  onFilterChange,
  onSearch
}) => {
  const { signOut, user } = useAuth();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showRadiusDropdown, setShowRadiusDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLocationClick = (mode) => {
    if (mode === 'GPS') {
      if (onLocationChange) onLocationChange();
    }
    setShowLocationDropdown(false);
  };

  const handleZoneClick = (zone) => {
    if (onZoneChange) onZoneChange(zone);
    setShowLocationDropdown(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm w-full font-sans">
      {/* 1. Fila Principal */}
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Extremo Izquierdo (Marca) */}
        <Link to="/explore" className="flex-shrink-0">
          <h1 className="text-2xl font-black text-green-600 tracking-tight">Bloop.</h1>
        </Link>

        {/* Centro (Barra de Selección / Píldora de Búsqueda) */}
        <div className="hidden lg:flex rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow items-center p-1.5 bg-white relative">
          
          {/* Selector de Ubicación */}
          <div className="relative">
            <button 
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-full transition-colors text-sm font-medium text-gray-700"
            >
              <MapPin size={18} className="text-gray-500" />
              <span className="truncate max-w-[150px]">
                {activeLocationMode === 'GPS' ? 'Mi ubicación actual' : selectedZone}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {showLocationDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                <button 
                  onClick={() => handleLocationClick('GPS')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Mi ubicación actual (GPS)
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Zonas de Guatemala</div>
                {zones.map((zone) => (
                  <button
                    key={zone}
                    onClick={() => handleZoneClick(zone)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {zone}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 border-l border-gray-300 mx-1"></div>

          {/* Selector de Radio */}
          <div className="relative">
            <button 
              onClick={() => setShowRadiusDropdown(!showRadiusDropdown)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-full transition-colors text-sm font-medium text-gray-700"
            >
              A {selectedRadius} km
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            
            {showRadiusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                {[3, 5, 10].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => {
                      if (onRadiusChange) onRadiusChange(radius);
                      setShowRadiusDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    A {radius} km
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón de Búsqueda */}
          <button 
            onClick={onSearch}
            className="rounded-full bg-red-500 hover:bg-red-600 text-white p-2.5 ml-2 transition-colors shadow-sm"
          >
            <Search size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Extremo Derecho (Acciones de Usuario) */}
        <div className="flex items-center gap-3">
          <Link 
            to="/customer/orders"
            className="rounded-full px-4 py-2 border border-gray-300 hover:bg-gray-100 font-medium text-sm flex items-center gap-2 text-gray-700 transition-colors relative"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Mis Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {pendingOrdersCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors border border-gray-300 overflow-hidden"
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </button>
            
            {showProfileDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Mi Perfil</Link>
                <Link to="/client/preferences" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Preferencias</Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={signOut}
                  className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Fila Inferior (Filtros Rápidos en Carrusel Horizontal) */}
      <div className="flex items-center gap-3 overflow-x-auto py-3 px-6 bg-white border-t border-gray-100" style={{ scrollbarWidth: 'none' }}>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange && onFilterChange(filter)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === filter 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClientTopNav;
