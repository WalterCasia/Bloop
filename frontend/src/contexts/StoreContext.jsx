import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const fetchStores = React.useCallback(async () => {
    if (!user) {
      setStores([]);
      setActiveStore(null);
      setIsLoadingStores(false);
      return;
    }

    try {
      setIsLoadingStores(true);

      // Primero, verificamos si el usuario es un empleado
      const { data: profileData } = await supabase
        .from('profiles')
        .select('merchant_role, assigned_store_id')
        .eq('id', user.id)
        .single();

      let storesData = [];

      if (profileData?.merchant_role === 'EMPLOYEE' && profileData?.assigned_store_id) {
        // Si es empleado, cargar la sucursal asignada
        const { data: employeeStore, error: empError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', profileData.assigned_store_id)
          .single();
          
        if (!empError && employeeStore) {
          storesData = [employeeStore];
        }
      } else {
        // Si es dueño, cargar todas sus sucursales
        const { data: ownerStores, error: ownerError } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (ownerError) throw ownerError;
        storesData = ownerStores || [];
      }

      setStores(storesData);
      
      if (storesData.length > 0) {
        const savedStoreId = localStorage.getItem('last_active_store_id');
        const found = storesData.find(s => s.id === savedStoreId);
        setActiveStore(prev => prev ? (storesData.find(s => s.id === prev.id) || found || storesData[0]) : (found || storesData[0]));
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setIsLoadingStores(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const changeActiveStore = (store) => {
    setActiveStore(store);
    localStorage.setItem('last_active_store_id', store.id);
  };

  const value = {
    stores,
    activeStore,
    isLoadingStores,
    changeActiveStore,
    fetchStores
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => useContext(StoreContext);
