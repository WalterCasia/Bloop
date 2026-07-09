import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { useReview } from '../contexts/ReviewContext';
import apiClient from '../api/apiClient';

const IMPROVEMENT_TAGS = ['Espera larga', 'Poca cantidad', 'Mala presentación', 'Falta de sabor', 'Atención deficiente', 'Otro'];
const SUCCESS_TAGS = ['Excelente atención', 'Mucha comida', 'Buen precio', 'Delicioso', 'Rápido', 'Buena presentación'];

export default function ClientReviewModal() {
  const { isReviewModalOpen, orderToReview, closeReviewModal } = useReview();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isReviewModalOpen) {
      setRating(0);
      setHoverRating(0);
      setSelectedTags([]);
      setComment('');
      setError('');
      setIsClosing(false);
    }
  }, [isReviewModalOpen]);

  // Clear tags if rating category changes between good/bad
  useEffect(() => {
    setSelectedTags([]);
  }, [rating > 3]);

  if (!isReviewModalOpen) return null;

  const currentTags = rating > 0 && rating <= 3 ? IMPROVEMENT_TAGS : SUCCESS_TAGS;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeReviewModal();
    }, 300);
  };

  const handleSubmit = async () => {
    if (rating === 0 || !orderToReview) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await apiClient.post('/api/reviews', {
        orderId: orderToReview.id,
        rating,
        tags: selectedTags,
        comment: comment.trim()
      });
      
      handleClose();
    } catch (err) {
      if (err.response?.status === 409) {
         setError('Parece que ya calificaste este pedido anteriormente.');
      } else {
         setError(err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error al enviar la calificación.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Califica tu pedido</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              ¿Cómo estuvo tu experiencia?
            </h3>
            {orderToReview?.pack_title && (
              <p className="text-gray-500 text-sm">{orderToReview.pack_title}</p>
            )}
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={42}
                  className={`transition-colors duration-200 ${
                    (hoverRating || rating) >= star
                      ? 'fill-black text-black'
                      : 'text-gray-200 fill-transparent'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          {/* Dynamic Tags */}
          {rating > 0 && (
            <div className="mb-6 transition-all duration-300 opacity-100 translate-y-0">
              <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                {rating <= 3 ? '¿Qué podríamos mejorar?' : '¿Qué fue lo mejor?'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-200 ${
                        isSelected 
                          ? 'bg-black border-black text-white' 
                          : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment */}
          {rating > 0 && (
            <div className="transition-all duration-300 opacity-100 translate-y-0">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos más sobre tu experiencia (opcional)..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none h-28"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
              rating === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Enviar Calificación'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
