import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix para el ícono por defecto de Leaflet en React
import iconMarkerUrl from 'leaflet/dist/images/marker-icon.png';
import iconMarkerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl: iconMarkerUrl,
  shadowUrl: iconMarkerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Componente hijo para manejar clicks en el mapa
const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
};

const MerchantProfile = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    description: '',
    avatar_url: '',
    cover_url: ''
  });
  
  const [position, setPosition] = useState(null); // {lat, lng}
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/merchant/profile');
        if (response.data.status === 'success') {
          const profile = response.data.profile;
          setFormData({
            store_name: profile.store_name || '',
            address: profile.address || '',
            description: profile.description || '',
            avatar_url: profile.avatar_url || '',
            cover_url: profile.cover_url || ''
          });
          
          if (profile.lat && profile.lng) {
            setPosition({ lat: profile.lat, lng: profile.lng });
          } else {
            // Posición por defecto si es su primera vez (Ej: Ciudad de Guatemala)
            setPosition({ lat: 14.6349, lng: -90.5069 });
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al cargar tu perfil actual.' });
        // Posición por defecto en caso de error
        setPosition({ lat: 14.6349, lng: -90.5069 });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.store_name || !formData.address || !position) {
      setMessage({ type: 'error', text: 'El nombre, dirección y ubicación en el mapa son obligatorios.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      
      const payload = {
        ...formData,
        lat: position.lat,
        lng: position.lng
      };

      await apiClient.put('/api/merchant/profile', payload);
      
      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      
      // Auto-ocultar mensaje de éxito
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Hubo un error al guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-6 sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Perfil del Local</h1>
        <p className="text-sm text-gray-500 mt-1">Configura cómo te ven los clientes en el mapa.</p>
      </div>

      <div className="p-4 max-w-2xl mx-auto mt-4">
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Local *</label>
            <input 
              type="text" 
              name="store_name"
              value={formData.store_name}
              onChange={handleChange}
              placeholder="Ej. Panadería El Rosal"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Dirección Física *</label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej. 5ta Avenida 12-34, Zona 1"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Descripción Corta</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="¿Qué tipo de comida rescatan los usuarios aquí?"
              rows="3"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación en el Mapa *</label>
            <p className="text-xs text-gray-500 mb-3">Toca el mapa para colocar el pin en la ubicación exacta de tu local.</p>
            
            <div className="h-64 rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
              {position && (
                <MapContainer center={[position.lat, position.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">carto.com</a>'
                  />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
              )}
            </div>
            {position && (
              <p className="text-[10px] text-gray-400 mt-2 text-right">
                Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">URL del Logo (Opcional)</label>
            <input 
              type="url" 
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-black text-white text-lg transition-all shadow-lg ${
              isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]'
            }`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MerchantProfile;
