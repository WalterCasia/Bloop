import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const StoreLocationStep = ({ data, onChange, onValidationChange }) => {
  const { address, coords } = data;
  
  const [viewState, setViewState] = useState({
    longitude: coords?.lng || -90.5069,
    latitude: coords?.lat || 14.6349,
    zoom: 13
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Validación: debe haber dirección y coordenadas
    const isValid = address.trim().length > 5 && coords !== null;
    onValidationChange(isValid);
  }, [address, coords, onValidationChange]);

  const handleVerifyAddress = async () => {
    if (address.trim().length < 5) {
      setError('Ingresa una dirección más detallada antes de verificar.');
      return;
    }
    setIsGeocoding(true);
    setError('');

    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
      const result = await response.json();

      if (result.features && result.features.length > 0) {
        const [lng, lat] = result.features[0].center;
        onChange({ coords: { lng, lat } });
        setViewState({ longitude: lng, latitude: lat, zoom: 15 });
      } else {
        setError('No pudimos encontrar la ubicación exacta. Por favor, ingresa una mejor dirección o ajusta el mapa.');
      }
    } catch (err) {
      setError('Error al conectar con el servicio de mapas.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMarkerDragEnd = (event) => {
    onChange({ coords: { lng: event.lngLat.lng, lat: event.lngLat.lat } });
  };

  // Si aún no hay coords pero ya cargo el componente, establecemos las de por defecto del ViewState
  useEffect(() => {
    if (!coords) {
      onChange({ coords: { lng: viewState.longitude, lat: viewState.latitude } });
    }
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in flex flex-col h-full">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-8">
        ¿Dónde está ubicado?
      </h2>
      
      <div className="space-y-6 flex-1 flex flex-col">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección física completa</label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => onChange({ address: e.target.value })}
                className="appearance-none block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-lg transition-colors"
                placeholder="Ej. 6ta Avenida 12-34, Zona 1"
              />
            </div>
            <button
              onClick={handleVerifyAddress}
              disabled={isGeocoding}
              className="px-6 py-4 bg-gray-100 border border-gray-300 text-gray-900 rounded-xl font-bold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors whitespace-nowrap"
            >
              {isGeocoding ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[300px] w-full rounded-xl overflow-hidden border border-gray-300 relative shadow-inner">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            {coords && (
              <Marker 
                longitude={coords.lng} 
                latitude={coords.lat}
                draggable
                onDragEnd={handleMarkerDragEnd}
              >
                <div className="w-8 h-8 bg-black rounded-full border-4 border-white shadow-lg animate-bounce flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </Marker>
            )}
          </Map>
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-700 text-center pointer-events-none">
            Arrastra el marcador negro para indicar tu ubicación exacta.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLocationStep;
