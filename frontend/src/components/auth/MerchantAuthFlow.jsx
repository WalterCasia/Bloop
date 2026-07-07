import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, KeyRound, UserCircle } from 'lucide-react';
import apiClient from '../../api/apiClient';
import OnboardingLayout from './OnboardingLayout';
import MerchantRoleStep from './steps/MerchantRoleStep';

const MerchantAuthFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(''); // 'manager' | 'employee'
  const [isLogin, setIsLogin] = useState(false); // only applies to manager flow for now
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      if (!role) {
        // Asignar rol COMERCIO para Google Auth sin rol previo
        assignMerchantRole();
      } else if (role === 'CLIENTE') {
        supabase.auth.signOut().then(() => {
          setError('Esta cuenta pertenece a un cliente. Por favor ingresa a través del Portal para Clientes.');
          setStep(2); // Forzamos ir al form para ver el error
          setSelectedRole('employee');
        });
      } else if (role === 'OWNER' || role === 'STAFF' || role === 'COMERCIO') {
        const onboardingCompleted = user.user_metadata?.onboarding_completed;
        if (!onboardingCompleted) {
          navigate('/onboarding/merchant', { replace: true });
        } else {
          navigate('/merchant/dashboard', { replace: true });
        }
      }
    }
  }, [user, navigate]);

  const assignMerchantRole = async () => {
    try {
      await supabase.auth.updateUser({
        data: { role: 'OWNER', onboarding_completed: false }
      });
      // El navegador será redirigido automáticamente por el useEffect una vez que se actualice la sesión.
    } catch (err) {
      console.error("Error setting merchant role:", err);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (selectedRole) {
        setStep(2);
      }
    } else if (step === 2) {
      if (selectedRole === 'employee') {
        handleEmployeeLogin();
      } else {
        handleManagerAuth();
      }
    }
  };

  const handleManagerAuth = async () => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        if (data?.user?.user_metadata?.role === 'CLIENTE') {
          await supabase.auth.signOut();
          throw new Error('Esta cuenta pertenece a un cliente. Por favor ingresa a través del Portal para Clientes.');
        }
      } else {
        if (!fullName.trim()) throw new Error('Por favor, ingresa tu nombre completo.');
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'OWNER',
              onboarding_completed: false
            }
          }
        });
        if (signUpError) throw signUpError;
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      localStorage.setItem('oauth_intended_role', 'COMERCIO');
      
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
      setError(err.message || 'Error al autenticarse con Google.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError('');
    } else {
      navigate('/');
    }
  };

  const handleEmployeeLogin = async () => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        if (signInData?.user?.user_metadata?.role === 'CLIENTE') {
          await supabase.auth.signOut();
          throw new Error('Esta cuenta pertenece a un cliente. Por favor ingresa a través del Portal para Clientes.');
        }
      } else {
        if (!inviteCode || inviteCode.length !== 6) {
          throw new Error('El código de invitación debe tener 6 caracteres.');
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'STAFF',
              onboarding_completed: true
            }
          }
        });
        
        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('Esta cuenta ya existe. Por favor inicia sesión.');
          }
          throw signUpError;
        }
        
        if (!signUpData.user) {
           throw new Error("Por favor verifica tu correo para continuar.");
        }

        try {
          const { session } = await supabase.auth.getSession();
          if (session) {
            await apiClient.post('/api/merchant/invitations/redeem', 
              { code: inviteCode.toUpperCase() },
              { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
          }
        } catch (invError) {
          throw new Error(invError.response?.data?.message || 'Código de invitación inválido o expirado.');
        }
      }

      navigate('/merchant/dashboard', { replace: true });

    } catch (err) {
      setError(err.message || 'Error en la autenticación como empleado.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => {
    if (step === 1) return !!selectedRole;
    if (step === 2) {
      if (selectedRole === 'employee') {
        if (isLogin) return email && password;
        return email && password && inviteCode.length === 6;
      }
      if (selectedRole === 'manager') {
        if (isLogin) return email && password;
        return fullName && email && password;
      }
    }
    return false;
  };

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={2}
      onBack={handleBack}
      onNext={handleNext}
      canContinue={canContinue()}
      isLoading={loading}
      nextLabel={step === 2 ? 'Acceder al Comercio' : 'Continuar'}
    >
      {step === 1 && (
        <MerchantRoleStep 
          selectedRole={selectedRole} 
          setSelectedRole={setSelectedRole} 
        />
      )}

      {step === 2 && (
        <div className="w-full animation-fade-in max-w-md mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            {selectedRole === 'employee' ? 'Acceso de Empleados' : (isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta de Comercio')}
          </h2>
          <p className="mt-4 text-lg text-gray-500 mb-8">
            {selectedRole === 'employee' && !isLogin && 'Crea tu cuenta e ingresa el código proporcionado por tu gerente.'}
            {selectedRole === 'employee' && isLogin && 'Ingresa tus credenciales para acceder al sistema.'}
            {selectedRole === 'manager' && 'Accede al panel de control de tu comercio.'}
            <span className="block mt-2">
              O{' '}
              <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-gray-900 underline hover:text-gray-600">
                {isLogin ? 'crea una cuenta nueva' : 'inicia sesión en tu cuenta'}
              </button>
            </span>
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            {selectedRole === 'manager' && !isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-base transition-colors"
                    placeholder="Tu nombre completo"
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
                  className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-base transition-colors"
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
                  className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-base transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {selectedRole === 'employee' && !isLogin && (
              <div>
                <label className="block text-sm font-bold text-blue-600 mb-1 mt-8">Código de Invitación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-6 w-6 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="appearance-none block w-full pl-12 pr-3 py-5 border-2 border-blue-200 rounded-xl shadow-sm placeholder-blue-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-black tracking-[0.25em] uppercase bg-blue-50/50"
                    placeholder="ABC123"
                  />
                </div>
              </div>
            )}

            {/* Submit oculto gestionado por OnboardingLayout */}
            <button type="submit" className="hidden" />

            {selectedRole === 'manager' && (
              <>
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
              </>
            )}
          </form>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default MerchantAuthFlow;
