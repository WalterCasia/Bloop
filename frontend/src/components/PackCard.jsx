import React from 'react';

/**
 * Componente visual para mostrar los detalles de un pack en forma de tarjeta.
 * 
 * @param {Object} props
 * @param {Object} props.pack
 */
const PackCard = ({ pack }) => {
  const isSoldOut = pack.available_quantity === 0;

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPickupDay = (dateString) => {
    if (!dateString) return 'Hoy';
    const pickupDate = new Date(dateString);
    const today = new Date();
    
    // Normalize to midnight for accurate comparison
    const pickupDay = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = pickupDay - currentDay;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    
    // Si es otro día, formato "DD MMM"
    return pickupDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const pickupStart = formatTime(pack.pickup_start_time);
  const pickupEnd = formatTime(pack.pickup_end_time);
  const pickupDayLabel = formatPickupDay(pack.pickup_start_time);
  
  const rawImageUrl = pack.image_url || pack.cover_url || '';
  const imageUrl = rawImageUrl.includes(',') ? rawImageUrl.split(',')[0] : (rawImageUrl || 'https://via.placeholder.com/300x200?text=Sin+Imagen');

  return (
    <div className={`flex flex-row bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 transition-all duration-300 hover:shadow-md ${isSoldOut ? 'opacity-60 grayscale-[50%]' : 'opacity-100'}`}>
      
      {/* Contenedor de Imagen */}
      <div className="w-1/3 min-w-[120px] relative">
        <img 
          src={imageUrl} 
          alt={pack.title} 
          className="w-full h-full object-cover" 
        />
        {isSoldOut && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-extrabold text-xs tracking-wider transform -rotate-12 bg-red-600 px-3 py-1 rounded shadow-lg uppercase">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Contenedor de Detalles */}
      <div className="w-2/3 p-3 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-1 pr-2">{pack.store_name}</h3>
            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
              {Number(pack.distance_km).toFixed(1)} km
            </span>
          </div>
          
          <p className="text-xs text-gray-600 line-clamp-1 mb-2">{pack.title}</p>
          
          <div className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {pickupDayLabel} {pickupStart} - {pickupEnd}
          </div>
        </div>

        <div className="flex justify-between items-end mt-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 line-through decoration-gray-300">${Number(pack.original_price).toFixed(2)}</span>
            <span className="text-lg font-black text-green-600 leading-tight">${Number(pack.discounted_price).toFixed(2)}</span>
          </div>
          {!isSoldOut && (
            <div className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full animate-pulse">
              ¡Quedan {pack.available_quantity}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackCard;
