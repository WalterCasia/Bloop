import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { CheckCircle2, Store, Clock, Package, Receipt } from 'lucide-react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

export default function OrderConfirmationView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch individual order info from the backend or list
    // Asumiendo que podemos buscarlo en el endpoint de cliente
    const fetchOrder = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const res = await axios.get(`${backendUrl}/api/customer/orders`, { headers });
        
        if (res.data?.status === 'success') {
          const found = res.data.orders.find(o => o.id === orderId);
          if (found) {
            setOrderData(found);
          }
        }
      } catch (e) {
        console.error('Error fetching order', e);
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">Cargando confirmación...</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Receipt size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Pedido no encontrado</h2>
        <p className="text-gray-500 mb-6">No pudimos encontrar la información de este pedido.</p>
        <button 
          onClick={() => navigate('/customer/orders')}
          className="bg-teal-600 text-white font-medium py-3 px-8 rounded-xl w-full"
        >
          Ir a Mis Pedidos
        </button>
      </div>
    );
  }

  // Formatting date and time
  const pickupStart = new Date(orderData.pickup_start_time);
  const pickupEnd = new Date(orderData.pickup_end_time);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      
      {/* Icono de Éxito */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">¡Pago Exitoso!</h1>
        <p className="text-gray-500 mt-1">Tu Pack Sorpresa está asegurado</p>
      </div>

      {/* Ticket / Tarjeta */}
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-dashed border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
              <Store size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Comercio</p>
              <h3 className="font-bold text-gray-900">{orderData.store_name}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-teal-100 p-2 rounded-full text-teal-600">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Paquete</p>
              <h3 className="font-medium text-gray-800">{orderData.pack_title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Recogida</p>
              <h3 className="font-medium text-gray-800">
                {formatDate(pickupStart)} de {formatTime(pickupStart)} a {formatTime(pickupEnd)}
              </h3>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 bg-gray-50 flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-4 text-center">Muestra este código en la tienda para recoger tu pedido</p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <QRCode 
              value={orderData.validation_token || orderData.id} 
              size={180}
              level="M"
            />
          </div>
          <p className="text-xs font-mono text-gray-400 mt-4 break-all text-center">
            ID: {orderData.id.split('-')[0].toUpperCase()}
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm mt-auto pb-6">
        <button 
          onClick={() => navigate('/customer/orders')}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors"
        >
          Ir a Mis Pedidos
        </button>
      </div>

    </div>
  );
}
