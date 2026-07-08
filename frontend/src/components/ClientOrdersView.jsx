import React, { useState, useEffect } from 'react';
import { useClientOrders } from '../hooks/useClientOrders';
import { MapPin, Clock, QrCode, XCircle, Package } from 'lucide-react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { supabase } from '../supabaseClient';

// Componente para manejar el reloj regresivo de 10 min y expirar visualmente
function ReservedOrderCard({ order }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const createdAt = new Date(order.created_at).getTime();
      const now = new Date().getTime();
      // 10 minutos (600,000 ms)
      const diff = (createdAt + 600000) - now;
      
      if (diff <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
        setIsExpired(false);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const handlePay = async () => {
    if (isExpired) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const res = await axios.post(`${backendUrl}/api/payments/create-checkout-session`, {
        order_id: order.id
      }, { headers });
      
      if (res.data.sessionUrl) {
        window.location.href = res.data.sessionUrl;
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Error al procesar el pago');
    }
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-col ${isExpired ? 'opacity-60 border-red-200' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900">{order.store_name}</h3>
          <p className="text-gray-500 text-sm">{order.pack_title}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">Q{Number(order.total_price).toFixed(2)}</p>
          <div className={`text-sm font-mono mt-1 px-2 py-1 rounded-md inline-block ${isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
            {isExpired ? 'Expirado' : `${mins}:${secs}`}
          </div>
        </div>
      </div>
      <button 
        onClick={handlePay}
        disabled={isExpired}
        className={`mt-4 py-2 w-full rounded-lg font-medium transition-colors ${
          isExpired ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'
        }`}
      >
        Completar Pago
      </button>
    </div>
  );
}

// Order Activo / Pasado / Cancelado Component
function OrderCard({ order, onShowQR }) {
  const isCanceled = order.status === 'CANCELADO';
  const isPast = order.status === 'RECOGIDO';
  
  const opacityClass = (isCanceled || isPast) ? 'opacity-60 grayscale' : '';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex flex-col ${opacityClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900">{order.store_name}</h3>
          <p className="text-gray-500 text-sm">{order.pack_title}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">Q{Number(order.total_price).toFixed(2)}</p>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
            {order.status}
          </span>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-500 mt-2">
        <MapPin size={14} className="mr-1" />
        <span className="truncate">{order.store_address}</span>
      </div>
      <div className="flex items-center text-sm text-gray-500 mt-1 mb-4">
        <Clock size={14} className="mr-1" />
        <span>
          {new Date(order.pickup_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
          {new Date(order.pickup_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {!isCanceled && !isPast && order.status === 'PAGADO' && (
        <button 
          onClick={() => onShowQR(order)}
          className="mt-auto flex items-center justify-center gap-2 bg-gray-100 text-gray-800 hover:bg-gray-200 py-2 w-full rounded-lg font-medium transition-colors"
        >
          <QrCode size={18} />
          Ver código QR
        </button>
      )}
    </div>
  );
}

export default function ClientOrdersView() {
  const { orders, loading, error } = useClientOrders();
  const [activeTab, setActiveTab] = useState('RESERVED');
  const [selectedQR, setSelectedQR] = useState(null);
  
  const tabs = [
    { id: 'RESERVED', label: 'Reservados', status: 'PENDIENTE' },
    { id: 'PAID', label: 'Activos', status: 'PAGADO' },
    { id: 'DELIVERED', label: 'Pasados', status: 'RECOGIDO' },
    { id: 'CANCELLED', label: 'Cancelados', status: 'CANCELADO' }
  ];

  const currentStatus = tabs.find(t => t.id === activeTab)?.status;
  const filteredOrders = orders.filter(o => o.status === currentStatus);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">Cargando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-red-500 bg-red-50 px-4 py-3 rounded-lg border border-red-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar px-2 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-teal-600 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay pedidos en esta sección.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            currentStatus === 'PENDIENTE' 
              ? <ReservedOrderCard key={order.id} order={order} /> 
              : <OrderCard key={order.id} order={order} onShowQR={setSelectedQR} />
          ))
        )}
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative flex flex-col items-center">
            <button 
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedQR.store_name}</h3>
            <p className="text-gray-500 text-sm mb-6">Muestra este QR en caja</p>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <QRCode 
                value={selectedQR.validation_token || selectedQR.id} 
                size={200}
                level="M"
              />
            </div>
            <p className="text-xs font-mono text-gray-400 mt-4 break-all text-center">
              ID: {selectedQR.id.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
