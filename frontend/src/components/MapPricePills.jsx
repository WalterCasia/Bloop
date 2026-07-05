import React from 'react';
import { Marker } from 'react-map-gl';

const MapPricePill = ({ pack, isHovered, onClick }) => {
  // pack.location_lat y pack.location_lng vienen del endpoint /explore
  if (!pack.location_lat || !pack.location_lng) return null;

  const stock = pack.available_quantity;
  const isSoldOut = stock === 0;
  const isLowStock = stock > 0 && stock <= 2;

  // Clases dinámicas basadas en stock y estado (Hover)
  let pillClasses = "flex items-center justify-center px-3 py-1.5 rounded-full font-black text-sm transition-all duration-300 shadow-md cursor-pointer border-2 ";
  
  if (isSoldOut) {
    pillClasses += "bg-gray-200 text-gray-500 border-gray-300";
  } else if (isLowStock) {
    pillClasses += isHovered 
      ? "bg-amber-600 text-white border-amber-700 shadow-xl scale-125 z-50" 
      : "bg-amber-500 text-white border-amber-600 hover:scale-110 z-10";
  } else {
    // Normal (stock > 2)
    pillClasses += isHovered 
      ? "bg-gray-900 text-white border-black shadow-xl scale-125 z-50" 
      : "bg-white text-gray-900 border-gray-200 hover:scale-110 z-10";
  }

  // Prevenir propagación si el usuario hace clic en el mapa vs en el pin
  const handleMarkerClick = (e) => {
    e.originalEvent.stopPropagation();
    if (onClick) onClick(pack);
  };

  return (
    <Marker 
      longitude={pack.location_lng} 
      latitude={pack.location_lat} 
      anchor="center"
      onClick={handleMarkerClick}
      style={{ zIndex: isHovered ? 50 : (isSoldOut ? 1 : 10) }}
    >
      <div className={pillClasses}>
        {isSoldOut ? 'Agotado' : `Q${Number(pack.discounted_price).toFixed(0)}`}
      </div>
    </Marker>
  );
};

export default MapPricePill;
