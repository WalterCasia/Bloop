import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Filter, Map as MapIcon, List, AlertCircle, Maximize, Minimize, X } from 'lucide-react';
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
  
  // Estados para ClientTopNav
  const [activeLocationMode, setActiveLocationMode] = useState('GPS');
  const [selectedZone, setSelectedZone] = useState('Antigua Guatemala');
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [activeFilter, setActiveFilter] = useState('Todos');
  
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
  const [hoveredPackId, setHoveredPackId] = useState(null);
  
  // Estados de Fullscreen y Store Seleccionado
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  
  // Ref para hacer scroll a la tarjeta y mapa
  const cardRefs = useRef({});
  const mapRef = useRef(null);
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

  // Coordenadas de las zonas predefinidas
  const ZONES = {
    'Antigua Guatemala': { lat: 14.5586, lng: -90.7332 },
    'Zona 10 - Ciudad de Guatemala': { lat: 14.6038, lng: -90.5132 },
    'Zona 4 - Cuatro Grados Norte': { lat: 14.6231, lng: -90.5161 },
    'Zona 15': { lat: 14.5888, lng: -90.4851 },
    'Cayalá': { lat: 14.6133, lng: -90.4883 }
  };

  const handleZoneChange = (zone) => {
    setActiveLocationMode('ZONE');
    setSelectedZone(zone);
    const coords = ZONES[zone];
    if (coords) {
      setViewState(prev => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng,
        zoom: 14
      }));
      fetchPacks(coords.lat, coords.lng, selectedRadius);
    }
  };

  const handleLocationChange = () => {
    setActiveLocationMode('GPS');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setViewState(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          zoom: 14
        }));
        fetchPacks(pos.coords.latitude, pos.coords.longitude, selectedRadius);
      });
    }
  };

  const handleRadiusChange = (radius) => {
    setSelectedRadius(radius);
    fetchPacks(viewState.latitude, viewState.longitude, radius);
  };

  // Filtrar localmente los packs en base a activeFilter
  const filteredPacks = packs.filter(pack => {
    if (activeFilter === 'Todos') return true;
    
    // Fechas de referencia para cálculos (Hoy y Mañana a medianoche local)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const pickupStart = new Date(pack.pickup_start_time);
    
    // Filtros de Tiempo
    if (activeFilter === 'Recogida Hoy') {
      return pickupStart >= today && pickupStart < tomorrow;
    }
    if (activeFilter === 'Recogida Mañana') {
      return pickupStart >= tomorrow && pickupStart < dayAfterTomorrow;
    }

    // Búsqueda Inteligente Extendida (Título + Nombre de Tienda + Descripción)
    const searchableText = `${pack.title || ''} ${pack.store_name || ''} ${pack.description || ''}`.toLowerCase();
    
    if (activeFilter === 'Panadería y Pastelería') {
      return searchableText.includes('pan') || 
             searchableText.includes('pastel') || 
             searchableText.includes('dulce') ||
             searchableText.includes('repostería') ||
             searchableText.includes('bakery') ||
             searchableText.includes('postre') ||
             searchableText.includes('tart');
    }
    
    if (activeFilter === 'Restaurantes') {
      return searchableText.includes('menú') || 
             searchableText.includes('almuerzo') || 
             searchableText.includes('cena') ||
             searchableText.includes('restaurante') ||
             searchableText.includes('comida') ||
             searchableText.includes('bistro') ||
             searchableText.includes('café');
    }
    
    if (activeFilter === 'Supermercados') {
      return searchableText.includes('despensa') || 
             searchableText.includes('super') || 
             searchableText.includes('abarrote') ||
             searchableText.includes('mercado') ||
             searchableText.includes('market');
    }
    
    if (activeFilter === 'Vegano/Vegetariano') {
      return searchableText.includes('vegan') || 
             searchableText.includes('vegetariano') ||
             searchableText.includes('plant') ||
             searchableText.includes('veggie') ||
             searchableText.includes('saludable');
    }
    
    return true; 
  });

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
    setSelectedStore(pack);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [pack.location_lng || -90.5069, pack.location_lat || 14.6349],
        zoom: 15,
        duration: 800
      });
    }
    // Mantener scroll si no está en fullscreen
    if (!isFullScreen) {
      const el = cardRefs.current[pack.pack_id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    setHoveredPackId(pack.pack_id);
  };

  // Forzar redimensionamiento del mapa al cambiar a pantalla completa
  useEffect(() => {
    if (mapRef.current) {
      // Pequeño delay para permitir que el DOM cambie su tamaño primero
      setTimeout(() => mapRef.current.resize(), 50);
      setTimeout(() => mapRef.current.resize(), 300); // Y otro para animaciones de layout
    }
  }, [isFullScreen]);

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
    <div className="flex flex-col h-screen md:h-[calc(100vh-80px)] w-full overflow-hidden bg-white relative">
      <ClientTopNav 
        activeLocationMode={activeLocationMode}
        selectedZone={selectedZone}
        selectedRadius={selectedRadius}
        activeFilter={activeFilter}
        pendingOrdersCount={0}
        onLocationChange={handleLocationChange}
        onZoneChange={handleZoneChange}
        onRadiusChange={handleRadiusChange}
        onFilterChange={setActiveFilter}
        onSearch={() => fetchPacks(viewState.latitude, viewState.longitude, selectedRadius)}
      />
      
      {showCancelAlert && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <AlertCircle size={20} className="text-amber-500" />
          <span className="font-bold">Pago cancelado. El pack no fue reservado.</span>
          <button onClick={() => setShowCancelAlert(false)} className="ml-2 font-bold text-amber-900">&times;</button>
        </div>
      )}

      {/* =========================================
          CONTENEDOR GLOBAL DEL DASHBOARD (Layout 2 Columnas)
          ========================================= */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* =========================================
            COLUMNA IZQUIERDA: FEED DE LISTADO (55%)
            ========================================= */}
        <div 
          className={`w-full lg:w-[55%] overflow-y-auto px-6 py-4 ${viewMode === 'map' ? 'hidden lg:block' : 'block'} ${isFullScreen ? '!hidden' : ''}`}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-semibold text-gray-500 animate-pulse">Buscando comida cerca de ti...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
              <p className="text-red-700 font-medium">{error}</p>
              <button 
                onClick={() => fetchPacks(viewState.latitude, viewState.longitude, selectedRadius)} 
                className="mt-4 bg-white px-4 py-2 rounded-full text-sm font-bold text-red-600 border border-red-200 shadow-sm"
              >
                Reintentar
              </button>
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center pt-10">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No hay packs disponibles</h3>
              <p className="text-gray-500 text-sm max-w-[250px]">No encontramos opciones con los filtros actuales en esta zona.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24 lg:pb-6">
              {filteredPacks.map(pack => (
                <div 
                  key={pack.pack_id} 
                  ref={el => cardRefs.current[pack.pack_id] = el}
                >
                  <SurprisePackCard 
                    pack={pack}
                    isHovered={hoveredPackId === pack.pack_id}
                    onMouseEnter={() => setHoveredPackId(pack.pack_id)}
                    onMouseLeave={() => setHoveredPackId(null)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================
            COLUMNA DERECHA: CONTENEDOR STICKY EN RECUADRO (45%)
            ========================================= */}
        <div 
          className={
            isFullScreen 
              ? "w-full h-full sticky top-0 p-4" 
              : `hidden lg:block lg:w-[45%] h-full sticky top-0 p-4 pl-0 ${viewMode === 'list' ? 'hidden lg:block' : 'block w-full'}`
          }
        >
          {/* El Recuadro del Mapa (Tarjeta Flotante estilo Airbnb) */}
          <div className={`w-full h-full relative bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 shadow-inner`}>
            
            {/* Botón de Expansión Flotante */}
            <div className="absolute top-4 left-4 z-10 hidden lg:block">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="bg-white shadow-md border border-gray-200 p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 flex items-center justify-center"
              >
                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>

            <Map
              ref={mapRef}
              {...viewState}
              onMove={onMapMove}
              onMoveEnd={onMapMoveEnd}
              mapStyle="mapbox://styles/mapbox/light-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              {filteredPacks.map(pack => (
                <MapPricePill 
                  key={pack.pack_id} 
                  pack={pack} 
                  isHovered={hoveredPackId === pack.pack_id}
                  onClick={handleMarkerClick}
                />
              ))}

              {/* Controles Nativos de Mapbox encapsulados para márgenes */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <NavigationControl position="top-right" showCompass={false} style={{ margin: 0, position: 'relative' }} />
                <GeolocateControl position="top-right" style={{ margin: 0, position: 'relative' }} />
              </div>
            </Map>

            {/* Tarjeta Flotante (Slide-up Card) estilo Airbnb */}
            {selectedStore && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-0 z-20 transition-all duration-300">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedStore(null); }}
                  className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full p-1 hover:bg-gray-100 z-10 transition-colors"
                >
                  <X size={18} className="text-gray-700" />
                </button>
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/packs/${selectedStore.pack_id}`, { state: { pack: selectedStore } })}
                >
                  <div className="h-32 bg-gray-200 w-full relative">
                    <img 
                      src={selectedStore.image_url || selectedStore.cover_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'} 
                      alt={selectedStore.store_name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 bg-white px-2 py-1 rounded-lg shadow font-bold text-gray-900 text-sm">
                      {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(selectedStore.discounted_price)}
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <h4 className="font-bold text-gray-900 truncate">{selectedStore.store_name}</h4>
                    <p className="text-sm text-gray-600 truncate">{selectedStore.title}</p>
                    <p className="text-xs text-gray-400 mt-1">A {selectedStore.distance_km ? Number(selectedStore.distance_km).toFixed(1) : '2.5'} km de ti</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sincronización Visual y Estados de Carga dentro del Recuadro */}
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl pointer-events-none">
                <div className="bg-white/90 px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-bold text-gray-900 tracking-tight">Cargando zona...</span>
                </div>
              </div>
            )}
          </div>
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
