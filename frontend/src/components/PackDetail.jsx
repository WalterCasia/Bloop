import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

import { useLocation, useNavigate } from 'react-router-dom';

const PackDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pack = location.state?.pack;

  const onBack = () => navigate(-1);

  if (!pack) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Pack no encontrado</h2>
        <button onClick={onBack}>Volver</button>
      </div>
    );
  }

  // Estados: 'idle', 'loading', 'reserved', 'expired', 'error'
  const [status, setStatus] = useState('idle'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos (600 segundos) exactos
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

  const handleReserve = async () => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const response = await apiClient.post(`/api/packs/${pack.pack_id}/reserve`);
      if (response.data.status === 'success') {
        setStatus('reserved');
        // Obligar al estado a tomar el valor retornado por el servidor por seguridad
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
        // Redirigir directamente a la pasarela de Stripe alojada
        window.location.href = response.data.sessionUrl;
      } else {
        throw new Error('No se pudo obtener la URL de pago.');
      }
    } catch (error) {
      setIsProcessingPayment(false);
      setErrorMessage(error.response?.data?.message || 'Error de conexión con la pasarela de pagos.');
    }
  };

  // Función de formateo matemático estricto MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Interfaz de Expiración Estricta (Bloquea toda acción)
  if (status === 'expired') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white', padding: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '16px' }}>Tiempo Expirado</h2>
        <p style={{ marginBottom: '32px', color: '#D1D5DB', maxWidth: '400px' }}>
          La reserva temporal de 10 minutos ha finalizado. El inventario ha sido liberado nuevamente a la plataforma.
        </p>
        <button 
          onClick={onBack}
          style={{ backgroundColor: 'white', color: '#111827', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
        >
          Volver al Mapa
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #F3F4F6', fontFamily: 'sans-serif' }}>
      
      {/* Cabecera de Imagen */}
      <div style={{ position: 'relative', height: '200px', backgroundColor: '#E5E7EB' }}>
        <img 
          src={pack.image_url || pack.cover_url} 
          alt={pack.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <button 
          onClick={onBack}
          style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ←
        </button>
      </div>

      {/* Contenido */}
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px 0', color: '#111827' }}>{pack.store_name}</h2>
            <p style={{ margin: 0, color: '#4B5563', fontWeight: '500' }}>{pack.title}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#16A34A' }}>${pack.discounted_price}</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#9CA3AF', textDecoration: 'line-through' }}>${pack.original_price}</p>
          </div>
        </div>

        <div style={{ backgroundColor: '#F3F4F6', padding: '12px', borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #3B82F6' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Horario de recogida oficial:</strong>
            {new Date(pack.pickup_start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(pack.pickup_end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>

        {status === 'error' && (
          <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem', fontWeight: 'bold', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}

        {(status === 'idle' || status === 'error') && (
          <button 
            onClick={handleReserve}
            style={{ width: '100%', backgroundColor: '#2563EB', color: 'white', fontWeight: 'bold', padding: '16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            Reservar Pack
          </button>
        )}

        {status === 'loading' && (
          <button disabled style={{ width: '100%', backgroundColor: '#93C5FD', color: 'white', fontWeight: 'bold', padding: '16px', borderRadius: '8px', border: 'none', cursor: 'wait', fontSize: '1rem' }}>
            Bloqueando inventario en Redis...
          </button>
        )}

        {status === 'reserved' && (
          <div style={{ marginTop: '16px', padding: '20px', backgroundColor: '#FFF7ED', border: '2px solid #FFEDD5', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#9A3412', fontWeight: 'bold' }}>¡Reserva Asegurada!</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#C2410C' }}>Completa el pago antes de que el contador finalice.</p>
            
            <div style={{ fontSize: '3rem', fontWeight: '900', color: '#EA580C', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '20px' }}>
              {formatTime(timeLeft)}
            </div>
            
            <button 
              onClick={handlePayment}
              disabled={isProcessingPayment}
              style={{ width: '100%', backgroundColor: isProcessingPayment ? '#9CA3AF' : '#16A34A', color: 'white', fontWeight: 'bold', padding: '16px', borderRadius: '8px', border: 'none', cursor: isProcessingPayment ? 'wait' : 'pointer', fontSize: '1rem', boxShadow: isProcessingPayment ? 'none' : '0 4px 6px rgba(22, 163, 74, 0.2)' }}
            >
              {isProcessingPayment ? 'Conectando con Stripe...' : 'Confirmar y Pagar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackDetail;
