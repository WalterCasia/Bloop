import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapPreviewSection = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewState, setViewState] = useState({
    longitude: -90.5069, // Centro de Ciudad de Guatemala
    latitude: 14.6349,
    zoom: 11
  });

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/explore/preview`);
        if (!response.ok) throw new Error('Error fetching map preview data');
        const data = await response.json();
        setStores(data.data || []);
      } catch (error) {
        console.error('Error cargando preview de mapa:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <section className="w-full max-w-7xl mx-auto px-8 mb-24">
      <div className="relative w-full h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
        
        {isLoading ? (
          <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-300 animate-bounce" />
          </div>
        ) : (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            scrollZoom={false} // Para no interrumpir el scroll de la Landing Page
            style={{ width: '100%', height: '100%' }}
          >
            {stores.map((store, index) => (
              <Marker 
                key={store.store_id || index}
                longitude={store.lng} 
                latitude={store.lat}
                anchor="center"
              >
                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
              </Marker>
            ))}
          </Map>
        )}

        {/* Capa de Interacción y Llamada a la Acción (CTA Overlay) */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none flex flex-col justify-end items-center pb-8">
          <button 
            onClick={() => navigate('/auth/client')}
            className="pointer-events-auto bg-black text-white px-8 py-4 rounded-full text-base font-bold shadow-xl hover:bg-gray-800 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Inicia sesión para ver los locales exactos
          </button>
        </div>
      </div>
    </section>
  );
};

export default MapPreviewSection;
