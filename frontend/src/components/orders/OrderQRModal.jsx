import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'react-qr-code';

const OrderQRModal = ({ order, onClose, onOrderExpired }) => {
  const [timeStatus, setTimeStatus] = useState({ state: 'PENDING', message: '' });
  const prevStateRef = useRef('PENDING');

  // Cerrar al tocar fuera (asegura que toque explícitamente el overlay)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const manualCode = useMemo(() => {
    if (!order?.validation_token) return '----';
    // Generar un código visual de 4 dígitos usando los últimos 4 caracteres del token
    return order.validation_token.slice(-4).toUpperCase();
  }, [order?.validation_token]);

  useEffect(() => {
    if (!order) return;

    const checkTime = () => {
      const now = new Date();
      const start = new Date(order.pickup_start_time);
      const end = new Date(order.pickup_end_time);

      if (now < start) {
        // Cuánto falta
        const diff = start.getTime() - now.getTime();
        const minutes = Math.floor(diff / 60000);
        setTimeStatus({
          state: 'UPCOMING',
          message: `Inicia en ${minutes} min`
        });
      } else if (now >= start && now <= end) {
        // Cuánto queda
        const diff = end.getTime() - now.getTime();
        const minutes = Math.floor(diff / 60000);
        setTimeStatus({
          state: 'ACTIVE',
          message: `Activo. Termina en ${minutes} min`
        });
      } else {
        setTimeStatus({
          state: 'EXPIRED',
          message: 'Ventana de recogida finalizada'
        });
        
        // Sincronización silenciosa con el backend si acaba de expirar estando el modal abierto
        if (prevStateRef.current !== 'EXPIRED' && onOrderExpired) {
          onOrderExpired();
        }
        prevStateRef.current = 'EXPIRED';
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [order]);

  if (!order) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-gray-900 p-5 text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black mb-1">{order.store_name}</h3>
            <p className="text-xs text-gray-400">{order.store_address}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center">
          
          {/* Indicador de Tiempo */}
          <div className={`mb-6 px-4 py-2 rounded-full border text-sm font-bold flex items-center gap-2 ${
            timeStatus.state === 'ACTIVE' ? 'bg-green-50 border-green-200 text-green-700' : 
            timeStatus.state === 'UPCOMING' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            <span className="relative flex h-3 w-3">
              {timeStatus.state === 'ACTIVE' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                timeStatus.state === 'ACTIVE' ? 'bg-green-500' : 
                timeStatus.state === 'UPCOMING' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
            </span>
            {timeStatus.message}
          </div>

          {/* Código QR */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 w-full flex justify-center items-center">
            {timeStatus.state === 'EXPIRED' ? (
              <div className="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center rounded-lg text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-sm">QR Expirado</span>
              </div>
            ) : (
              <QRCode
                value={order.validation_token}
                size={200}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
              />
            )}
          </div>

          {/* Código Manual */}
          <div className="text-center w-full">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Código Manual
            </span>
            <div className="text-4xl font-black text-gray-900 tracking-[0.25em]">
              {manualCode}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderQRModal;
