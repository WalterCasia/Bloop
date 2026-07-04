import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENTE'); // Permite alternar entre 'CLIENTE' o 'COMERCIO' durante el registro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Registro de nuevo usuario inyectando el rol directamente en el user_metadata
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            }
          }
        });

        if (signUpError) throw signUpError;
        
        alert('Registro exitoso. Si tienes la confirmación de correo activada en Supabase, revisa tu bandeja de entrada.');
        setIsSignUp(false); // Forzamos el cambio a Login
      } else {
        // Inicio de sesión
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Redirección protegida basada en el rol recuperado de la sesión
        const userRole = data.user.user_metadata?.role || 'CLIENTE';
        if (userRole === 'COMERCIO') {
          navigate('/merchant/dashboard', { replace: true });
        } else {
          navigate('/explore', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Ha ocurrido un error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
        
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
          {isSignUp ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
        </h2>
        <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: '24px' }}>
          {isSignUp ? 'Únete a Bloop y empieza a salvar comida.' : 'Ingresa tus credenciales para acceder.'}
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

          {/* Selector de rol dinámico solo visible durante el proceso de registro */}
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>¿Cómo usarás Bloop?</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', backgroundColor: 'white' }}
              >
                <option value="CLIENTE">Soy un Cliente (Quiero comprar packs)</option>
                <option value="COMERCIO">Soy un Comercio (Quiero vender excedentes)</option>
              </select>
            </div>
          )}

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
            {loading ? 'Procesando...' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#4B5563' }}>
          {isSignUp ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
          >
            {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </div>
      
      </div>
    </div>
  );
};

export default LoginPage;
