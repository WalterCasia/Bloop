import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Filter, Map as MapIcon, List, AlertCircle } from 'lucide-react';
import apiClient from '../api/apiClient';
import SurprisePackCard from './SurprisePackCard';
import MapPricePill from './MapPricePills';
import ClientTopNav from './ClientTopNav';
import { useNavigate, useSearchParams } from 'react-router-dom';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Guatemala City por defecto
const DEFAULT_LAT = 14.6349;
const DEFAULT_LNG = -90.5069;
const DEFAULT_ZOOM = 13;

const ClientExploreDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  
  // Estado de Vista Móvil (Lista vs Mapa)
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  
  // Estado del Mapa
  const [viewState, setViewState] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    zoom: DEFAULT_ZOOM,
    bearing: 0,
    pitch: 0
  });

  // Estado de Datos
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredStoreId, setHoveredStoreId] = useState(null);
  
  // Ref para hacer scroll a la tarjeta
  const cardRefs = useRef({});
  const debounceTimer = useRef(null);

  // Obtener la ubicación del usuario si está permitida (al inicio)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          fetchPacks(position.coords.latitude, position.coords.longitude, 5);
        },
        () => {
          // Si falla, usar default
          fetchPacks(DEFAULT_LAT, DEFAULT_LNG, 5);
        },
        { timeout: 5000 }
      );
    } else {
      fetchPacks(DEFAULT_LAT, DEFAULT_LNG, 5);
    }

    if (searchParams.get('canceled') === 'true') {
      setShowCancelAlert(true);
      // Limpiar URL
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
      
      setTimeout(() => setShowCancelAlert(false), 5000);
    }
  }, []);

  // Fetch a la API con Debounce
  const fetchPacks = async (lat, lng, radius = 5) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/api/packs/explore?lat=${lat}&lng=${lng}&radius=${radius}`);
      
      if (response.data.status === 'success') {
        setPacks(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar las ofertas de la zona.');
    } finally {
      setLoading(false);
    }
  };

  const onMapMove = (evt) => {
    setViewState(evt.viewState);
  };

  const onMapMoveEnd = (evt) => {
    // Evitar múltiples llamadas al mover rápido
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      fetchPacks(evt.viewState.latitude, evt.viewState.longitude, 5);
    }, 800); // 800ms de debounce
  };

  const handleMarkerClick = (pack) => {
    // Si estamos en móvil, pasamos a vista de lista
    if (window.innerWidth < 1024) {
      setViewMode('list');
    }
    
    // Smooth scroll a la tarjeta
    setTimeout(() => {
      const cardElement = cardRefs.current[pack.pack_id];
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Validación Crítica de Mapbox Token
  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Falta Configuración de Mapa</h2>
          <p className="text-gray-600">Por favor configura VITE_MAPBOX_TOKEN en tu archivo .env para ver el mapa de exploración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen w-full overflow-hidden bg-white relative">
      <ClientTopNav 
        activeLocationMode="GPS"
        selectedZone="Antigua Guatemala"
        selectedRadius={5}
        activeFilter="Todos"
        pendingOrdersCount={0}
      />
      
      {showCancelAlert && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <AlertCircle size={20} className="text-amber-500" />
          <span className="font-bold">Pago cancelado. El pack no fue reservado.</span>
          <button onClick={() => setShowCancelAlert(false)} className="ml-2 font-bold text-amber-900">&times;</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* =========================================
            PANEL IZQUIERDO: LISTA DE OFERTAS (55%)
            ========================================= */}
        <div 
          className={`w-full lg:w-[55%] h-full flex-col bg-gray-50 flex ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}
        >
        {/* Contenedor con Scroll para las Tarjetas */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 relative">
          
          {loading && packs.length === 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-2xl h-[320px]"></div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="text-gray-900 font-bold">{error}</p>
            </div>
          ) : packs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MapIcon size={48} className="text-gray-300 mb-4" />
              <p className="font-bold text-gray-900 text-lg">No hay ofertas aquí</p>
              <p className="mt-1">Intenta mover el mapa o reducir el zoom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {packs.map((pack) => (
                <div 
                  key={pack.pack_id} 
                  ref={el => cardRefs.current[pack.pack_id] = el}
                >
                  <SurprisePackCard 
                    pack={pack}
                    isHovered={hoveredStoreId === pack.store_id}
                    onMouseEnter={() => setHoveredStoreId(pack.store_id)}
                    onMouseLeave={() => setHoveredStoreId(null)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          PANEL DERECHO: MAPA INTERACTIVO (45%)
          ========================================= */}
      <div 
        className={`w-full lg:w-[45%] h-full sticky top-0 bg-gray-200 ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}
      >
        <Map
          {...viewState}
          onMove={onMapMove}
          onMoveEnd={onMapMoveEnd}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {packs.map((pack) => (
            <MapPricePill 
              key={pack.pack_id}
              pack={pack}
              isHovered={hoveredStoreId === pack.store_id}
              onClick={() => handleMarkerClick(pack)}
            />
          ))}

          {/* Controles Nativos de Mapbox */}
          <NavigationControl position="bottom-right" />
          <GeolocateControl position="bottom-right" />
        </Map>

        {/* Indicador de Carga sobre el Mapa */}
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-900">Buscando en esta zona...</span>
          </div>
        )}
      </div>
    </div>

    {/* =========================================
        FAB FLOTANTE PARA MÓVILES (Toggle)
        ========================================= */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-50">
        <button 
          onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
          className="bg-gray-900 text-white font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-black transition-transform active:scale-95"
        >
          {viewMode === 'list' ? (
             <>
               <MapIcon size={18} />
               Ver Mapa
             </>
          ) : (
             <>
               <List size={18} />
               Ver Lista
             </>
          )}
        </button>
      </div>

    </div>
  );
};

export default ClientExploreDashboard;
