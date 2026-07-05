import axios from 'axios';
import { supabase } from '../lib/supabaseClient.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente el token JWT en cada solicitud
apiClient.interceptors.request.use(
  async (config) => {
    // Obtenemos la sesión actual directamente de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores globales (ej. 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o no autorizada.', error.response.config.url);
      // supabase.auth.signOut(); // Desactivado temporalmente para depuración
    }
    return Promise.reject(error);
  }
);

export default apiClient;
