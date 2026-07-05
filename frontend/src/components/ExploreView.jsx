import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import apiClient from '../api/apiClient';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEFAULT_LOCATION = { latitude: 19.4326, longitude: -99.1332 }; // CDMX por defecto

const ExploreView = () => {
  const [viewState, setViewState] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    zoom: 13
  });
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);

  const fetchPacks = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/packs/explore', {
        params: { lat, lng, radius: 5 }
      });
      if (response.data.status === 'success') {
        setPacks(response.data.data);
      }
    } catch (err) {
      setError('Ocurrió un error al cargar los comercios. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewState((prev) => ({ ...prev, latitude, longitude }));
          fetchPacks(latitude, longitude);
        },
        (err) => {
          console.warn('Acceso GPS denegado o fallido. Usando ubicación por defecto.');
          fetchPacks(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      fetchPacks(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    }
  }, [fetchPacks]);

  const handleMoveEnd = useCallback((evt) => {
    setViewState(evt.viewState);
    fetchPacks(evt.viewState.latitude, evt.viewState.longitude);
  }, [fetchPacks]);

  const getMarkerColor = (stock) => {
    if (stock === 0) return 'bg-gray-500';
    if (stock <= 2) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-red-600 font-bold">Error: VITE_MAPBOX_TOKEN no está configurado.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Barra de búsqueda (Fallback cuando falla GPS) */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 w-11/12 max-w-md">
        <input 
          type="text" 
          placeholder="Buscar ciudad, barrio o dirección..." 
          className="w-full px-5 py-3 rounded-full shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
        />
      </div>

      {loading && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-white rounded-full shadow-md">
          <span className="text-sm font-semibold text-gray-700 animate-pulse">Explorando zona...</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 px-4 py-3 bg-red-100 border border-red-400 rounded-lg shadow-lg w-11/12 max-w-md text-center">
          <span className="text-sm font-semibold text-red-700">{error}</span>
        </div>
      )}

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {packs.map((pack) => (
          <Marker
            key={pack.pack_id}
            longitude={pack.location_lng}
            latitude={pack.location_lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedPack(pack);
            }}
          >
            <div className={`w-7 h-7 rounded-full border-4 border-white shadow-lg cursor-pointer transition-transform hover:scale-110 ${getMarkerColor(pack.available_quantity)}`} />
          </Marker>
        ))}

        {selectedPack && (
          <Popup
            longitude={selectedPack.location_lng}
            latitude={selectedPack.location_lat}
            anchor="bottom"
            offset={30}
            onClose={() => setSelectedPack(null)}
            closeOnClick={false}
            className="rounded-xl overflow-hidden"
          >
            <div className="p-3 w-56">
              <h3 className="font-bold text-gray-900 text-sm truncate">{selectedPack.store_name}</h3>
              <p className="text-xs text-gray-600 mt-1 truncate">{selectedPack.title}</p>
              <div className="mt-3 flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                <span className="text-sm font-bold text-green-700">${selectedPack.discounted_price}</span>
                <span className="text-xs text-gray-400 line-through">${selectedPack.original_price}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Stock: <span className={`${selectedPack.available_quantity > 2 ? 'text-green-600' : 'text-orange-600'} font-bold`}>{selectedPack.available_quantity}</span>
              </p>
              <button className="mt-3 w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Reservar Pack
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default ExploreView;
