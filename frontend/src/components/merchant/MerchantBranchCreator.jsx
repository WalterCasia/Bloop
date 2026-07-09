import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';
import { Building2, MapPin, Loader2, ArrowLeft } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MerchantBranchCreator = () => {
  const navigate = useNavigate();
  const { fetchStores } = useStoreContext();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coords, setCoords] = useState({ lng: -90.5069, lat: 14.6349 }); // Guatemala Default
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewState, setViewState] = useState({
    longitude: -90.5069,
    latitude: 14.6349,
    zoom: 13
  });

  const handleMarkerDragEnd = useCallback((event) => {
    setCoords({ lng: event.lngLat.lng, lat: event.lngLat.lat });
  }, []);

  const handleMapClick = useCallback((event) => {
    setCoords({ lng: event.lngLat.lng, lat: event.lngLat.lat });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2) {
      setError('El nombre de la sucursal debe tener al menos 2 caracteres.');
      return;
    }
    if (!address.trim() || address.length < 5) {
      setError('Proporciona una dirección completa y válida.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await apiClient.post('/api/merchant/stores', {
        name,
        address,
        cover_url: coverUrl,
        lng: coords.lng,
        lat: coords.lat
      });

      // Refrescar el contexto global para incluir la nueva tienda
      await fetchStores();
      
      // Regresar al dashboard donde el selector ahora tendrá la nueva sucursal
      navigate('/merchant/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la sucursal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        
        {/* Encabezado */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white text-gray-600 rounded-full shadow-sm hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="text-gray-900" size={28} />
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Agregar Sucursal</h1>
          </div>
        </div>

        {/* Contenedor del Formulario */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Local</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none font-medium transition-all"
                placeholder="Ej. Sede Norte"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Dirección Física</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows="2"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none font-medium transition-all resize-none"
                placeholder="Ingresa la calle, número, colonia..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">URL del Logo (Opcional)</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none font-medium transition-all"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>

            {/* Mapa de Coordenadas */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <MapPin size={18} className="text-gray-500" /> Coordenadas Exactas
              </label>
              <p className="text-xs text-gray-500 mb-3 font-medium">
                Arrastra el marcador negro en el mapa para ubicar exactamente la entrada de tu local.
              </p>
              <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 relative bg-gray-100">
                <Map
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  onClick={handleMapClick}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Marker 
                    longitude={coords.lng} 
                    latitude={coords.lat} 
                    draggable 
                    onDragEnd={handleMarkerDragEnd}
                  >
                    <div className="relative group cursor-grab active:cursor-grabbing">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-900 rounded-full shadow-lg border-2 border-white animate-bounce">
                        <MapPin size={16} className="text-white" />
                      </div>
                    </div>
                  </Marker>
                </Map>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !address.trim() || isSaving}
              className="w-full flex justify-center items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 mt-8"
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Sucursal"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default MerchantBranchCreator;
