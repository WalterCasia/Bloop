import React, { useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MerchantBranchSelector from '../MerchantBranchSelector';
import { 
  Home, 
  Store, 
  ShoppingBag, 
  TrendingUp, 
  Star, 
  Package, 
  FileText, 
  CreditCard, 
  Settings,
  LogOut,
  HelpCircle,
  MessageCircleQuestion
} from 'lucide-react';

const MerchantDashboardLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Inicio', path: '/merchant/dashboard', icon: Home },
    { name: 'Sucursales', path: '/merchant/employees', icon: Store }, // Empleados y sucursales (actualmente en /merchant/employees)
    { name: 'Pedidos', path: '/merchant/orders', icon: ShoppingBag },
    { name: 'Rendimiento', path: '/merchant/performance', icon: TrendingUp },
    { name: 'Reseñas', path: '/merchant/reviews', icon: Star },
    { name: 'Packs / Menú', path: '/merchant/daily-stock', icon: Package },
    { name: 'Reportes', path: '/merchant/reports', icon: FileText },
    { name: 'Pagos', path: '/merchant/payments', icon: CreditCard },
    { name: 'Configuración', path: '/merchant/settings', icon: Settings },
  ];

  // Determinar el título de la página actual
  const currentPageTitle = useMemo(() => {
    const currentLink = navLinks.find(link => location.pathname.startsWith(link.path));
    return currentLink ? currentLink.name : 'Panel de Administración';
  }, [location.pathname]);

  const NavItem = ({ name, path, icon: Icon }) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-gray-100 font-semibold text-black' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
        }`
      }
    >
      <Icon size={20} strokeWidth={2} />
      <span className="text-sm">{name}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* 1. Barra Lateral Izquierda */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col justify-between p-4 sticky top-0 flex-shrink-0 z-20">
        <div className="flex flex-col h-full">
          {/* Logo / Título */}
          <div className="px-3 mb-6 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-2xl font-black text-green-600 tracking-tight">Bloop.</h1>
          </div>

          {/* Selector de Sucursal */}
          <div className="mb-6">
            <MerchantBranchSelector />
          </div>

          {/* Menú de Navegación */}
          <nav className="flex-1 overflow-y-auto space-y-1 pr-2">
            {navLinks.map((link) => (
              <NavItem key={link.name} {...link} />
            ))}
          </nav>
        </div>
      </aside>

      {/* Contenedor Principal (Header + Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* 2. Barra Superior (Header) */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white flex-shrink-0 z-10">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-900">{currentPageTitle}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <HelpCircle size={18} />
              Ayuda
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <MessageCircleQuestion size={18} />
              Preguntas frecuentes
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button 
              onClick={signOut}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* 3. Área de Contenido Principal */}
        <main className="flex-1 bg-white p-8 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default MerchantDashboardLayout;
