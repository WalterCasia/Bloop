import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirigir automáticamente si ya existe una sesión activa (ej: al volver de Google OAuth)
  useEffect(() => {
    if (user) {
      const userRole = user.user_metadata?.role;
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (!userRole || !onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else if (userRole === 'OWNER' || userRole === 'STAFF' || userRole === 'COMERCIO') {
        navigate('/merchant/dashboard', { replace: true });
      } else {
        navigate('/explore', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Inicio de sesión
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Redirección protegida basada en el rol recuperado de la sesión
      const userRole = data.user.user_metadata?.role;
      const onboardingCompleted = data.user.user_metadata?.onboarding_completed;
      
      if (!userRole || !onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else if (userRole === 'OWNER' || userRole === 'STAFF' || userRole === 'COMERCIO') {
        navigate('/merchant/dashboard', { replace: true });
      } else {
        navigate('/explore', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Ha ocurrido un error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button 
            type="button"
            onClick={() => navigate('/')}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '2rem', 
              fontWeight: '900', 
              color: '#16A34A', 
              letterSpacing: '-0.05em',
              padding: 0
            }}
          >
            Bloop.
          </button>
        </div>

        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
          Bienvenido de nuevo
        </h2>
        <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '24px' }}>
          Ingresa tus credenciales para acceder.
        </p>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#B91C1C', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem', textAlign: 'center', border: '1px solid #FECACA', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }}
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>



          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              backgroundColor: '#16A34A', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: loading ? 'wait' : 'pointer',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Procesando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
          <span style={{ margin: '0 10px', color: '#9CA3AF', fontSize: '0.875rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: 'white',
            color: '#374151',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontWeight: 'bold',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.69 17.57V20.34H19.26C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.26 20.34L15.69 17.57C14.71 18.23 13.46 18.63 12 18.63C9.17 18.63 6.77 16.72 5.88 14.16H2.19V17.02C3.99 20.61 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.88 14.16C5.65 13.48 5.52 12.76 5.52 12C5.52 11.24 5.65 10.52 5.88 9.84V6.98H2.19C1.45 8.46 1 10.18 1 12C1 13.82 1.45 15.54 2.19 17.02L5.88 14.16Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.34 3.88C17.46 2.13 14.97 1 12 1C7.7 1 3.99 3.39 2.19 6.98L5.88 9.84C6.77 7.28 9.17 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#4B5563' }}>
          ¿No tienes una cuenta?{' '}
          <button 
            type="button"
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
          >
            Regístrate
          </button>
        </div>
      
      </div>
    </div>
  );
};

export default LoginPage;
