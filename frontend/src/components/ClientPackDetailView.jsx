import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Clock, Star } from 'lucide-react';
import apiClient from '../api/apiClient';

const ClientPackDetailView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pack = location.state?.pack;

  // Estados de lógica de reserva (portados de PackDetail)
  const [status, setStatus] = useState('idle'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    let timer;
    if (status === 'reserved' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && status === 'reserved') {
      setStatus('expired');
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, timeLeft]);

  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pack no encontrado</h2>
        <button onClick={() => navigate(-1)} className="bg-black text-white px-6 py-2 rounded-full font-medium">Volver</button>
      </div>
    );
  }

  const handleReserve = async () => {
    if (pack.available_quantity === 0) return;
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await apiClient.post(`/api/packs/${pack.pack_id}/reserve`);
      if (response.data.status === 'success') {
        setStatus('reserved');
        setTimeLeft(response.data.reservation_expires_in || 600); 
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Error de red al intentar reservar el pack.');
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    setErrorMessage('');
    
    try {
      const response = await apiClient.post('/api/payments/create-checkout-session', {
        pack_id: pack.pack_id,
        quantity: 1
      });
      
      if (response.data.status === 'success' && response.data.sessionUrl) {
        window.location.href = response.data.sessionUrl;
      } else {
        throw new Error('No se pudo obtener la URL de pago.');
      }
    } catch (error) {
      setIsProcessingPayment(false);
      setErrorMessage(error.response?.data?.message || 'Error de conexión con la pasarela de pagos.');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
  };

  const rawImageUrl = pack.image_url || pack.cover_url || '';
  const imageUrl = rawImageUrl.includes(',') ? rawImageUrl.split(',')[0] : (rawImageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80');

  const pickupStart = new Date(pack.pickup_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const pickupEnd = new Date(pack.pickup_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Expiración estricta
  if (status === 'expired') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Tiempo Expirado</h2>
        <p className="mb-8 text-gray-300 max-w-md">
          La reserva temporal de 10 minutos ha finalizado. El inventario ha sido liberado nuevamente a la plataforma.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold shadow-lg"
        >
          Volver al Mapa
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-24 relative w-full">
      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">
        
        {/* Columna Izquierda: Imagen (Fija en desktop) */}
        <div className="h-64 lg:h-screen lg:sticky lg:top-0 relative w-full bg-gray-100">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/* Overlay superior oscuro sutil para legibilidad */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/50 to-transparent"></div>
          
          {/* Navegación Flotante */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Heart className="w-5 h-5" />
          </button>

          {/* Logotipo Solapado */}
          <div className="w-20 h-20 bg-white rounded-full absolute -bottom-10 lg:bottom-10 left-6 border-4 border-white shadow-md overflow-hidden flex items-center justify-center z-10">
            <img src={imageUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Columna Derecha: Contenido */}
        <div className="flex flex-col pb-32 lg:pb-0">
          {/* 2. Sección de Identidad y Ventana de Recogida */}
      <div className="px-6 pt-14 pb-6">
        <h3 className="text-gray-700 font-medium text-lg">{pack.store_name}</h3>
        <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-3">{pack.title}</h1>
        
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-medium text-sm">
            A {pack.distance_km ? Number(pack.distance_km).toFixed(1) : '2.5'} km
          </span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Quedan {pack.available_quantity} packs
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mt-6 flex items-center gap-4 border border-gray-100">
          <Clock className="w-6 h-6 text-gray-600" />
          <div>
            <p className="text-gray-900 font-bold">Recógelo hoy</p>
            <p className="text-gray-500 font-medium text-sm">{pickupStart} - {pickupEnd}</p>
          </div>
        </div>
      </div>

      {/* 3. Contenido, Reseñas y Ubicación */}
      <div className="px-6">
        <hr className="border-t border-gray-100 my-6" />
        
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Acerca de este pack</h3>
          <p className="text-gray-600 leading-relaxed font-medium mb-4">
            Al comprar este pack sorpresa estarás rescatando deliciosos excedentes del día. El contenido es una sorpresa y dependerá de lo que el comercio no haya vendido. ¡Una forma deliciosa de ayudar al planeta!
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 font-medium">
            <strong>Advertencia de alérgenos:</strong> Los packs sorpresa pueden contener una amplia variedad de ingredientes. Si tienes alergias severas, te recomendamos consultar directamente en el local antes de consumir.
          </div>
        </div>

        <hr className="border-t border-gray-100 my-6" />

        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-gray-900">Reseñas</h3>
            <div className="flex items-center text-yellow-500 ml-2">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-gray-900 font-bold text-lg ml-1">4.6</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">Gran valor</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">Delicioso</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">Rápido</span>
          </div>
        </div>

        <hr className="border-t border-gray-100 my-6" />

        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h3>
          <a 
            href={`https://maps.google.com/?q=${pack.location_lat || ''},${pack.location_lng || ''}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full h-40 bg-gray-200 rounded-xl mb-3 overflow-hidden border border-gray-100 relative hover:opacity-90 transition-opacity cursor-pointer group"
          >
            {/* Mapa Estático Simulado */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 group-hover:bg-gray-200 transition-colors">
               <span className="text-gray-600 font-bold mb-1">Abrir en Google Maps</span>
               <span className="text-gray-400 font-medium text-sm">Ver ruta hacia la sucursal</span>
            </div>
          </a>
          <p className="text-gray-600 font-medium">{pack.address || 'Dirección de la sucursal'}</p>
        </div>
      </div>
      </div>

      {/* 4. Barra Inferior de Acción (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 lg:bottom-6 lg:right-6 lg:left-auto lg:rounded-2xl lg:w-96 left-0 w-full bg-white border-t lg:border border-gray-200 p-4 z-50 flex justify-between items-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] lg:shadow-xl">
        
        {/* Precios */}
        <div className="flex flex-col">
          <span className="text-gray-400 line-through text-sm font-medium">{formatCurrency(pack.original_price)}</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(pack.discounted_price)}</span>
        </div>

        {/* Botones de Lógica de Estado */}
        {status === 'error' && (
          <div className="absolute -top-12 left-0 w-full bg-red-100 text-red-600 text-sm font-bold p-2 text-center shadow-md">
            {errorMessage}
          </div>
        )}

        {status === 'idle' || status === 'error' ? (
          <button 
            onClick={handleReserve}
            disabled={pack.available_quantity === 0}
            className={`w-48 py-4 rounded-full font-bold text-white transition-all shadow-lg ${pack.available_quantity === 0 ? 'bg-black opacity-50 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:-translate-y-0.5'}`}
          >
            {pack.available_quantity === 0 ? 'Agotado' : 'Reservar'}
          </button>
        ) : status === 'loading' ? (
           <button disabled className="w-48 py-4 rounded-full font-bold text-white bg-gray-400 cursor-wait">
            Reservando...
          </button>
        ) : status === 'reserved' ? (
          <div className="flex items-center gap-3">
             <div className="text-lg font-bold text-orange-600 bg-orange-100 px-3 py-2 rounded-lg">
                {formatTime(timeLeft)}
             </div>
             <button 
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className={`w-40 py-4 rounded-full font-bold text-white transition-all shadow-lg ${isProcessingPayment ? 'bg-gray-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'}`}
             >
               {isProcessingPayment ? 'Pagando...' : 'Pagar'}
             </button>
          </div>
        ) : null}

      </div>
      </div>

    </div>
  );
};

export default ClientPackDetailView;
