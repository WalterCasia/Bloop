import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

export function useClientOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/customer/orders');

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
