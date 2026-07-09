import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowLeft } from 'lucide-react';
import apiClient from '../api/apiClient';

export default function ClientFavoritesView() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await apiClient.get('/api/favorites');
      setFavorites(response.data.favorites || []);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (storeId) => {
    setFavorites(prev => prev.filter(f => f.id !== storeId));
    try {
      await apiClient.post('/api/favorites/toggle', { storeId });
    } catch (error) {
      fetchFavorites();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/customer/explore')}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-3xl font-extrabold text-gray-900">Tus Favoritos</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse h-72">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-100 shadow-sm rounded-3xl">
          <Heart size={56} strokeWidth={1.5} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Aún no tienes favoritos</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
            Guarda tus locales preferidos para acceder a sus packs sorpresa más rápido.
          </p>
          <Link
            to="/explore"
            className="bg-black text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg active:scale-95"
          >
            Explorar locales
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((store) => (
            <div key={store.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col group">
              
              <button 
                onClick={() => toggleFavorite(store.id)}
                className="absolute top-6 right-6 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform text-red-500"
              >
                <Heart size={20} className="fill-current" />
              </button>

              <div className="h-48 w-full rounded-xl overflow-hidden mb-4 bg-gray-100 relative">
                <img 
                  src={(store.cover_url && store.cover_url.split(',')[0]) || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&size=400&background=random`} 
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="flex justify-between items-start mb-2 px-1">
                <h3 className="font-bold text-lg text-gray-900 truncate pr-4">{store.name}</h3>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4 px-1">
                <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                <span className="truncate">{store.address || 'Guatemala'}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-100 px-1">
                {Number(store.active_packs_count) > 0 ? (
                  <span className="bg-green-100 text-green-800 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    {store.active_packs_count} packs disponibles
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center">
                    Agotado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
