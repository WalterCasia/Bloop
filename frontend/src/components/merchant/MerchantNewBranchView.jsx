import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import apiClient from '../../api/apiClient';
import { useStoreContext } from '../../contexts/StoreContext';
import { Building2, MapPin, ArrowLeft, Loader2, Save } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MerchantNewBranchView = () => {
  const navigate = useNavigate();
  const { fetchStores } = useStoreContext();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lng: -99.1332, lat: 19.4326 }); // Default CDMX
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewState, setViewState] = useState({
    longitude: -99.1332,
    latitude: 19.4326,
    zoom: 13
  });

  const handleMarkerDragEnd = (event) => {
    setCoords({ lng: event.lngLat.lng, lat: event.lngLat.lat });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || name.length < 2) {
      setError('El nombre de la sucursal es muy corto.');
      return;
    }
    if (!address || address.length < 5) {
      setError('Proporciona una dirección válida.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await apiClient.post('/api/merchant/stores', {
        name,
        address,
        lng: coords.lng,
        lat: coords.lat
      });

      // Refrescar el contexto global de sucursales
      await fetchStores();
      
      // Regresar al dashboard
      navigate('/merchant/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la sucursal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 flex flex-col">
      {/* Encabezado Principal */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="text-green-600" size={24} />
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Añadir Nueva Sucursal</h1>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!name || !address || isSaving}
          className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Crear Sucursal
        </button>
      </header>

      {/* Contenedor Principal (Grid) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Panel Izquierdo: Formulario */}
        <div className="w-full md:w-[400px] lg:w-[500px] p-6 overflow-y-auto bg-white border-r border-gray-200 flex flex-col">
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Datos de la Sucursal</h2>
            <p className="text-sm text-gray-500">
              Ingresa el nombre público y la dirección operativa de tu nuevo punto de venta.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {error}
            </div>
          )}

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Local</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-medium transition-all"
                placeholder="Ej. Panadería Central - Sede Norte"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Dirección Física</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-medium transition-all resize-none"
                placeholder="Ingresa la calle, número, colonia..."
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex gap-3">
                <MapPin className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Geolocalización Requerida</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Arrastra el marcador azul en el mapa de la derecha (o abajo en móvil) hasta ubicar exactamente la entrada principal de tu local.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón Guardar en Móvil */}
          <button
            onClick={handleSave}
            disabled={!name || !address || isSaving}
            className="md:hidden mt-6 w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 shadow-lg"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Crear Sucursal
          </button>
        </div>

        {/* Panel Derecho: Mapa */}
        <div className="flex-1 h-[400px] md:h-auto relative bg-gray-200">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
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
                <div className="absolute -top-10 -left-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  Arrastra el pin al local
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full shadow-lg border-2 border-white animate-bounce">
                  <MapPin size={18} className="text-white" />
                </div>
              </div>
            </Marker>
          </Map>

          {/* Overlay de instrucciones flotante en el mapa */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-100 pointer-events-none">
            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Mantén pulsado y arrastra para ajustar
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MerchantNewBranchView;
