import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStoreContext } from '../../contexts/StoreContext';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { MapPin, Save, Power, PowerOff, Clock, DollarSign, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEFAULT_LAT = 14.6349;
const DEFAULT_LNG = -90.5069;

const MerchantStoreSettings = () => {
  const { activeStore, isLoadingStores, fetchStores } = useStoreContext();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Settings state
  const [isActive, setIsActive] = useState(true);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [salePrice, setSalePrice] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [logoBase64, setLogoBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [viewState, setViewState] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    zoom: 14,
    bearing: 0,
    pitch: 0
  });

  const fetchSettings = useCallback(async () => {
    if (!activeStore) return;
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/api/merchant/settings?storeId=${activeStore.id}`);
      const { store, pack } = res.data.settings;
      
      setIsActive(store.isActive);
      setImagePreview(store.cover_url || null);
      
      const newLat = store.lat || DEFAULT_LAT;
      const newLng = store.lng || DEFAULT_LNG;
      setLat(newLat);
      setLng(newLng);
      setViewState(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
      
      if (pack) {
        setSalePrice(pack.sale_price || '');
        setStartTime(pack.start_time || '');
        setEndTime(pack.end_time || '');
      } else {
        setSalePrice('');
        setStartTime('');
        setEndTime('');
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
    } finally {
      setIsLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleMarkerDragEnd = useCallback((event) => {
    setLng(event.lngLat.lng);
    setLat(event.lngLat.lat);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        setLogoBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      await apiClient.patch('/api/merchant/settings', {
        storeId: activeStore.id,
        isActive,
        lat,
        lng,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        logoBase64
      });
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Ocurrió un error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    const isConfirmed = window.confirm("¿Estás absolutamente seguro de querer eliminar esta sucursal? Esta acción detendrá todas las ventas activas.");
    if (!isConfirmed) return;

    try {
      setIsSaving(true);
      await apiClient.delete(`/api/merchant/stores/${activeStore.id}`);
      
      // Update global context and navigate away
      await fetchStores();
      navigate('/merchant/dashboard', { replace: true });
    } catch (err) {
      console.error("Error deleting store:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al eliminar la sucursal' });
      setIsSaving(false);
    }
  };

  if (isLoadingStores || isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Configuración</h1>
        <p className="text-gray-500 font-medium">Gestiona la disponibilidad, precios y ubicación de <span className="font-bold text-gray-900">{activeStore?.name}</span>.</p>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-medium text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'error' && <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: Operaciones (Toggles y Formulario) */}
        <div className="space-y-6">
          
          {/* Tarjeta de Estado (Activar/Pausar) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-4">Estado Operativo</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {isActive ? <Power size={20} /> : <PowerOff size={20} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{isActive ? 'Sucursal Activa' : 'Sucursal Pausada'}</p>
                  <p className="text-sm text-gray-500 font-medium">{isActive ? 'Recibiendo reservas normales.' : 'Oculta temporalmente para clientes.'}</p>
                </div>
              </div>
              
              {/* iOS Style Toggle */}
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>

          {/* Tarjeta de Horarios y Precios (Pack Activo) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-1">Ajustes del Pack de Hoy</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Estos cambios aplicarán inmediatamente al pack activo.</p>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Clock size={16} className="text-gray-400" /> Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Clock size={16} className="text-gray-400" /> Hora Fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <DollarSign size={16} className="text-gray-400" /> Precio del Pack (Q)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">Q</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="Ej. 25.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Tarjeta de Logotipo */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-1">Logo de la Sucursal</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Actualiza el logo que verán tus clientes.</p>
            
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                Cambiar Imagen
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-black text-white rounded-2xl py-4 font-black text-lg flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={20} /> Guardar Cambios
              </>
            )}
          </button>

          {/* ZONA DE PELIGRO */}
          <div className="mt-8 pt-6 border-t border-red-100">
            <h3 className="text-sm font-black text-red-600 mb-2 uppercase tracking-wide">Zona de Peligro</h3>
            <p className="text-xs text-gray-500 font-medium mb-4">Eliminar esta sucursal detendrá inmediatamente cualquier venta en curso y la removerá de tu panel. El historial de compras de tus clientes se mantendrá intacto.</p>
            <button
              type="button"
              onClick={handleDeleteStore}
              disabled={isSaving}
              className="w-full bg-red-50 text-red-600 border border-red-200 rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} /> Eliminar Sucursal
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: Mapa Mapbox */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col h-[600px] lg:h-auto">
          <h3 className="text-lg font-black text-gray-900 mb-1">Ubicación Física</h3>
          <p className="text-sm text-gray-500 font-medium mb-4">Arrastra la chincheta para corregir las coordenadas exactas de tu local.</p>
          
          <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 relative">
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <NavigationControl position="bottom-right" />
              <Marker
                longitude={lng}
                latitude={lat}
                draggable
                onDragEnd={handleMarkerDragEnd}
                anchor="bottom"
              >
                <div className="relative group cursor-grab active:cursor-grabbing">
                  <MapPin size={40} className="text-red-500 drop-shadow-md relative z-10" fill="#fee2e2" />
                  <div className="absolute -bottom-2 -left-2 w-14 h-4 bg-black/20 blur-sm rounded-[100%]"></div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Mover Pin
                  </div>
                </div>
              </Marker>
            </Map>
          </div>
        </div>

      </form>
    </div>
  );
};

export default MerchantStoreSettings;
