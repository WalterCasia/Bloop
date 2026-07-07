import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import ClientDietStep from './steps/ClientDietStep';

const ClientAuthFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para el paso 2: Preferencias (array para multi-selección)
  const [selectedDiets, setSelectedDiets] = useState([]);

  useEffect(() => {
    // Manejo de ruteo si ya está autenticado
    if (user) {
      const role = user.user_metadata?.role;
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (role === 'OWNER' || role === 'STAFF') {
        supabase.auth.signOut().then(() => {
          setError('Esta cuenta pertenece a un comercio. Por favor ingresa a través del Portal para Comercios.');
        });
        return;
      }

      if (role === 'CLIENTE' && onboardingCompleted) {
        navigate('/explore', { replace: true });
        return;
      }

      // Si es cliente pero no ha completado el onboarding, mostramos preferencias (step 2)
      if (role === 'CLIENTE' && !onboardingCompleted && step === 1) {
        setStep(2);
      } else if (!role) {
        // Usuario legacy o Auth Google inicial: asignamos rol y mostramos preferencias
        assignClientRole();
      }
    }
  }, [user, navigate, step]);

  const assignClientRole = async () => {
    try {
      await supabase.auth.updateUser({
        data: { role: 'CLIENTE', onboarding_completed: false }
      });
      setStep(2);
    } catch (err) {
      console.error("Error setting client role:", err);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        if (data?.user?.user_metadata?.role === 'OWNER' || data?.user?.user_metadata?.role === 'STAFF') {
          await supabase.auth.signOut();
          throw new Error('Esta cuenta pertenece a un comercio. Por favor ingresa a través del Portal para Comercios.');
        }
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
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      localStorage.setItem('oauth_intended_role', 'CLIENTE');
      
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
      setError(err.message || 'Error al registrarse con Google.');
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setError('');
    try {
      const dietString = selectedDiets.length > 0 ? selectedDiets.join(',') : 'none';
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          dietary_preference: dietString,
          onboarding_completed: true
        }
      });

      if (updateError) throw updateError;
      
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
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      handleAuth();
    } else if (step === 2) {
      handleSavePreferences();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      // Si el usuario ya está autenticado y trata de ir atrás desde preferencias,
      // la única opción sensata sería cerrar sesión o volver al landing.
      supabase.auth.signOut().then(() => navigate('/'));
    } else {
      navigate('/');
    }
  };

  const canContinue = () => {
    if (step === 1) {
      if (isLogin) return email && password;
      return fullName && email && password;
    }
    if (step === 2) {
      return selectedDiets.length > 0;
    }
    return false;
  };

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={2}
      onBack={handleBack}
      onNext={handleNext}
      onSkip={step === 2 ? () => { setSelectedDiets(['none']); handleNext(); } : undefined}
      canContinue={canContinue()}
      isLoading={loading}
      nextLabel={step === 1 ? (isLogin ? 'Entrar' : 'Crear Cuenta') : 'Finalizar'}
    >
      {step === 1 && (
        <div className="w-full animation-fade-in max-w-md mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta B2C'}
          </h1>
          <p className="mt-4 text-gray-500 text-lg mb-8">
            O{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-gray-900 underline hover:text-gray-600">
              {isLogin ? 'crea una cuenta nueva' : 'inicia sesión en tu cuenta'}
            </button>
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
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
                    className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-base transition-colors"
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
                  className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-base transition-colors"
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
                  className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black sm:text-base transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {/* Ocultamos submit real ya que OnboardingLayout controla el flujo, pero permitimos Enter */}
            <button type="submit" className="hidden" />
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">O continuar con</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-gray-300 rounded-xl shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
            >
              <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <ClientDietStep 
          selectedDiets={selectedDiets}
          setSelectedDiets={setSelectedDiets}
        />
      )}
    </OnboardingLayout>
  );
};

export default ClientAuthFlow;
