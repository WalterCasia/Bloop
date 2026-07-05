import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api/apiClient';

/**
 * QRScannerModal
 * Activa la cámara trasera para escanear tickets de clientes.
 * Requiere la instalación de: npm install html5-qrcode
 */
const QRScannerModal = ({ onClose, onSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  // Inicialización y limpieza estricta de la cámara
  useEffect(() => {
    // Retraso ligero para asegurar que el div contenedor ya existe en el DOM
    const timer = setTimeout(() => {
      html5QrCode.current = new Html5Qrcode("qr-reader");
      
      html5QrCode.current.start(
        { facingMode: "environment" }, // Priorizar cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Escaneo exitoso: detener cámara inmediatamente y validar
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Errores de lectura frame a frame (se ignoran silenciosamente en UI)
        }
      ).catch(err => {
        setError("Error al acceder a la cámara. Revisa los permisos de tu navegador.");
      });
    }, 200);

    // Cleanup: Detener el stream de video al desmontar el modal
    return () => {
      clearTimeout(timer);
      if (html5QrCode.current && html5QrCode.current.isScanning) {
        html5QrCode.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleScanSuccess = async (token) => {
    // Si ya estamos validando algo, ignoramos lecturas adicionales
    if (loading) return;
    
    setLoading(true);
    setError(null);

    // Detenemos visualmente el escáner para congelar la imagen
    if (html5QrCode.current && html5QrCode.current.isScanning) {
      await html5QrCode.current.stop().catch(console.error);
    }

    try {
      const response = await apiClient.post('/api/merchant/orders/validate', { token });
      if (response.data.status === 'success') {
        onSuccess(response.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Error de comunicación con el servidor. Intenta de nuevo.'
      );
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode || manualCode.length < 4) return;
    handleScanSuccess(manualCode); // Reutilizamos la función enviando el código manual
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      
      {/* Cabecera del Escáner */}
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white shrink-0 shadow-md z-10">
        <h2 className="text-lg font-bold">Validar Entrega</h2>
        <button 
          onClick={onClose}
          className="bg-gray-800 text-gray-300 hover:text-white p-2 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Contenedor del Lector QR */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="font-bold tracking-widest uppercase">Validando...</p>
          </div>
        ) : (
          <div id="qr-reader" className="w-full max-w-sm" ref={scannerRef}></div>
        )}
      </div>

      {/* Área de Errores */}
      {error && (
        <div className="bg-red-600 text-white p-4 font-bold text-center text-sm">
          {error}
          <button 
            onClick={() => { setError(null); window.location.reload(); }} // Reset rápido
            className="ml-4 underline text-red-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Área de Entrada Manual */}
      <div className="bg-white p-6 shrink-0 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-10">
        <h3 className="text-sm font-bold text-gray-800 text-center mb-4 uppercase tracking-widest">
          ¿Problemas con la cámara?
        </h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Introduce el PIN de 4 dígitos"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
          />
          <button
            type="submit"
            disabled={loading || manualCode.length < 4}
            className="bg-gray-900 text-white px-6 font-bold rounded-xl hover:bg-black disabled:bg-gray-400 transition-colors"
          >
            Validar
          </button>
        </form>
      </div>
      
    </div>
  );
};

export default QRScannerModal;
