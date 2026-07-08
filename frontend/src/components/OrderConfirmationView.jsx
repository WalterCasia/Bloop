import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { CheckCircle2, Store, Clock, Package, Receipt, Compass, ChevronRight } from 'lucide-react';
import apiClient from '../api/apiClient';

export default function OrderConfirmationView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndFetchOrder = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        // Si hay sessionId, intentamos forzar la verificación activa (respaldo al webhook)
        if (sessionId) {
          try {
            await apiClient.post('/api/payments/verify-session', { session_id: sessionId });
          } catch (e) {
            console.error('La verificación activa falló o ya estaba procesada', e);
          }
        }

        // Recuperar la orden
        const res = await apiClient.get('/api/customer/orders');
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
    
    if (orderId) verifyAndFetchOrder();
  }, [orderId, searchParams]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">Cargando confirmación...</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="w-20 h-20 bg-white shadow-lg text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Receipt size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido no encontrado</h2>
        <p className="text-gray-500 mb-8 max-w-xs">No pudimos localizar la información de este pedido. Tal vez expiró o hubo un problema de conexión.</p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button 
            onClick={() => navigate('/customer/orders')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-95"
          >
            Ir a Mis Pedidos
          </button>
          <button 
            onClick={() => navigate('/customer/explore')}
            className="bg-white hover:bg-gray-50 text-teal-700 font-medium py-3.5 px-8 rounded-xl shadow-sm border border-teal-100 transition-all active:scale-95"
          >
            Volver al Explorador
          </button>
        </div>
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
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
      
      {/* Header / Icono de Éxito */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-green-700 stroke-[3]" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">¡Pago Exitoso!</h1>
        <p className="text-gray-500 mt-2">Tu Pack Sorpresa está asegurado</p>
      </div>

      {/* Ticket / Tarjeta (Airbnb Style) */}
      <div className="bg-gray-50 rounded-2xl p-5 text-left my-8 space-y-4">
        
        {/* Info del Pedido */}
        <div className="flex items-center gap-3">
          <Store size={24} className="text-gray-700" />
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Comercio</p>
            <h3 className="font-bold text-gray-900">{orderData.store_name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Package size={24} className="text-gray-700" />
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Paquete</p>
            <h3 className="font-semibold text-gray-800">{orderData.pack_title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock size={24} className="text-gray-700" />
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Recogida</p>
            <h3 className="font-semibold text-gray-800">
              {formatDate(pickupStart)} de {formatTime(pickupStart)} a {formatTime(pickupEnd)}
            </h3>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mb-8">
        <div className="border border-gray-200 rounded-2xl p-4 inline-block shadow-sm">
          <QRCode 
            value={orderData.validation_token || orderData.id} 
            size={180}
            level="M"
          />
        </div>
        <p className="text-sm font-medium text-gray-600 mt-4 px-4">Muestra este código en la tienda</p>
        <p className="text-xs font-mono text-gray-400 mt-2">
          ID: {orderData.id.split('-')[0].toUpperCase()}
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="w-full flex flex-col items-center">
        <button 
          onClick={() => navigate('/customer/orders')}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-gray-900 transition"
        >
          Ir a Mis Pedidos
        </button>
        
        <button 
          onClick={() => navigate('/customer/explore')}
          className="text-black underline font-medium mt-4 block hover:text-gray-600"
        >
          Explorar Más Packs
        </button>
      </div>
    </div>
    </div>
  );
}
