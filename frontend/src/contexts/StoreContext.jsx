import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  useEffect(() => {
    if (!user) {
      setStores([]);
      setActiveStore(null);
      setIsLoadingStores(false);
      return;
    }

    const fetchStores = async () => {
      try {
        setIsLoadingStores(true);
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setStores(data || []);
        
        if (data && data.length > 0) {
          const savedStoreId = localStorage.getItem('last_active_store_id');
          const found = data.find(s => s.id === savedStoreId);
          setActiveStore(found || data[0]);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, [user]);

  const changeActiveStore = (store) => {
    setActiveStore(store);
    localStorage.setItem('last_active_store_id', store.id);
  };

  const value = {
    stores,
    activeStore,
    isLoadingStores,
    changeActiveStore
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => useContext(StoreContext);
