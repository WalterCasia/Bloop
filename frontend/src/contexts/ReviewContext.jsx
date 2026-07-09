import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState(null);
  const { user } = useAuth();

  const openReviewModal = (order) => {
    setOrderToReview(order);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    // Pequeño retardo para limpiar el estado después de la animación (si la hubiera)
    setTimeout(() => {
      setOrderToReview(null);
    }, 300);
  };

  useEffect(() => {
    if (!user) return;

    // Escuchamos actualizaciones en los pedidos del usuario actual
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `client_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          // Si el estado cambia a RECOGIDO (equivalente a DELIVERED)
          if (newStatus === 'RECOGIDO' && oldStatus !== 'RECOGIDO') {
            openReviewModal(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <ReviewContext.Provider value={{ isReviewModalOpen, orderToReview, openReviewModal, closeReviewModal }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview debe ser usado dentro de un ReviewProvider');
  }
  return context;
};
