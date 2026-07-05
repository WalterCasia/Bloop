import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import ExploreView from './ExploreView';
import PackCard from './PackCard';

/**
 * Contenedor principal que permite alternar entre la vista de Mapa y la vista de Listado.
 */
const ExploreFeed = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si la vista es mapa, ExploreView maneja su propio estado interno.
    // Solo hacemos fetch aquí para la vista de listado.
    if (viewMode !== 'list') return;

    const fetchPacks = async (lat, lng) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/api/packs/explore', {
          params: { lat, lng, radius: 5 } // 5km de radio predeterminado
        });
        if (response.data.status === 'success') {
          setPacks(response.data.data);
        }
      } catch (err) {
        setError('Ocurrió un error al obtener el listado de comercios.');
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchPacks(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback a CDMX si el usuario rechaza permisos
          fetchPacks(19.4326, -99.1332);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      fetchPacks(19.4326, -99.1332);
    }
  }, [viewMode]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      
      {/* Cabecera y Selector de Vistas (Toggle) */}
      <div className="w-full bg-white px-4 pt-6 pb-4 shadow-sm z-20 flex flex-col items-center shrink-0">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-5 tracking-tight">Descubrir</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-full w-full max-w-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-white shadow-md text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Listado
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-200 ${
              viewMode === 'map' 
                ? 'bg-white shadow-md text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mapa
          </button>
        </div>
      </div>

      {/* Contenedor Dinámico */}
      <div className="flex-1 w-full relative">
        {viewMode === 'map' ? (
          <div className="absolute inset-0">
            <ExploreView />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto px-4 py-6">
            <div className="max-w-xl mx-auto pb-20">
              
              {loading && (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500 font-medium text-sm">Buscando packs cercanos...</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100 mb-4">
                  <p className="text-red-600 font-medium text-sm">{error}</p>
                </div>
              )}
              
              {!loading && !error && packs.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No hay packs cerca</h3>
                  <p className="text-gray-500 text-sm">Prueba ampliando tu radio de búsqueda o vuelve más tarde.</p>
                </div>
              )}

              {!loading && !error && packs.map((pack) => (
                <PackCard key={pack.pack_id} pack={pack} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreFeed;
