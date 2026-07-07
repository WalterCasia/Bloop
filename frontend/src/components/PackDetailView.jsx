import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useReservation } from '../contexts/ReservationContext';

/**
 * Vista de Detalle del Pack y Flujo Transaccional de Reserva
 * 
 * @param {Object} props
 * @param {Object} props.pack - Datos del pack seleccionado
 */
const PackDetailView = ({ pack }) => {
  const navigate = useNavigate();
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de Reserva Transaccional (Globales y Locales)
  const { reservation, setReservation } = useReservation();
  const [timeLeft, setTimeLeft] = useState('');

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReserve = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/api/packs/${pack.pack_id}/reserve`);
      
      if (response.data.status === 'success') {
        // El servidor devuelve los segundos, calculamos el timestamp exacto de expiración
        const expiresInMs = (response.data.reservation_expires_in || 600) * 1000;
        const expiresAt = Date.now() + expiresInMs;
        setReservation({ expiresAt, packId: pack.pack_id });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Hubo un error al intentar reservar el pack. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Temporizador Estricto Sincronizado
  useEffect(() => {
    if (!reservation?.expiresAt) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = reservation.expiresAt - now;

      if (difference <= 0) {
        return null;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Inicialización inmediata para evitar el retraso de 1 segundo
    const initialTime = calculateTimeLeft();
    if (!initialTime) {
      handleExpiration();
      return;
    }
    setTimeLeft(initialTime);

    const intervalId = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (!newTimeLeft) {
        clearInterval(intervalId);
        handleExpiration();
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [reservation]);

  const handleExpiration = async () => {
    setTimeLeft('00:00');
    setReservation(null); // Limpiamos el estado global
    
    // Llamada silenciosa para devolver el stock a Redis de inmediato
    try {
      await apiClient.post(`/api/packs/${pack.pack_id}/cancel-reservation`);
    } catch (e) {
      console.error('Fallo al liberar la reserva en el servidor');
    }

    alert('El tiempo de reserva ha expirado. El pack ha sido liberado.');
    navigate('/explore');
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/payments/create-checkout-session', {
        pack_id: pack.pack_id,
        quantity: 1 // Reservamos 1 por defecto
      });
      
      if (response.data.status === 'success') {
        window.location.href = response.data.sessionUrl;
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Hubo un error al iniciar el proceso de pago seguro.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!pack) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">No se encontró información del pack.</p>
      </div>
    );
  }

  const rawImageUrl = pack.image_url || pack.cover_url || '';
  const images = rawImageUrl.includes(',') ? rawImageUrl.split(',') : [rawImageUrl || 'https://via.placeholder.com/600x400?text=Sin+Imagen'];

  const formatPickupDay = (dateString) => {
    if (!dateString) return 'Hoy';
    const pickupDate = new Date(dateString);
    const today = new Date();
    
    const pickupDay = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = pickupDay - currentDay;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return pickupDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };
  const pickupDayLabel = formatPickupDay(pack.pickup_start_time);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 relative">
      
      {/* Botón de retroceso */}
      {!reservation && (
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-gray-800 hover:bg-white transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      )}

      {/* Hero Image (Carrusel simple) */}
      <div className="w-full h-64 md:h-80 relative overflow-x-auto flex snap-x snap-mandatory hide-scrollbar">
        {images.map((imgSrc, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
            <img src={imgSrc} alt={`${pack.title} - ${idx + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          </div>
        ))}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
            1/{images.length} ➔
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
          <h1 className="text-2xl md:text-3xl font-extrabold shadow-sm drop-shadow-md">{pack.store_name}</h1>
          <p className="text-lg font-medium opacity-90 drop-shadow-md">{pack.title}</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="px-5 py-6 max-w-2xl mx-auto">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Sección de Concepto e Info Operativa */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">¿Qué es un Pack Sorpresa?</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Ayuda a salvar comida deliciosa. El contenido exacto es una sorpresa y dependerá de lo que el comercio no haya vendido hoy. ¡Siempre a una fracción de su precio original!
          </p>
          
          <hr className="border-gray-100 my-4" />
          
          <h3 className="font-bold text-gray-800 text-sm mb-2">Ventana estricta de recogida</h3>
          <div className="flex items-center text-blue-700 bg-blue-50 px-3 py-2 rounded-lg text-sm font-bold w-fit">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {pickupDayLabel}, {formatTime(pack.pickup_start_time)} - {formatTime(pack.pickup_end_time)}
          </div>
          
          <hr className="border-gray-100 my-4" />

          <h3 className="font-bold text-gray-800 text-sm mb-2">Notas operativas y alérgenos</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Muestra el código QR que recibirás en la caja al llegar al local. Ten en cuenta que los productos pueden contener trazas de gluten, lácteos o nueces. No se admiten devoluciones ni personalizaciones.
          </p>
        </div>
      </div>

      {/* Barra fija inferior (Floating Action / Payment Module) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 md:p-6 z-50">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Si NO hay reserva: Botón de Compra Normal */}
          {!reservation ? (
            <>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 line-through">Valoración: ${Number(pack.original_price).toFixed(2)}</span>
                <span className="text-2xl font-black text-green-600">Pagas: ${Number(pack.discounted_price).toFixed(2)}</span>
              </div>
              
              <button 
                onClick={handleReserve}
                disabled={loading || pack.available_quantity === 0}
                className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                  pack.available_quantity === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Reservando...' : (pack.available_quantity === 0 ? 'Agotado' : 'Reservar Pack')}
              </button>
            </>
          ) : (
            /* Si HAY reserva: Módulo de Pago Pendiente */
            <div className="w-full flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-3">
                <span className="font-bold text-gray-800">Finalizar Pago</span>
                <div className="flex items-center text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-mono font-bold animate-pulse">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {timeLeft}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mb-4">
                Hemos bloqueado 1 pack para ti. Completa el pago antes de que expire el tiempo.
              </p>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-400"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Redirigiendo...' : `Pagar $${Number(pack.discounted_price).toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackDetailView;
