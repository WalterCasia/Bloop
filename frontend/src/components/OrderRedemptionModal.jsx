import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import apiClient from '../api/apiClient';
import { supabase } from '../lib/supabaseClient';

/**
 * Modal para canjear un pedido activo. Renderiza el QR con alto contraste
 * e implementa la validación de ventana horaria y animación antifraude.
 *
 * @param {Object} props
 * @param {Object} props.order - Objeto con los datos del pedido
 * @param {Function} props.onClose - Función para cerrar el modal
 */
const OrderRedemptionModal = ({ order, onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [isDelivered, setIsDelivered] = useState(false);

  // Reloj local
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSockets: Escuchar cambios en la tabla 'orders' en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          if (payload.new.status === 'DELIVERED') {
            setIsDelivered(true);
            // Cerrar el modal automáticamente después de 4 segundos
            setTimeout(() => {
              onClose();
              // Idealmente aquí el componente padre refetcheará los pedidos para actualizar las pestañas
              window.location.reload(); 
            }, 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, onClose]);

  const pickupStart = new Date(order.pickup_start_time);
  const pickupEnd = new Date(order.pickup_end_time);
  
  const isTooEarly = currentTime < pickupStart;
  const isTooLate = currentTime > pickupEnd;
  const isWithinWindow = !isTooEarly && !isTooLate;

  const handleClaimPreview = async () => {
    if (!isWithinWindow) return;
    
    setError(null);
    try {
      const response = await apiClient.post(`/api/orders/${order.id}/claim-preview`);
      if (response.data.status === 'success') {
        setIsAnimating(true);
        // Desactiva la animación visual antifraude tras 5 segundos
        setTimeout(() => setIsAnimating(false), 5000);
      }
    } catch (err) {
      setError('Error al generar la validación visual. Intente nuevamente.');
    }
  };

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isDelivered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-600 p-4 animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 flex flex-col items-center text-center transform scale-100 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">¡Entregado!</h2>
          <p className="text-gray-500 font-medium mb-6">Disfruta tu pack sorpresa. Has ayudado a salvar el planeta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-gray-100">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-1">{order.store_name}</h2>
          <p className="text-sm font-medium text-gray-500 mb-6">{order.pack_title}</p>

          {/* QR de Alto Contraste */}
          <div className={`p-4 rounded-xl shadow-inner border transition-all duration-500 mb-6 ${isAnimating ? 'bg-green-100 border-green-400 scale-105 shadow-green-500/50' : 'bg-white border-gray-200'}`}>
            <QRCode 
              value={order.validation_token || order.id} 
              size={220}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="H"
            />
          </div>
          
          <div className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 mb-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recogida</span>
            <span className="text-sm font-black text-gray-900">{formatTime(pickupStart)} - {formatTime(pickupEnd)}</span>
          </div>

          {/* Validaciones Horarias */}
          {!isWithinWindow && (
            <div className="w-full bg-orange-50 text-orange-700 p-3 rounded-xl text-xs font-bold mb-4 border border-orange-200">
              {isTooEarly 
                ? 'Aún no es la hora de recogida establecida por el comercio.' 
                : 'La ventana de recogida ha finalizado.'}
            </div>
          )}

          {error && <p className="text-red-600 text-xs mb-4 font-bold">{error}</p>}

          {/* Botón de Animación / Deslizar */}
          <button
            onClick={handleClaimPreview}
            disabled={!isWithinWindow || isAnimating}
            className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all duration-300 ${
              !isWithinWindow 
                ? 'bg-gray-300 cursor-not-allowed shadow-none text-gray-500' 
                : isAnimating
                  ? 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse bg-[length:200%_200%]'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isAnimating ? 'ANIMACIÓN ACTIVA...' : 'INICIAR VALIDACIÓN VISUAL'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderRedemptionModal;
