import React, { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, Filter, User } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../context/StoreContext';

const MerchantReviewsView = () => {
  const { activeStore } = useStoreContext();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filterRating, setFilterRating] = useState('all'); // 'all', '1', '2', '3', '4', '5'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'replied', 'unreplied'

  // Estado para las respuestas (acordeón)
  const [replyingTo, setReplyingTo] = useState(null); // review.id
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!activeStore) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/merchant/reviews/${activeStore.id}`);
        if (response.data.status === 'success') {
          setReviews(response.data.reviews || []);
          setStats(response.data.stats || { totalReviews: 0, averageRating: 0 });
        }
      } catch (err) {
        setError('Ocurrió un error al cargar las reseñas de esta sucursal.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [activeStore]);

  // Lista filtrada optimizada con useMemo
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      // Filtro de calificación
      if (filterRating !== 'all' && review.rating.toString() !== filterRating) {
        return false;
      }
      // Filtro de estado
      if (filterStatus === 'replied' && !review.merchant_reply) {
        return false;
      }
      if (filterStatus === 'unreplied' && review.merchant_reply) {
        return false;
      }
      return true;
    });
  }, [reviews, filterRating, filterStatus]);

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;
    
    setSubmittingReply(true);
    try {
      const response = await apiClient.patch(`/api/merchant/reviews/${reviewId}/reply`, {
        reply: replyText.trim()
      });
      
      if (response.data.status === 'success') {
        // Actualizar localmente la reseña
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, merchant_reply: replyText.trim() } : r
        ));
        setReplyingTo(null);
        setReplyText('');
      }
    } catch (err) {
      alert('Error al enviar la respuesta. Por favor intenta de nuevo.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  // Renderizar estrellas de calificación (1 a 5)
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'fill-black text-black' : 'fill-gray-100 text-gray-200'}`} 
          />
        ))}
      </div>
    );
  };

  if (!activeStore) {
    return (
      <div className="p-8 flex justify-center text-gray-500 font-medium">
        Por favor, selecciona una sucursal.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      
      {/* Cabecera y Estadísticas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Reseñas de clientes</h1>
          <p className="text-gray-500 font-medium text-lg">Descubre lo que dicen de {activeStore.name}</p>
        </div>
        
        <div className="flex items-center gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 min-w-[280px]">
          <div className="flex-1">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Promedio</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-gray-900 leading-none">{Number(stats.averageRating).toFixed(1)}</span>
              <Star className="w-8 h-8 fill-black text-black mb-1" />
            </div>
          </div>
          <div className="h-16 w-px bg-gray-200"></div>
          <div className="flex-1">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Total</p>
            <span className="text-3xl font-extrabold text-gray-900">{stats.totalReviews}</span>
          </div>
        </div>
      </div>

      {/* Fila de Filtros (Pills) */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center text-gray-400 mr-2">
          <Filter className="w-5 h-5 mr-2" />
          <span className="font-bold text-sm uppercase tracking-wider">Filtrar:</span>
        </div>
        
        {/* Filtro Calificación */}
        <select 
          value={filterRating} 
          onChange={(e) => setFilterRating(e.target.value)}
          className="appearance-none bg-gray-100 border border-transparent text-gray-800 text-sm font-bold rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <option value="all">Cualquier calificación</option>
          <option value="5">5 Estrellas</option>
          <option value="4">4 Estrellas</option>
          <option value="3">3 Estrellas</option>
          <option value="2">2 Estrellas</option>
          <option value="1">1 Estrella</option>
        </select>

        {/* Filtro Estado */}
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="appearance-none bg-gray-100 border border-transparent text-gray-800 text-sm font-bold rounded-full px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <option value="all">Todos los estados</option>
          <option value="unreplied">Sin responder</option>
          <option value="replied">Respondidos</option>
        </select>
      </div>

      {/* Lista de Reseñas */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium border border-red-100">
          {error}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-lg">No se encontraron reseñas con estos filtros.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 py-8 flex flex-col md:flex-row gap-6 md:gap-8 group">
              
              {/* Columna Izquierda (Cliente) */}
              <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-2 md:w-48 shrink-0">
                {review.client.avatar ? (
                  <img src={review.client.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">{review.client.name}</h3>
                  {review.client.is_new_client ? (
                    <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Cliente Nuevo</span>
                  ) : (
                    <span className="inline-block bg-green-50 text-green-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Recurrente</span>
                  )}
                </div>
              </div>

              {/* Columna Central (Calificación y Comentario) */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  {renderStars(review.rating)}
                  <span className="text-gray-400 text-sm font-medium">• {formatDate(review.created_at)}</span>
                </div>

                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {review.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {review.comment && (
                  <p className="text-gray-800 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                )}

                {/* Respuesta del Gerente (Si ya fue respondido) */}
                {review.merchant_reply && (
                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl mt-2 relative">
                    <div className="absolute top-0 left-6 -mt-2 w-4 h-4 bg-gray-50 border-t border-l border-gray-100 transform rotate-45"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-sm text-gray-900">Respuesta del local</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed ml-8">{review.merchant_reply}</p>
                  </div>
                )}

                {/* Área de Respuesta (Si se hizo clic en Responder) */}
                {!review.merchant_reply && replyingTo === review.id && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Escribe una respuesta a ${review.client.name}...`}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none h-24 mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleReplySubmit(review.id)}
                        disabled={submittingReply || !replyText.trim()}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center min-w-[120px] ${
                          submittingReply || !replyText.trim()
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {submittingReply ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                        ) : 'Enviar'}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        disabled={submittingReply}
                        className="px-4 py-2.5 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna Derecha (Acciones) */}
              <div className="md:w-32 shrink-0 flex justify-end items-start mt-4 md:mt-0">
                {!review.merchant_reply && replyingTo !== review.id && (
                  <button 
                    onClick={() => {
                      setReplyingTo(review.id);
                      setReplyText('');
                    }}
                    className="w-full bg-black text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-gray-800 hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Responder
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantReviewsView;
