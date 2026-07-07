import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, KeyRound } from 'lucide-react';
import apiClient from '../../api/apiClient';
import OnboardingLayout from './OnboardingLayout';
import MerchantRoleStep from './steps/MerchantRoleStep';

const MerchantAuthFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(''); // 'manager' | 'employee'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && step === 1) {
      const role = user.user_metadata?.role;
      if (role === 'CLIENTE') {
        supabase.auth.signOut().then(() => {
          setError('Esta cuenta pertenece a un cliente. Por favor ingresa a través del Portal para Clientes.');
          setStep(2); // Forzamos ir al form para ver el error
          setSelectedRole('employee');
        });
      } else if (role === 'COMERCIO') {
        const onboardingCompleted = user.user_metadata?.onboarding_completed;
        if (!onboardingCompleted) {
          navigate('/onboarding/merchant', { replace: true });
        } else {
          navigate('/merchant/dashboard', { replace: true });
        }
      }
    }
  }, [user, navigate, step]);

  const handleNext = () => {
    if (step === 1) {
      if (selectedRole === 'manager') {
        // Redirige al registro clásico por ahora, para mantener el scope.
        // En un futuro se podría migrar también.
        navigate('/signup');
      } else if (selectedRole === 'employee') {
        setStep(2);
      }
    } else if (step === 2) {
      handleEmployeeLogin();
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
      if (!inviteCode || inviteCode.length !== 6) {
        throw new Error('El código de invitación debe tener 6 caracteres.');
      }

      let authUser;
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: 'COMERCIO',
                onboarding_completed: true
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
        
        if (authUser?.user_metadata?.role === 'CLIENTE') {
          await supabase.auth.signOut();
          throw new Error('Esta cuenta pertenece a un cliente. Por favor ingresa a través del Portal para Clientes.');
        }
      }

      try {
        const { session } = await supabase.auth.getSession();
        await apiClient.post('/api/merchant/invitations/accept', 
          { code: inviteCode.toUpperCase() },
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
      } catch (invError) {
        throw new Error(invError.response?.data?.message || 'Código de invitación inválido o expirado.');
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
    if (step === 2) return email && password && inviteCode.length === 6;
    return false;
  };

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={selectedRole === 'employee' ? 2 : 1}
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
            Acceso de Empleados
          </h2>
          <p className="mt-4 text-lg text-gray-500 mb-8">
            Ingresa tus credenciales y el código de 6 dígitos proporcionado por tu gerente.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
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

            {/* Submit oculto gestionado por OnboardingLayout */}
            <button type="submit" className="hidden" />
          </form>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default MerchantAuthFlow;
