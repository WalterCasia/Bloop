import React, { createContext, useContext, useState, useEffect } from 'react';

const ReservationContext = createContext();

export const ReservationProvider = ({ children }) => {
  // Inicializamos leyendo de localStorage para persistir entre recargas
  const [reservation, setReservationState] = useState(() => {
    try {
      const stored = localStorage.getItem('bloop_reservation');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verificar si ya expiró mientras estábamos fuera
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem('bloop_reservation');
          return null;
        }
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const setReservation = (newReservation) => {
    setReservationState(newReservation);
    if (newReservation) {
      localStorage.setItem('bloop_reservation', JSON.stringify(newReservation));
    } else {
      localStorage.removeItem('bloop_reservation');
    }
  };

  // Escuchar cambios de storage en otras pestañas (opcional pero útil)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bloop_reservation') {
        setReservationState(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ReservationContext.Provider value={{ reservation, setReservation }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation debe ser usado dentro de un ReservationProvider');
  }
  return context;
};
