import React, { useState, useEffect } from 'react';
import { Lock, Landmark, ArrowRight, CreditCard, Clock, CheckCircle } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';

const MerchantPaymentsView = () => {
  const { activeStore } = useStoreContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados de Stripe
  const [isLinked, setIsLinked] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [balance, setBalance] = useState({ available: [], pending: [] });
  const [payouts, setPayouts] = useState([]);
  
  // Estado para el botón de onboarding
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!activeStore) return;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/merchant/payments/balance/${activeStore.id}`);
        if (response.data.status === 'success') {
          setIsLinked(response.data.isLinked);
          setIsActive(response.data.isActive || false);
          
          if (response.data.balance) {
            setBalance(response.data.balance);
          }
          if (response.data.payouts) {
            setPayouts(response.data.payouts);
          }
        }
      } catch (err) {
        setError('No pudimos conectar con los servidores financieros en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [activeStore]);

  const handleLinkAccount = async () => {
    setLinking(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/merchant/payments/onboarding', {
        storeId: activeStore.id
      });
      
      if (response.data.status === 'success' && response.data.url) {
        // Redirigir a Stripe Connect Onboarding
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError('Ocurrió un error al intentar vincular la cuenta. Intenta de nuevo.');
      setLinking(false);
    }
  };

  const formatCurrency = (amount, currency = 'GTQ') => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: currency.toUpperCase() 
    }).format(amount / 100); // Stripe devuelve los montos en centavos
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(timestamp * 1000));
  };

  if (!activeStore) {
    return (
      <div className="p-8 flex justify-center text-gray-500 font-medium">
        Por favor, selecciona una sucursal para ver sus liquidaciones.
      </div>
    );
  }

  // 1. Estado de Carga
  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
        <div className="h-12 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // 2. Estado No Vinculado (Empty State Corporativo)
  if (!isLinked || !isActive) {
    return (
      <div className="p-8 max-w-5xl mx-auto font-sans">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Pagos y Liquidaciones</h1>
        <p className="text-gray-500 font-medium text-lg mb-10">Gestiona tus ingresos y recibe tus fondos directamente a tu banco.</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200 text-center flex flex-col items-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-gray-900" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Configura tu cuenta de pagos</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Para recibir los ingresos generados por la venta de packs sorpresa en <strong>{activeStore.name}</strong>, 
            necesitamos que vincules una cuenta bancaria segura a través de nuestro partner financiero.
          </p>

          <button
            onClick={handleLinkAccount}
            disabled={linking}
            className={`flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold transition-all ${
              linking ? 'bg-gray-400 cursor-not-allowed scale-95' : 'hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            {linking ? (
              <div className="w-5 h-5 border-2 border-gray-200 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Landmark className="w-5 h-5" />
                Vincular cuenta bancaria
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
          
          <div className="mt-8 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Lock className="w-3 h-3" /> Pagos seguros procesados por Stripe
          </div>
        </div>
      </div>
    );
  }

  // Extraer el monto de pending (si existe) y de available (si existe)
  // Por simplicidad, tomamos el primer objeto de balance, asumiendo una sola moneda (GTQ)
  const pendingAmount = balance.pending && balance.pending.length > 0 ? balance.pending[0].amount : 0;
  const pendingCurrency = balance.pending && balance.pending.length > 0 ? balance.pending[0].currency : 'GTQ';

  const availableAmount = balance.available && balance.available.length > 0 ? balance.available[0].amount : 0;

  // 3. Estado Vinculado (Panel Activo)
  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Liquidaciones</h1>
          <p className="text-gray-500 font-medium text-lg">Finanzas de {activeStore.name}</p>
        </div>
        
        {/* Botón para ir al dashboard de Express de Stripe (opcional, requeriría endpoint para login link) */}
        <button 
          onClick={handleLinkAccount}
          disabled={linking}
          className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg transition-colors border border-gray-200"
        >
          <CreditCard className="w-4 h-4" />
          Configuración bancaria
        </button>
      </div>

      {/* Saldo Pendiente Destacado */}
      <div className="bg-gray-50 border border-gray-200 p-8 rounded-3xl mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Saldo Pendiente de Liquidación
          </h3>
          <div className="text-6xl font-black text-gray-900 tracking-tighter">
            {formatCurrency(pendingAmount, pendingCurrency)}
          </div>
          <p className="text-gray-500 text-sm mt-3 font-medium">
            Estos fondos están en proceso y se depositarán automáticamente según tu calendario.
          </p>
        </div>

        <div className="bg-white border border-gray-100 p-5 rounded-2xl md:min-w-[250px] shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Disponible para depósito manual</h4>
          <span className="text-2xl font-extrabold text-gray-900">{formatCurrency(availableAmount, pendingCurrency)}</span>
        </div>
      </div>

      {/* Tabla de Historial */}
      <div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-6">Últimas transferencias</h3>
        
        {payouts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aún no hay transferencias registradas.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Monto Neto</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Fecha Estimada</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Identificador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-black text-gray-900">
                      {formatCurrency(payout.amount, payout.currency)}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-600">
                      {formatDate(payout.arrival_date)}
                    </td>
                    <td className="py-4 px-6">
                      {payout.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> Completado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> Procesando
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-400 text-right font-mono">
                      {payout.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MerchantPaymentsView;
