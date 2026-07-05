import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirigir si el usuario ya tiene sesión activa
  useEffect(() => {
    if (user) {
      const userRole = user.user_metadata?.role;
      if (!userRole) {
        navigate('/onboarding', { replace: true });
      } else if (userRole === 'COMERCIO') {
        navigate('/merchant/dashboard', { replace: true });
      } else {
        navigate('/explore', { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#111827', margin: 0, padding: 0 }}>
      {/* Barra de Navegación */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16A34A', letterSpacing: '-0.05em' }}>Bloop.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#4B5563' }}
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => navigate('/signup')}
            style={{ padding: '8px 16px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Registrarse
          </button>
        </div>
      </nav>

      {/* Sección Principal (Hero) */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: 1.2, marginBottom: '24px' }}>
          Salva comida deliciosa.<br/>
          <span style={{ color: '#16A34A' }}>Ahorra hasta un 70%.</span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: '#4B5563', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Únete a Bloop y rescata los excedentes diarios de tus restaurantes y comercios locales antes de que cierren. Bueno para tu bolsillo, excelente para el planeta.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/signup')}
            style={{ fontSize: '1.125rem', padding: '16px 32px', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.2)' }}
          >
            Comenzar Ahora
          </button>
        </div>
      </main>

      {/* Sección Explicativa */}
      <section style={{ backgroundColor: '#F9FAFB', padding: '80px 20px', marginTop: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📍</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>1. Localiza</h3>
            <p style={{ color: '#6B7280', lineHeight: 1.5 }}>Utiliza nuestro mapa geoespacial en tiempo real para encontrar packs sorpresa cerca de ti.</p>
          </div>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>2. Reserva</h3>
            <p style={{ color: '#6B7280', lineHeight: 1.5 }}>Bloquea el inventario de forma segura y obtén un código QR encriptado único.</p>
          </div>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😋</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>3. Rescata</h3>
            <p style={{ color: '#6B7280', lineHeight: 1.5 }}>Muestra tu código en el local durante el horario establecido y disfruta de la comida.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
