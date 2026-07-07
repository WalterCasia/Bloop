import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Leaf, Vegan, WheatOff, Utensils, Mail, Lock, ArrowRight, User } from 'lucide-react';

const ClientAuthFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para el paso 2: Preferencias
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState('');

  const DIETARY_OPTIONS = [
    { id: 'none', label: 'Sin restricciones', icon: Utensils, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
    { id: 'vegetarian', label: 'Vegetariano', icon: Leaf, color: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' },
    { id: 'vegan', label: 'Vegano', icon: Vegan, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
    { id: 'gluten_free', label: 'Sin Gluten', icon: WheatOff, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' }
  ];

  useEffect(() => {
    // Si ya hay usuario y no estamos mostrando la pantalla de preferencias, evaluamos hacia dónde ir
    if (user && !showPreferences) {
      const role = user.user_metadata?.role;
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (role === 'COMERCIO') {
        navigate('/merchant/dashboard', { replace: true });
        return;
      }

      if (role === 'CLIENTE' && onboardingCompleted) {
        navigate('/explore', { replace: true });
        return;
      }

      // Si es cliente pero no ha completado el onboarding, mostramos preferencias
      if (role === 'CLIENTE' && !onboardingCompleted) {
        setShowPreferences(true);
      } else if (!role) {
        // Usuario legacy o Auth Google inicial: asignamos rol y mostramos preferencias
        assignClientRole();
      }
    }
  }, [user, navigate, showPreferences]);

  const assignClientRole = async () => {
    try {
      await supabase.auth.updateUser({
        data: { role: 'CLIENTE', onboarding_completed: false }
      });
      setShowPreferences(true);
    } catch (err) {
      console.error("Error setting client role:", err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        if (!fullName.trim()) throw new Error('Por favor, ingresa tu nombre completo.');
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'CLIENTE',
              onboarding_completed: false
            }
          }
        });
        if (signUpError) throw signUpError;
        
        // Supabase auto logins on signup mostly, the useEffect will catch it
        // If email confirmation is required, handle it:
        alert('Registro exitoso. Iniciando sesión...');
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          dietary_preference: selectedDiet || 'none',
          onboarding_completed: true
        }
      });

      if (updateError) throw updateError;
      
      // La base de datos asume que existe un perfil. Crearlo si es necesario o un trigger ya lo hizo.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: 'CLIENTE',
          full_name: user.user_metadata?.full_name || fullName || 'Cliente Nuevo',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
      if (profileError) console.warn("Error upserting profile:", profileError);

      navigate('/explore', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al guardar preferencias.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER PASO 2: PREFERENCIAS ---
  if (showPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Personaliza tu experiencia
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Tienes alguna preferencia dietética?
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {DIETARY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedDiet === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedDiet(option.id)}
                    className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300 bg-white'
                    }`}
                  >
                    <div className={`p-3 rounded-full mr-4 ${isSelected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-bold text-lg ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                        {option.label}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={loading || !selectedDiet}
              className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : 'Comenzar a explorar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PASO 1: AUTH ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-black text-green-600 tracking-tight">Bloop.</h1>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta B2C'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          O{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-green-600 hover:text-green-500">
            {isLogin ? 'crea una cuenta nueva' : 'inicia sesión en tu cuenta'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
            )}

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
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Crear Cuenta')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button onClick={() => navigate(-1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center w-full gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" /> Volver atrás
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAuthFlow;
