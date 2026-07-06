import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReservationProvider } from './contexts/ReservationContext';
import { StoreProvider } from './contexts/StoreContext';

// Importación de Componentes Principales
import ClientExploreDashboard from './components/ClientExploreDashboard';
import CustomerOrders from './components/orders/CustomerOrders';
import ClientProfileView from './components/ClientProfileView';
import PackDetail from './components/PackDetail';
import MerchantMainDashboard from './components/MerchantMainDashboard';
import DailyStockDashboard from './components/DailyStockDashboard';
import MerchantProfile from './components/merchant/MerchantProfile';
import MerchantStats from './components/merchant/MerchantStats';
import MerchantEmployeesView from './components/merchant/MerchantEmployeesView';
import MerchantNewBranchView from './components/merchant/MerchantNewBranchView';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import EmployeeJoinView from './components/EmployeeJoinView';
import NavigationLayout from './components/NavigationLayout';
import RoleSelectionOnboarding from './components/RoleSelectionOnboarding';
import ClientOnboardingWizard from './components/ClientOnboardingWizard';
import ClientPreferencesView from './components/ClientPreferencesView';
import MerchantOnboardingWizard from './components/MerchantOnboardingWizard';
import SurprisePackTemplateEditor from './components/SurprisePackTemplateEditor';
import MerchantDashboardLayout from './components/merchant/MerchantDashboardLayout';
import UnderConstructionView from './components/merchant/UnderConstructionView';

// Placeholder de vistas auxiliares para mantener el enrutador funcional
const Unauthorized = () => <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}><h1>Acceso Denegado (403)</h1><p>Tu rol no permite acceder a esta área.</p></div>;

/**
 * Componente de Protección de Rutas (Higher Order Component)
 * Valida la autenticación y autoriza el acceso basado en el rol del metadata de Supabase.
 */
const ProtectedRoute = ({ children, requiredRole, requireOnboarding = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <strong>Verificando permisos de sesión...</strong>
      </div>
    );
  }

  // 1. Verificación de Autenticación
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Interceptar a usuarios registrados sin rol (ej. nuevos vía Google OAuth)
  const userRole = user.user_metadata?.role;
  
  if (!userRole) {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Verificación Estricta de Autorización (RBAC)
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Verificación de Onboarding Obligatorio
  if (requireOnboarding) {
    const isCompleted = user.user_metadata?.onboarding_completed === true;
    if (!isCompleted) {
      if (userRole === 'COMERCIO') return <Navigate to="/onboarding/merchant" replace />;
      if (userRole === 'CLIENTE') return <Navigate to="/onboarding/client" replace />;
    }
  }

  return children;
};

const App = () => {
  return (
    // Envolvemos toda la app en el Contexto de Autenticación y Reservas
    <AuthProvider>
      <StoreProvider>
        <ReservationProvider>
          <Router>
            <Routes>
          {/* =======================
              Flujos Públicos
             ======================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/join" element={<EmployeeJoinView />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route 
            path="/onboarding" 
            element={
              <RoleSelectionOnboarding />
            } 
          />

          {/* =======================
              Flujos Privados (App Shell)
             ======================= */}
          <Route element={<NavigationLayout />}>
            {/* Rutas Cliente */}
            <Route 
              path="/onboarding/client" 
              element={
                <ProtectedRoute requiredRole="CLIENTE">
                  <ClientOnboardingWizard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/explore" 
              element={
                <ProtectedRoute requiredRole="CLIENTE" requireOnboarding={true}>
                  <ClientExploreDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/customer/orders" 
              element={
                <ProtectedRoute requiredRole="CLIENTE" requireOnboarding={true}>
                  <CustomerOrders />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requiredRole="CLIENTE" requireOnboarding={true}>
                  <ClientProfileView />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/client/preferences" 
              element={
                <ProtectedRoute requiredRole="CLIENTE" requireOnboarding={true}>
                  <ClientPreferencesView />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/packs/:id" 
              element={
                <ProtectedRoute requiredRole="CLIENTE" requireOnboarding={true}>
                  <PackDetail />
                </ProtectedRoute>
              } 
            />

            {/* Rutas Comercio */}
            <Route 
              path="/onboarding/merchant" 
              element={
                <ProtectedRoute requiredRole="COMERCIO">
                  <MerchantOnboardingWizard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/merchant/branch/new" 
              element={
                <ProtectedRoute requiredRole="COMERCIO" requireOnboarding={true}>
                  <MerchantNewBranchView />
                </ProtectedRoute>
              } 
            />

            {/* =======================
                Layout Exclusivo COMERCIO (Uber Eats Style)
               ======================= */}
            <Route element={<ProtectedRoute requiredRole="COMERCIO" requireOnboarding={true}><MerchantDashboardLayout /></ProtectedRoute>}>
              <Route path="/merchant/dashboard" element={<MerchantMainDashboard />} />
              <Route path="/merchant/daily-stock" element={<DailyStockDashboard />} />
              <Route path="/merchant/create-pack" element={<SurprisePackTemplateEditor />} />
              <Route path="/merchant/profile" element={<MerchantProfile />} />
              <Route path="/merchant/employees" element={<MerchantEmployeesView />} />
              <Route path="/merchant/stats" element={<MerchantStats />} />
              
              {/* Rutas en Construcción (Fases Posteriores) */}
              <Route path="/merchant/orders" element={<UnderConstructionView title="Gestión de Pedidos" />} />
              <Route path="/merchant/performance" element={<UnderConstructionView title="Rendimiento e Impacto" />} />
              <Route path="/merchant/reviews" element={<UnderConstructionView title="Reseñas de Clientes" />} />
              <Route path="/merchant/reports" element={<UnderConstructionView title="Reportes Analíticos" />} />
              <Route path="/merchant/payments" element={<UnderConstructionView title="Historial de Pagos" />} />
              <Route path="/merchant/settings" element={<UnderConstructionView title="Configuración de Sucursal" />} />
            </Route>
          </Route>

          {/* Ruta Catch-all (Redirección 404 por defecto a Inicio) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ReservationProvider>
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
