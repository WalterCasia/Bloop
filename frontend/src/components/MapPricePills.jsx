import React from 'react';
import { Marker } from 'react-map-gl/mapbox';

const MapPricePill = ({ pack, isHovered, onClick }) => {
  // pack.location_lat y pack.location_lng vienen del endpoint /explore
  if (!pack.location_lat || !pack.location_lng) return null;

  const stock = pack.available_quantity;
  const isSoldOut = stock === 0;

  // Clases dinámicas basadas en stock y estado (Hover)
  let pillClasses = "relative flex flex-col items-center cursor-pointer transition-transform duration-300 ";
  pillClasses += isHovered ? "scale-110 z-50" : "z-10";

  let bgClass = "";
  if (isSoldOut) {
    bgClass = "bg-gray-300 text-gray-500";
  } else {
    bgClass = isHovered ? "bg-gray-900 text-white" : "bg-white text-gray-900";
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
      anchor="bottom"
      onClick={handleMarkerClick}
      style={{ zIndex: isHovered ? 50 : (isSoldOut ? 1 : 10) }}
    >
      <div className={pillClasses}>
        {/* Cuerpo de la píldora (Precio) */}
        <div className={`px-3 py-1 rounded-full font-bold text-sm shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-colors duration-300 ${bgClass}`}>
          {isSoldOut ? 'Agotado' : `Q${Number(pack.discounted_price).toFixed(0)}`}
        </div>
        
        {/* Triángulo inferior (colita) */}
        <div 
          className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] transition-colors duration-300 ${isSoldOut ? 'border-t-gray-300' : isHovered ? 'border-t-gray-900' : 'border-t-white'}`}
          style={{ filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.15))', marginTop: '-1px' }}
        ></div>
      </div>
    </Marker>
  );
};

export default MapPricePill;
