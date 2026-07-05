import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import apiClient from '../api/apiClient';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MapExplorer = () => {
  const [viewState, setViewState] = useState({
    longitude: -3.7038,
    latitude: 40.4168,
    zoom: 13
  });
  const [location, setLocation] = useState(null);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);

  useEffect(() => {
    // Solicitar permisos GPS y establecer la vista
    if (!navigator.geolocation) {
      setError('La geolocalización no es soportada por tu navegador actual.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setViewState((prev) => ({
          ...prev,
          longitude,
          latitude,
        }));
      },
      (err) => {
        setError('Es obligatorio permitir el acceso a la ubicación GPS para localizar los packs cercanos.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    const fetchPacks = async () => {
      if (!location) return;
      
      setLoading(true);
      try {
        const response = await apiClient.get('/api/packs/explore', {
          params: {
            lat: location.lat,
            lng: location.lng,
            radius: 5
          }
        });
        
        if (response.data.status === 'success') {
          setPacks(response.data.data);
        }
      } catch (err) {
        setError('Ocurrió un error en el servidor al intentar cargar los comercios.');
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, [location]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500 font-bold text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <p className="text-gray-700 font-bold animate-pulse">Rastreando inventario en tiempo real...</p>
        </div>
      )}

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <GeolocateControl position="top-right" />
        <NavigationControl position="top-right" />

        {packs.map((pack) => (
          <Marker 
            key={pack.pack_id} 
            longitude={pack.location_lng} 
            latitude={pack.location_lat} 
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPack(pack);
            }}
          >
            <div 
              className={`w-8 h-8 rounded-full border-4 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 ${pack.available_quantity > 2 ? 'bg-green-500' : 'bg-orange-500'}`}
            ></div>
          </Marker>
        ))}

        {selectedPack && (
          <Popup
            anchor="top"
            longitude={selectedPack.location_lng}
            latitude={selectedPack.location_lat}
            onClose={() => setSelectedPack(null)}
            closeOnClick={false}
            className="z-40"
          >
            <div className="p-2 w-48">
              <img 
                src={selectedPack.image_url || selectedPack.cover_url} 
                alt={selectedPack.store_name} 
                className="h-24 w-full object-cover rounded-lg mb-2" 
              />
              <h3 className="m-0 font-black text-gray-900 text-lg leading-tight">{selectedPack.store_name}</h3>
              <p className="m-0 text-sm text-gray-600 truncate">{selectedPack.title}</p>
              
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-green-600 text-lg">${selectedPack.discounted_price}</span>
                <span className="text-xs text-gray-400 line-through">${selectedPack.original_price}</span>
              </div>
              
              <p className="m-0 mt-1 text-xs text-gray-500">
                Stock: <strong className={selectedPack.available_quantity > 2 ? 'text-green-600' : 'text-orange-500'}>{selectedPack.available_quantity}</strong>
              </p>
              <p className="m-0 text-xs text-gray-500">
                A {Number(selectedPack.distance_km).toFixed(1)} km
              </p>

              <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-md">
                Reservar Pack
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapExplorer;
