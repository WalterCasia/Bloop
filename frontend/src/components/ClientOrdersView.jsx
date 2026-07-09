import React, { useState, useEffect } from 'react';
import { useClientOrders } from '../hooks/useClientOrders';
import { MapPin, Clock, QrCode, XCircle, Package, Star } from 'lucide-react';
import QRCode from 'react-qr-code';
import apiClient from '../api/apiClient';

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
      const res = await apiClient.post('/api/payments/create-checkout-session', {
        order_id: order.id
      });
      
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
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-4 flex flex-col ${isExpired ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{order.store_name}</h3>
          <p className="text-gray-600 text-sm mt-1">{order.pack_title}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-black">Q{Number(order.total_price).toFixed(2)}</p>
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block border ${isExpired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
            {isExpired ? 'Expirado' : `${mins}:${secs}`}
          </div>
        </div>
      </div>
      <button 
        onClick={handlePay}
        disabled={isExpired}
        className={`w-full mt-4 border-2 py-3 rounded-xl font-semibold transition flex justify-center items-center gap-2 ${
          isExpired ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-black text-black bg-transparent hover:bg-gray-50'
        }`}
      >
        Completar Pago
      </button>
    </div>
  );
}

// Order Activo / Pasado / Cancelado Component
import { useReview } from '../contexts/ReviewContext';

function OrderCard({ order, onShowQR }) {
  const { openReviewModal } = useReview();
  const isCanceled = order.status === 'CANCELADO';
  const isPast = order.status === 'RECOGIDO';
  
  const opacityClass = (isCanceled || isPast) ? 'opacity-60 grayscale' : '';

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-4 flex flex-col ${opacityClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{order.store_name}</h3>
          <p className="text-gray-600 text-sm mt-1">{order.pack_title}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-black">Q{Number(order.total_price).toFixed(2)}</p>
          <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block border ${
            order.status === 'PAGADO' ? 'bg-green-50 text-green-700 border-green-200' : 
            order.status === 'RECOGIDO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-gray-50 text-gray-700 border-gray-200'
          }`}>
            {order.status}
          </span>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <MapPin size={16} className="mr-2 text-black" />
        <span className="truncate">{order.store_address}</span>
      </div>
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <Clock size={16} className="mr-2 text-black" />
        <span>
          {new Date(order.pickup_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
          {new Date(order.pickup_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {!isCanceled && !isPast && order.status === 'PAGADO' && (
        <button 
          onClick={() => onShowQR(order)}
          className="w-full mt-2 border-2 border-black text-black bg-transparent py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex justify-center items-center gap-2"
        >
          <QrCode size={18} />
          Ver código QR
        </button>
      )}

      {isPast && (
        <button 
          onClick={() => openReviewModal(order)}
          className="w-full mt-2 border-2 border-black text-black bg-transparent py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex justify-center items-center gap-2"
        >
          <Star size={18} />
          Calificar pedido
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
        <div className="flex overflow-x-auto hide-scrollbar px-4 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'text-black font-bold border-b-2 border-black pb-2' 
                  : 'text-gray-500 hover:text-black font-medium border-b-2 border-transparent pb-2'
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
