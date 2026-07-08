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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100 flex flex-col items-center py-10 px-4">
      
      {/* Header / Icono de Éxito */}
      <div className="flex flex-col items-center mb-8 transform transition-all duration-500 hover:scale-105">
        <div className="w-24 h-24 bg-white shadow-xl shadow-green-200/50 rounded-full flex items-center justify-center mb-5 border-4 border-green-50">
          <CheckCircle2 size={48} className="text-green-500 drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">¡Pago Exitoso!</h1>
        <p className="text-teal-700 font-medium mt-2">Tu Pack Sorpresa está asegurado</p>
      </div>

      {/* Ticket / Tarjeta con Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-sm rounded-3xl shadow-2xl border border-white/60 overflow-hidden mb-8 transition-all hover:shadow-teal-200/50">
        
        {/* Info del Pedido */}
        <div className="p-7 border-b-2 border-dashed border-teal-100 relative">
          {/* Recortes del Ticket laterales */}
          <div className="absolute -left-3 -bottom-3 w-6 h-6 bg-teal-50 rounded-full"></div>
          <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-teal-50 rounded-full"></div>

          <div className="flex items-center gap-4 mb-5 group">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-2xl text-orange-600 shadow-inner group-hover:scale-110 transition-transform">
              <Store size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Comercio</p>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{orderData.store_name}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-5 group">
            <div className="bg-gradient-to-br from-teal-100 to-emerald-200 p-3 rounded-2xl text-teal-700 shadow-inner group-hover:scale-110 transition-transform">
              <Package size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Paquete</p>
              <h3 className="font-semibold text-gray-800 text-base leading-tight">{orderData.pack_title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 group">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-3 rounded-2xl text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Ventana de Recogida</p>
              <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                {formatDate(pickupStart)} <br/> {formatTime(pickupStart)} - {formatTime(pickupEnd)}
              </h3>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-8 bg-gradient-to-b from-white/50 to-gray-50 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600 mb-5 text-center px-4">Muestra este código en la tienda para recoger tu pedido</p>
          <div className="bg-white p-5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.05)] border border-gray-100 transform transition-transform hover:scale-105">
            <QRCode 
              value={orderData.validation_token || orderData.id} 
              size={180}
              level="M"
            />
          </div>
          <div className="bg-gray-100 px-4 py-2 rounded-full mt-6">
            <p className="text-xs font-mono text-gray-500 tracking-wider font-semibold">
              ID: {orderData.id.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="w-full max-w-sm mt-auto pb-6 flex flex-col gap-3">
        <button 
          onClick={() => navigate('/customer/orders')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/30 transition-all active:scale-95"
        >
          Ir a Mis Pedidos
          <ChevronRight size={18} />
        </button>
        
        <button 
          onClick={() => navigate('/customer/explore')}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-teal-700 font-bold py-4 rounded-2xl shadow-sm border border-teal-100 transition-all active:scale-95"
        >
          <Compass size={18} />
          Explorar Más Packs
        </button>
      </div>

    </div>
  );
}
