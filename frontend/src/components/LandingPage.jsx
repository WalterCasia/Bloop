import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, MapPin, Leaf, TrendingDown, Store, Star, ArrowRight, Smartphone, ShoppingBag } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirección si ya hay sesión activa
  useEffect(() => {
    if (user) {
      const userRole = user.user_metadata?.role;
      const intendedRole = localStorage.getItem('oauth_intended_role');
      
      if (intendedRole) {
        localStorage.removeItem('oauth_intended_role');
        if (intendedRole === 'COMERCIO') {
          navigate('/auth/merchant', { replace: true });
        } else {
          navigate('/auth/client', { replace: true });
        }
        return;
      }

      if (!userRole) {
        navigate('/auth/client', { replace: true });
      } else if (userRole === 'OWNER' || userRole === 'STAFF' || userRole === 'COMERCIO') {
        navigate('/merchant/dashboard', { replace: true });
      } else {
        navigate('/explore', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleExploreClick = () => {
    if (user) {
      navigate('/explore');
    } else {
      navigate('/auth/client');
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* 1. Barra de Navegación Global */}
      <header className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="text-green-600 font-bold text-2xl tracking-tight cursor-pointer">Bloop.</div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('como-funciona')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Cómo funciona</button>
            <button onClick={handleExploreClick} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Explorar mapa</button>
            <button onClick={() => scrollToSection('impacto-ambiental')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Impacto ambiental</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/auth/merchant')}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden sm:block"
          >
            Portal de Socios
          </button>
          <button 
            onClick={() => navigate('/auth/client')}
            className="rounded-full bg-black text-white px-6 py-2.5 text-sm font-medium hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* 2. Sección Hero Inmersiva */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-16 px-8 max-w-7xl mx-auto">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-none">
            Salva comida deliciosa.<br/>Protege el planeta.
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
            Rescata excedentes de restaurantes, panaderías y cafeterías locales con hasta un 70% de descuento. Disfruta de comida en perfecto estado mientras ayudas a reducir el desperdicio.
          </p>

          {/* Píldora de Búsqueda (Interactiva) */}
          <div 
            onClick={() => navigate('/auth/client')}
            className="rounded-full border border-gray-200 shadow-lg p-2 flex items-center bg-white hover:border-gray-300 transition-colors max-w-xl cursor-pointer mt-4 group"
          >
            <div className="flex-1 flex flex-col px-6">
              <span className="text-xs font-bold tracking-wider text-gray-900 uppercase">Dónde</span>
              <span className="text-sm text-gray-500 font-medium">Ubicación actual o zona de Guatemala</span>
            </div>
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors shadow-md">
              <Search className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Columna Visual (Simulación App) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden group hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 shadow-sm border border-gray-100">
              <Star className="w-4 h-4 text-green-600 fill-green-600" />
              <span className="text-xs font-bold text-gray-900">Favorito entre usuarios</span>
            </div>
            
            <div className="h-64 w-full bg-gray-100 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80" 
                alt="Panadería" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Pack Sorpresa de Horneados</h3>
                  <p className="text-sm text-gray-500 font-medium">Panadería San Martín · Zona 10</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-gray-400 line-through text-sm font-medium">GTQ 75.00</span>
                <span className="text-xl font-black text-gray-900">GTQ 25.00</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sección Cómo Funciona */}
      <section id="como-funciona" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Cómo funciona Bloop</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Encuentra comida</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              Explora el mapa y descubre restaurantes, panaderías y cafeterías cerca de ti con excedentes diarios deliciosos.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Smartphone className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Reserva y paga</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              Asegura tu pack sorpresa directamente en la app con un descuento increíble antes de que se agote.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Recoge y salva</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              Muestra tu código en el local, recoge tu comida y disfruta sabiendo que ayudaste al planeta.
            </p>
          </div>
        </div>
      </section>

      {/* Sección Impacto Global */}
      <section id="impacto-ambiental" className="bg-green-900 text-white py-24 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-16 tracking-tight">Nuestro Impacto Global</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col items-center">
              <span className="text-6xl lg:text-7xl font-black text-green-400 mb-4 tracking-tighter">35,400</span>
              <span className="text-xl font-medium text-green-100">Kg de CO2 evitados</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-6xl lg:text-7xl font-black text-white mb-4 tracking-tighter">14,200</span>
              <span className="text-xl font-medium text-green-100">Packs Salvados</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cuadrícula de Propuesta de Valor (Bento Box) */}
      <section className="bg-gray-50/50 py-20 px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Por qué usar Bloop</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Tarjeta Cliente */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
              <TrendingDown className="w-6 h-6 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ahorra más del 60%</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              Disfruta de la mejor calidad a una fracción del precio. Rescatar comida no solo es ético, sino que cuida directamente tu economía diaria.
            </p>
          </div>

          {/* Tarjeta Impacto */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Reduce la huella de CO2</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              Cada pack salvado evita en promedio 2.5kg de emisiones de CO2 equivalente. Juntos hacemos un impacto ambiental tangible.
            </p>
          </div>

          {/* Tarjeta B2B */}
          <div className="bg-gray-900 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => navigate('/auth/merchant')}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Store className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Únete como comercio</h3>
              <p className="text-gray-400 leading-relaxed font-medium mb-6">
                Convierte tus excedentes en ingresos extra y atrae nuevos clientes a tu local de forma sencilla y automatizada.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:text-green-400 transition-colors">
                Descubre el portal de socios <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Sección de Cierre y Llamada a la Acción */}
      <section className="py-24 px-8 text-center border-t border-gray-100 max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Listo para hacer el cambio?</h2>
        <p className="text-xl text-gray-500 font-medium mb-12 max-w-2xl mx-auto">
          Miles de guatemaltecos ya están salvando comida todos los días. Únete a la comunidad de rescate.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/auth/client')}
            className="w-full sm:w-auto rounded-full bg-black text-white px-8 py-4 text-base font-bold hover:bg-gray-800 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Empezar a salvar comida
          </button>
          <button 
            onClick={() => navigate('/auth/merchant')}
            className="w-full sm:w-auto rounded-full bg-white text-gray-900 border border-gray-200 px-8 py-4 text-base font-bold hover:border-gray-900 hover:bg-gray-50 transition-all"
          >
            Quiero afiliar mi restaurante
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
