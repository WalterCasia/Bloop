import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const role = user.user_metadata?.role;
      if (allowedRoles && !allowedRoles.includes(role)) {
        setShowWarning(true);
        const timer = setTimeout(() => {
          setShouldRedirect(true);
        }, 1500); // 1.5s warning before redirect
        return () => clearTimeout(timer);
      }
    }
  }, [loading, user, allowedRoles]);

  if (loading) return null;

  if (shouldRedirect) {
    return <Navigate to="/merchant/dashboard" replace />;
  }

  if (showWarning) {
    return (
      <div className="flex flex-col h-screen w-full bg-white fixed inset-0 items-center justify-center font-sans z-[100]">
        <div className="bg-red-50 border border-red-200 text-red-600 p-8 rounded-2xl shadow-2xl max-w-md text-center animate-fade-in">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-black mb-2">Acceso Denegado</h2>
          <p className="font-medium text-red-500">
            Tu rol no tiene permisos para ver esta sección. Redirigiendo a tu espacio operativo...
          </p>
        </div>
      </div>
    );
  }

  // Si tiene permisos, renderizamos los hijos normalmente
  return children;
};

export default RoleProtectedRoute;
