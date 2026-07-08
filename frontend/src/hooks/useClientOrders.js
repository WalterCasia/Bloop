import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

export function useClientOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {};
      if (session?.access_token) {
         headers.Authorization = `Bearer ${session.access_token}`;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/customer/orders`, {
        headers
      });

      if (response.data?.status === 'success') {
        setOrders(response.data.orders || []);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
