import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import apiClient from '../api/apiClient';

const ReviewModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const TAG_OPTIONS = [
    'Rápida entrega',
    'Excelente valor',
    'Buena cantidad',
    'Personal amable',
    'Comida deliciosa'
  ];

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Por favor, selecciona una calificación.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        orderId: order.id,
        rating,
        tags: selectedTags,
        comment: comment.trim()
      };

      const response = await apiClient.post('/api/reviews', payload);
      
      if (response.data.status === 'success') {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error al enviar tu reseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 pt-10">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Califica tu pedido</h2>
          <p className="text-gray-500 text-sm text-center mb-8">¿Qué te pareció el pack sorpresa de {order.store_name}?</p>

          {/* Selector de Estrellas */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-100 text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          {/* Selector de Etiquetas */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">¿Qué fue lo mejor? (Opcional)</h3>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comentario (Opcional) */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Añade un comentario (Opcional)</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe tu opinión aquí..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none h-24"
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {/* Botón Enviar */}
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center ${
              loading || rating === 0
                ? 'bg-gray-300 cursor-not-allowed shadow-none text-gray-500'
                : 'bg-black hover:bg-gray-800 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Enviar valoración'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
