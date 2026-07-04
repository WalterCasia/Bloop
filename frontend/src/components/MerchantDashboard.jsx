import React, { useState } from 'react';
import apiClient from '../api/apiClient';

/**
 * Panel Operativo del Comercio
 * Nota: En un entorno de producción, el cuadro "Visor de Cámara" se reemplaza 
 * por un componente como 'react-qr-reader' que captura el QR y ejecuta handleScan.
 */
const MerchantDashboard = () => {
  const [qrData, setQrData] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [feedback, setFeedback] = useState(null);

  // Función que se ejecutaría automáticamente al detectar un QR en la cámara
  const handleScan = async (data) => {
    if (!data || status === 'loading') return;

    setQrData(data);
    setStatus('loading');
    setFeedback(null);

    try {
      // Llamada al endpoint protegido de validación
      const response = await apiClient.post('/api/merchant/orders/validate', {
        qr_code: data
      });

      if (response.data.status === 'success') {
        setStatus('success');
        setFeedback({
          type: 'success',
          title: '¡Entrega Autorizada!',
          message: response.data.message,
          orderInfo: response.data.order
        });
      }
    } catch (error) {
      setStatus('error');
      setFeedback({
        type: 'error',
        title: 'Validación Rechazada',
        message: error.response?.data?.message || 'Error de red al conectar con el servidor.'
      });
    }
  };

  // Restaurar el visor de cámara para el siguiente cliente
  const resetScanner = () => {
    setQrData('');
    setStatus('idle');
    setFeedback(null);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>

      <header style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Panel Operativo</h1>
        <p style={{ color: '#6B7280', margin: 0 }}>Escanea el código QR del cliente para validar y entregar el pack.</p>
      </header>

      {/* Visor de Cámara (Estructura y Fallback para pruebas) */}
      <div style={{
        backgroundColor: '#F3F4F6',
        border: '2px dashed #D1D5DB',
        borderRadius: '16px',
        height: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {status === 'idle' && (
          <>
            <div style={{ width: '64px', height: '64px', border: '4px solid #9CA3AF', borderRadius: '8px', marginBottom: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', backgroundColor: '#EF4444' }}></div>
            </div>
            <p style={{ color: '#4B5563', fontWeight: 'bold', margin: '0 0 16px 0' }}>Esperando lectura de cámara...</p>

            {/* Fallback de input manual para testing local pegando el JWT generado */}
            <div style={{ display: 'flex', gap: '8px', width: '80%', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Pegar código JWT (QR) aquí..."
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }}
              />
              <button
                onClick={() => handleScan(qrData)}
                style={{ backgroundColor: '#111827', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Validar
              </button>
            </div>
          </>
        )}

        {status === 'loading' && (
          <div style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #BFDBFE', borderTopColor: '#3B82F6', borderRadius: '50%', marginBottom: '16px' }}></div>
            Verificando firma criptográfica...
          </div>
        )}
      </div>

      {/* Panel de Resultados de Validación */}
      {feedback && (
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '900',
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
            margin: '0 0 8px 0'
          }}>
            {feedback.title}
          </h2>

          <p style={{ margin: '0 0 20px 0', color: feedback.type === 'success' ? '#047857' : '#B91C1C', fontWeight: '500' }}>
            {feedback.message}
          </p>

          {/* Información del pedido solo visible si es exitoso */}
          {feedback.type === 'success' && feedback.orderInfo && (
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E5E7EB', textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.875rem' }}>
                <strong>ID Pedido:</strong> <span style={{ fontFamily: 'monospace' }}>{feedback.orderInfo.id}</span>
              </p>
              <p style={{ margin: 0, color: '#374151', fontSize: '1rem' }}>
                <strong>Entregar:</strong> {feedback.orderInfo.pack_title}
              </p>
            </div>
          )}

          <button
            onClick={resetScanner}
            style={{
              backgroundColor: feedback.type === 'success' ? '#10B981' : '#EF4444',
              color: 'white',
              fontWeight: 'bold',
              padding: '14px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem',
              boxShadow: `0 4px 6px ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}
          >
            {feedback.type === 'success' ? 'Escanear Siguiente Cliente' : 'Intentar de Nuevo'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
