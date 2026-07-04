import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../api/apiClient';
import 'leaflet/dist/leaflet.css';

/**
 * Función para generar iconos dinámicos usando HTML y CSS
 * Verde: Más de 2 unidades (Stock Seguro)
 * Naranja: 2 o menos unidades (Últimas Unidades)
 */
const createCustomIcon = (stock) => {
  const color = stock > 2 ? '#22c55e' : '#f97316'; 
  
  return L.divIcon({
    className: 'custom-pin',
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`
  });
};

/**
 * Componente inyectado para recentrar el mapa dinámicamente
 * cuando la API del navegador resuelve las coordenadas del usuario.
 */
const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const MapExplorer = () => {
  const [location, setLocation] = useState(null);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Solicitar permisos de GPS al navegador de forma estricta
    if (!navigator.geolocation) {
      setError('La geolocalización no es soportada por tu navegador actual.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        setError('Es obligatorio permitir el acceso a la ubicación GPS para localizar los packs cercanos.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    // 2. Consumir el endpoint optimizado de PostGIS al resolver la ubicación
    const fetchPacks = async () => {
      if (!location) return;
      
      setLoading(true);
      try {
        const response = await apiClient.get('/api/packs/explore', {
          params: {
            lat: location.lat,
            lng: location.lng,
            radius: 5 // Búsqueda configurada a 5 kilómetros de radio
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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <p style={{ color: '#ef4444', fontWeight: 'bold' }}>{error}</p>
      </div>
    );
  }

  // Coordenadas neutrales predeterminadas mientras se resuelven los permisos GPS
  const defaultCenter = [40.4168, -3.7038]; 
  const currentCenter = location ? [location.lat, location.lng] : defaultCenter;

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }}>
          <p style={{ color: '#374151', fontWeight: 'bold' }}>Rastreando inventario en tiempo real...</p>
        </div>
      )}

      {/* Renderizado del motor de mapa interactivo */}
      <MapContainer center={currentCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {location && <ChangeView center={currentCenter} />}

        {packs.map((pack) => (
          <Marker 
            key={pack.pack_id} 
            position={[pack.location_lat, pack.location_lng]} 
            icon={createCustomIcon(pack.available_quantity)}
          >
            <Popup>
              <div style={{ padding: '4px', maxWidth: '200px' }}>
                <img 
                  src={pack.image_url || pack.cover_url} 
                  alt={pack.store_name} 
                  style={{ height: '96px', width: '100%', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} 
                />
                <h3 style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{pack.store_name}</h3>
                <p style={{ margin: '2px 0', fontSize: '14px', color: '#4B5563' }}>{pack.title}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>${pack.discounted_price}</span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'line-through' }}>${pack.original_price}</span>
                </div>
                
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#6B7280' }}>
                  Stock Disponible: <strong style={{ color: pack.available_quantity > 2 ? '#16a34a' : '#ea580c' }}>{pack.available_quantity}</strong>
                </p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#6B7280' }}>
                  A {Number(pack.distance_km).toFixed(1)} km de distancia
                </p>

                <button style={{ 
                  marginTop: '12px', width: '100%', backgroundColor: '#2563EB', color: 'white', 
                  padding: '6px 0', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' 
                }}>
                  Reservar Pack
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapExplorer;
