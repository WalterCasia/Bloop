import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Store, UserCircle, ArrowLeft, Mail, Lock, KeyRound } from 'lucide-react';
import apiClient from '../../api/apiClient';

const MerchantAuthFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // view: 'select' | 'employee_login'
  const [view, setView] = useState('select');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && view === 'select') {
      const role = user.user_metadata?.role;
      if (role === 'CLIENTE') {
        navigate('/explore', { replace: true });
      } else if (role === 'COMERCIO') {
        const onboardingCompleted = user.user_metadata?.onboarding_completed;
        if (!onboardingCompleted) {
          navigate('/onboarding/merchant', { replace: true });
        } else {
          navigate('/merchant/dashboard', { replace: true });
        }
      }
    }
  }, [user, navigate, view]);

  const handleManagerSelect = () => {
    // Si ya tiene cuenta, pero eligió gerente, lo mandamos a login y luego onboarding/dashboard
    // Como simplificación de este flujo, el dueño va a la página de registro/onboarding
    navigate('/signup');
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!inviteCode || inviteCode.length !== 6) {
        throw new Error('El código de invitación debe tener 6 caracteres.');
      }

      // El empleado primero inicia sesión o se registra. 
      // Asumiremos que el empleado usa este formulario para crear su cuenta/iniciar sesión con el código.
      // 1. Intentamos iniciar sesión
      let authUser;
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Si no existe, lo registramos
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: 'COMERCIO',
                onboarding_completed: true // Empleados no necesitan hacer el wizard
              }
            }
          });
          if (signUpError) throw signUpError;
          
          if (!signUpData.user) {
             throw new Error("Por favor verifica tu correo para continuar.");
          }
          authUser = signUpData.user;
        } else {
          throw signInError;
        }
      } else {
        authUser = signInData.user;
      }

      // 2. Ya autenticados, consumimos la invitación a través de nuestro endpoint
      try {
        const { session } = await supabase.auth.getSession();
        await apiClient.post('/api/merchant/invitations/accept', 
          { code: inviteCode.toUpperCase() },
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
      } catch (invError) {
        // Falló la invitación (código inválido o expirado)
        throw new Error(invError.response?.data?.message || 'Código de invitación inválido o expirado.');
      }

      // 3. Todo salió bien
      navigate('/merchant/dashboard', { replace: true });

    } catch (err) {
      setError(err.message || 'Error en la autenticación como empleado.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'employee_login') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <button 
            onClick={() => setView('select')}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Volver atrás
          </button>

          <h2 className="text-3xl font-extrabold text-gray-900">
            Acceso de Empleados
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales y el código de 6 dígitos proporcionado por tu gerente.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleEmployeeLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-blue-600">Código de Invitación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="appearance-none block w-full pl-10 pr-3 py-4 border-2 border-blue-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-xl font-black tracking-[0.2em] uppercase bg-blue-50/50"
                    placeholder="ABC123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verificando...' : 'Acceder al Comercio'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PASO 1: SELECCIÓN DE ROL B2B ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Portal B2B</h1>
        <h2 className="mt-4 text-xl font-medium text-gray-600">
          ¿Cómo deseas acceder a tu comercio?
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={handleManagerSelect}
            className="flex items-start p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-900 hover:shadow-md transition-all text-left"
          >
            <div className="p-3 bg-gray-100 rounded-full mr-4 text-gray-700">
              <Store size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Soy Propietario / Gerente</h3>
              <p className="mt-1 text-sm text-gray-500 font-medium">Registraré un nuevo negocio en la plataforma o administraré mis tiendas actuales.</p>
            </div>
          </button>

          <button
            onClick={() => setView('employee_login')}
            className="flex items-start p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all text-left group"
          >
            <div className="p-3 bg-blue-50 rounded-full mr-4 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <UserCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Soy Empleado</h3>
              <p className="mt-1 text-sm text-gray-500 font-medium">Tengo un código de invitación de mi gerente para unirme a un local existente.</p>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
           <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center w-full gap-2">
              <ArrowLeft size={16} /> Volver a la página principal
           </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantAuthFlow;
