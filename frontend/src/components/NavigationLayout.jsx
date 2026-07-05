import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationLayout = () => {
  const { user, signOut } = useAuth();
  const role = user?.user_metadata?.role || 'CLIENTE';
  
  // Estado para el submenú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const Icons = {
    explore: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
        <line x1="9" y1="3" x2="9" y2="18"></line>
        <line x1="15" y1="6" x2="15" y2="21"></line>
      </svg>
    ),
    orders: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
        <path d="M3 6h18"></path>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
    ),
    profile: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    scanner: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
        <rect width="5" height="5" x="7" y="7" rx="1"></rect>
        <rect width="5" height="5" x="12" y="12" rx="1"></rect>
      </svg>
    ),
    inventory: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
        <path d="m3.3 7 8.7 5 8.7-5"></path>
        <path d="M12 22V12"></path>
      </svg>
    ),
    stats: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    menu: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="18" x2="20" y2="18"></line>
      </svg>
    ),
    logout: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    )
  };

  const clientLinks = [
    { label: 'Explorar', path: '/explore', icon: Icons.explore },
    { label: 'Mis Pedidos', path: '/customer/orders', icon: Icons.orders },
    { label: 'Perfil', path: '/profile', icon: Icons.profile },
  ];

  const merchantLinks = [
    { label: 'Escáner QR', path: '/merchant/dashboard', icon: Icons.scanner },
    { label: 'Inventario', path: '/merchant/stock', icon: Icons.inventory },
    { label: 'Perfil', path: '/merchant/profile', icon: Icons.profile },
    { label: 'Estadísticas', path: '/merchant/stats', icon: Icons.stats },
  ];

  const links = role === 'COMERCIO' ? merchantLinks : clientLinks;

  const NavItem = ({ label, path, icon }) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex flex-col md:flex-row items-center md:justify-start justify-center gap-1 md:gap-3 p-2 md:px-6 md:py-3 w-full transition-colors duration-200 ${
          isActive 
            ? 'text-green-600 bg-green-50 md:border-r-4 md:border-green-600 md:bg-green-50' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] md:text-sm font-semibold">{label}</span>
    </NavLink>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 relative">
      
      {/* =========================================
          Sidebar para Escritorio (md+)
          ========================================= */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 shadow-sm z-50">
        <div className="p-6 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-2xl font-black text-green-600 tracking-tight">Bloop.</h1>
        </div>
        
        <nav className="flex-1 mt-6 flex flex-col gap-2">
          {links.map((link) => (
            <NavItem key={link.path} {...link} />
          ))}
        </nav>
        
        {/* Botón Logout (Escritorio) al final */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={signOut}
            className="flex items-center justify-start gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
          >
            <div className="w-5 h-5">{Icons.logout}</div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          Contenido Principal
          ========================================= */}
      <main className="flex-1 md:ml-64 pb-16 md:pb-0 w-full relative h-screen overflow-y-auto">
        <Outlet />
      </main>

      {/* =========================================
          Submenú Móvil (Overlay)
          ========================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute bottom-16 right-4 bg-white p-2 rounded-xl shadow-lg border border-gray-100 w-48 mb-2 animate-in fade-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={signOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-sm"
            >
              <div className="w-5 h-5">{Icons.logout}</div>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          Barra de Navegación Inferior Móvil
          ========================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 pb-safe">
        {links.map((link) => (
          <NavItem key={link.path} {...link} />
        ))}
        
        {/* Tab de Submenú Móvil */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center gap-1 p-2 w-full transition-colors duration-200 ${
            isMobileMenuOpen ? 'text-green-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="w-6 h-6">{Icons.menu}</div>
          <span className="text-[10px] font-semibold">Más</span>
        </button>
      </nav>

    </div>
  );
};

export default NavigationLayout;
