import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Importación de Componentes Principales
import MapExplorer from './components/MapExplorer';
import PackDetail from './components/PackDetail';
import MerchantDashboard from './components/MerchantDashboard';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

// Placeholder de vistas auxiliares para mantener el enrutador funcional
const Unauthorized = () => <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}><h1>Acceso Denegado (403)</h1><p>Tu rol no permite acceder a esta área.</p></div>;

/**
 * Componente de Protección de Rutas (Higher Order Component)
 * Valida la autenticación y autoriza el acceso basado en el rol del metadata de Supabase.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
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

  // 2. Verificación Estricta de Autorización (RBAC)
  // Se asume que el rol se inyecta en Supabase al registrar: user_metadata.role
  const userRole = user.user_metadata?.role || 'CLIENTE';

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const App = () => {
  return (
    // Envolvemos toda la app en el Contexto de Autenticación
    <AuthProvider>
      <Router>
        <Routes>
          {/* =======================
              Flujos Públicos
             ======================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* =======================
              Flujos Privados (Cliente)
             ======================= */}
          <Route 
            path="/explore" 
            element={
              <ProtectedRoute requiredRole="CLIENTE">
                <MapExplorer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/packs/:id" 
            element={
              <ProtectedRoute requiredRole="CLIENTE">
                <PackDetail 
                  // Prop de prueba para mantener la vista funcional aisladamente
                  pack={{ 
                    pack_id: 'sample-uuid-1234', 
                    store_name: 'Panadería Central',
                    title: 'Pack Dulce',
                    discounted_price: 3.50,
                    original_price: 10.00,
                    pickup_start_time: new Date().toISOString(),
                    pickup_end_time: new Date(Date.now() + 3600000).toISOString()
                  }} 
                  onBack={() => window.history.back()}
                />
              </ProtectedRoute>
            } 
          />

          {/* =======================
              Flujos Privados (Comercio)
             ======================= */}
          <Route 
            path="/merchant/dashboard" 
            element={
              <ProtectedRoute requiredRole="COMERCIO">
                <MerchantDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Ruta Catch-all (Redirección 404 por defecto a Inicio) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
