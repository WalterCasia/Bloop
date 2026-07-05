import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

const CustomerProfile = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: ''
  });
  
  const [stats, setStats] = useState({ total_packs_saved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/customer/profile');
        if (response.data.status === 'success') {
          const profile = response.data.profile;
          setFormData({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            avatar_url: profile.avatar_url || ''
          });
          setStats({
            total_packs_saved: parseInt(profile.total_packs_saved, 10) || 0
          });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al cargar tu perfil.' });
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
    
    if (!formData.full_name) {
      setMessage({ type: 'error', text: 'Tu nombre completo es obligatorio.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      
      await apiClient.put('/api/customer/profile', formData);
      
      setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Hubo un error al guardar los cambios.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-6 sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Configura tu cuenta y revisa tu impacto.</p>
      </div>

      <div className="p-4 max-w-2xl mx-auto mt-4 space-y-6">

        {/* HERO CARD: Packs Salvados */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
              <span className="text-3xl">🌍</span>
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-green-100 mb-1">Impacto Ambiental</h2>
            <div className="text-5xl font-black mb-2">{stats.total_packs_saved}</div>
            <p className="text-sm text-green-50 font-medium">
              {stats.total_packs_saved === 1 ? 'Pack de comida salvado.' : 'Packs de comida salvados.'} 
              <br/>¡Sigue así!
            </p>
          </div>
        </div>
        
        {message && (
          <div className={`p-4 rounded-xl font-bold text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* FORMULARIO DE PERFIL */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo *</label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ej. Ana García"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Número de Teléfono</label>
            <input 
              type="tel" 
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Ej. +502 1234 5678"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">URL Foto de Perfil (Opcional)</label>
            <input 
              type="url" 
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/mifoto.png"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-black text-white text-lg transition-all shadow-lg mt-4 ${
              isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-xl active:scale-[0.98]'
            }`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CustomerProfile;
