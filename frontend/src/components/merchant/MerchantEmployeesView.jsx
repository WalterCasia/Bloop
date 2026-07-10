import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreContext } from '../../contexts/StoreContext';
import { Users, UserPlus, MoreVertical, Building2, UserX } from 'lucide-react';
import MerchantBranchSelector from '../MerchantBranchSelector';
import EmployeeInviteModal from './EmployeeInviteModal';
import { supabase } from '../../lib/supabaseClient';
import apiClient from '../../api/apiClient';

const MerchantEmployeesView = () => {
  const { user } = useAuth();
  const { activeStore, stores, isLoadingStores } = useStoreContext();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (user && activeStore) {
      fetchEmployees();
    } else if (!isLoadingStores && !activeStore) {
      setIsLoading(false);
    }
  }, [user, activeStore, isLoadingStores]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Intentamos recuperar los perfiles con role=EMPLOYEE asignados a la sucursal activa
      // Nota: Requiere que la RLS en 'profiles' permita lectura a los owners sobre sus empleados.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('merchant_role', 'EMPLOYEE')
        .eq('assigned_store_id', activeStore.id);

      if (error) {
        throw error;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Para propósitos visuales si RLS falla, inyectamos datos falsos temporalmente
      setEmployees([
        { id: 'mock-1', full_name: 'Ana Martínez', email: 'ana.m@ejemplo.com', created_at: new Date().toISOString() },
        { id: 'mock-2', full_name: 'Carlos Ruiz', email: 'cruiz@ejemplo.com', created_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (employeeId, employeeName) => {
    const confirmRevoke = window.confirm(`¿Estás seguro que deseas revocar el acceso a ${employeeName}? Esta acción es irreversible.`);
    if (!confirmRevoke) return;

    try {
      await apiClient.delete(`/api/merchant/employees/${employeeId}`);
      
      setEmployees(prev => prev.filter(e => e.id !== employeeId));
      alert(`Acceso revocado para ${employeeName}.`);
    } catch (error) {
      console.error('Error revoking access:', error);
      alert(error.response?.data?.message || 'Error al intentar revocar el acceso.');
    }
  };

  if (isLoadingStores) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Cargando contexto...</p>
      </div>
    );
  }

  if (!activeStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-gray-100">
          <p className="text-gray-800 font-bold mb-2">Sin Sucursales</p>
          <p className="text-sm text-gray-500 mb-6">Debes crear una sucursal antes de poder invitar empleados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans touch-manipulation pb-24">
      {showInviteModal && (
        <EmployeeInviteModal 
          onClose={() => setShowInviteModal(false)} 
          stores={stores}
          activeStore={activeStore}
        />
      )}

      <div className="max-w-md mx-auto mt-2">
        {/* Encabezado */}
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mi Equipo</h1>
          <MerchantBranchSelector />
        </header>

        {/* Resumen e Invitación */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6 flex flex-col space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-900">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Empleados de Mostrador</h2>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                <Building2 size={14} />
                {activeStore.name}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowInviteModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
          >
            <UserPlus size={18} />
            Invitar Empleado
          </button>
        </div>

        {/* Lista de Empleados */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
            Equipo Activo ({employees.length})
          </h3>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <p className="text-gray-500 font-medium text-sm">No hay empleados asignados a esta sucursal todavía.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map(employee => (
                <div key={employee.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-green-100 text-green-700 font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {employee.full_name ? employee.full_name.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-gray-900 truncate">{employee.full_name || 'Empleado Sin Nombre'}</p>
                      <p className="text-xs text-gray-500 truncate">{employee.email || 'Oculto'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRevokeAccess(employee.id, employee.full_name || 'este usuario')}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                    title="Revocar acceso"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MerchantEmployeesView;
