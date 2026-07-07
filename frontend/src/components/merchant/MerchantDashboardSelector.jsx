import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MerchantMainDashboard from '../MerchantMainDashboard';
import EmployeeDashboardHome from './EmployeeDashboardHome';

const MerchantDashboardSelector = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const role = user.user_metadata?.role;
  
  if (role === 'STAFF') {
    return <EmployeeDashboardHome />;
  }
  
  // Por defecto (OWNER) renderizamos el panel completo
  return <MerchantMainDashboard />;
};

export default MerchantDashboardSelector;
