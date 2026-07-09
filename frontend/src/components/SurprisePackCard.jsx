import React from 'react';
import { Star, Clock, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SurprisePackCard = ({ pack, isHovered, onMouseEnter, onMouseLeave, onClick }) => {
  const navigate = useNavigate();
  
  const isSoldOut = pack.available_quantity === 0;
  const isLowStock = pack.available_quantity > 0 && pack.available_quantity <= 2;
  
  // Formateo de horarios de recogida (ej. 19:30 - 20:30)
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const pickupTime = `${formatTime(pack.pickup_start_time)} - ${formatTime(pack.pickup_end_time)}`;
  
  const handleCardClick = () => {
    if (onClick) onClick(pack);
    navigate(`/packs/${pack.pack_id}`, { state: { pack } });
  };

  const rawImg = pack.image_url || pack.cover_url || '';
  const firstImgUrl = rawImg.includes(',') ? rawImg.split(',')[0] : rawImg;

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border ${
        isHovered ? 'shadow-lg border-gray-900 scale-[1.02]' : 'shadow-sm border-gray-200 hover:shadow-md'
      } ${isSoldOut ? 'opacity-60 grayscale-[50%]' : 'bg-white'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleCardClick}
    >
      {/* Imagen Header */}
      <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
        {firstImgUrl ? (
          <img 
            src={firstImgUrl} 
            alt={pack.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center bg-gray-300 text-gray-500">
            <span className="font-bold tracking-widest uppercase text-sm">Sin Imagen</span>
          </div>
        )}
        
        {/* Distancia Superpuesta */}
        {pack.distance_km !== undefined && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
            <MapPin size={14} className="text-gray-700" />
            <span className="text-xs font-bold text-gray-800">{Number(pack.distance_km).toFixed(1)} km</span>
          </div>
        )}
        
        {/* Etiqueta Agotado */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 flex justify-center items-center">
            <span className="bg-red-600 text-white font-black px-4 py-2 rounded-xl text-lg uppercase tracking-widest shadow-xl rotate-[-5deg]">
              AGOTADO
            </span>
          </div>
        )}
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight truncate pr-2">
            {pack.store_name}
          </h3>
          <div className="flex items-center gap-1 text-gray-800 shrink-0">
            <Star size={16} fill="currentColor" className="text-yellow-400" />
            <span className="text-sm font-bold">4.8</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 font-medium mb-3 truncate">
          {pack.title}
        </p>
        
        {/* Horario de Recogida */}
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 border border-green-100">
          <Clock size={16} />
          <span className="text-xs font-bold">Recogida hoy: {pickupTime}</span>
        </div>
        
        {/* Footer: Precios y Stock */}
        <div className="flex justify-between items-end mt-auto">
          <div>
            <p className="text-gray-400 text-xs font-bold line-through decoration-gray-300 mb-0.5">
              Q{Number(pack.original_price).toFixed(2)}
            </p>
            <p className="text-gray-900 font-black text-2xl leading-none">
              Q{Number(pack.discounted_price).toFixed(2)}
            </p>
          </div>
          
          {/* Advertencia de Escasez */}
          {isLowStock && !isSoldOut && (
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">¡Date prisa!</span>
               <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 mt-1">
                 <AlertCircle size={14} />
                 <span className="text-xs font-bold">Quedan {pack.available_quantity}</span>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurprisePackCard;
