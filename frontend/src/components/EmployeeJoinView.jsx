import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { KeyRound, Mail, Lock, ArrowRight, Store, CheckCircle2 } from 'lucide-react';

const EmployeeJoinView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Si el usuario ya está autenticado, solo necesita ingresar el código
  const isAuthenticated = !!user;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      setError('Por favor ingresa un código de invitación válido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let currentUser = user;

      // 1. Si no está autenticado, registrarlo
      if (!isAuthenticated) {
        if (!email || !password) {
          throw new Error('Correo y contraseña son requeridos para crear tu cuenta.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('No se pudo crear la cuenta de usuario.');
        
        currentUser = data.user;
        
        // Dar tiempo a Supabase para establecer la sesión localmente
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. Canjear el código usando el endpoint del backend
      // El apiClient inyectará automáticamente el JWT de Supabase
      const response = await apiClient.post('/api/merchant/invitations/redeem', {
        code: code.trim().toUpperCase()
      });

      if (response.data.status === 'success') {
        setSuccess(true);
        // Esperar un momento para mostrar el mensaje de éxito y redirigir
        setTimeout(() => {
          // Forzamos la recarga de sesión para que el contexto Auth detecte el nuevo rol
          supabase.auth.refreshSession().then(() => {
            navigate('/merchant/dashboard', { replace: true });
          });
        }, 1500);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error al validar la invitación.');
      
      // Si falló el canje pero se creó la cuenta, advertir
      if (!isAuthenticated && !err.response) {
         setError('Tu cuenta fue creada, pero el código es inválido. Inicia sesión e inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">¡Bienvenido al Equipo!</h2>
          <p className="text-gray-500">Tu cuenta ha sido vinculada exitosamente a la sucursal.</p>
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Portal de Empleados</h1>
          <p className="text-gray-500 mt-2">Ingresa el código que te proporcionó tu gerente para unirte a la sucursal.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo del Código (Siempre visible) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <KeyRound size={16} className="text-gray-400" />
                Código de Invitación
              </label>
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg tracking-widest uppercase transition-all"
                placeholder="B-XXXX"
              />
            </div>

            {/* Campos de Registro (Solo si no está autenticado) */}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-bold text-gray-900 mb-2">Crea tu cuenta de acceso</p>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="tu@correo.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Lock size={16} className="text-gray-400" />
                    Contraseña
                  </label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Sesión Activa</p>
                  <p className="text-xs text-blue-700">{user.email}</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isAuthenticated ? 'Vincular a Sucursal' : 'Crear Cuenta y Unirse'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>

          </form>
        </div>
        
        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmployeeJoinView;
