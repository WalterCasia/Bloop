import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  MapPin,
  Bell,
  Save,
  ArrowLeft
} from 'lucide-react';

const ClientPreferencesView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    defaultZone: 'Antigua Guatemala',
    searchRadius: 5,
    dietaryPreferences: [],
    notifications: {
      stockAlerts: true,
      pickupReminders: true
    }
  });

  const DIETARY_OPTIONS = [
    { id: 'vegetarian', label: 'Vegetariano' },
    { id: 'vegan', label: 'Vegano' },
    { id: 'gluten_free', label: 'Sin Gluten' },
    { id: 'lactose_free', label: 'Sin Lactosa' }
  ];

  const ZONES = [
    'Antigua Guatemala',
    'Zona 10 - Ciudad de Guatemala',
    'Zona 4 - Cuatro Grados Norte',
    'Zona 15',
    'Cayalá'
  ];

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('default_zone, search_radius, dietary_preferences, notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          defaultZone: data.default_zone || 'Antigua Guatemala',
          searchRadius: data.search_radius || 5,
          dietaryPreferences: data.dietary_preferences || [],
          notifications: data.notification_preferences || {
            stockAlerts: true,
            pickupReminders: true
          }
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDietaryPreference = (prefId) => {
    setFormData(prev => {
      const current = prev.dietaryPreferences;
      if (current.includes(prefId)) {
        return { ...prev, dietaryPreferences: current.filter(id => id !== prefId) };
      } else {
        return { ...prev, dietaryPreferences: [...current, prefId] };
      }
    });
  };

  const toggleNotification = (key) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const { error } = await supabase
        .from('profiles')
        .update({
          default_zone: formData.defaultZone,
          search_radius: parseInt(formData.searchRadius),
          dietary_preferences: formData.dietaryPreferences,
          notification_preferences: formData.notifications,
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Hubo un error al guardar las preferencias.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500 animate-pulse">Cargando preferencias...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-24">
      {/* Cabecera Fija */}
      <div className="bg-white px-4 pt-6 pb-4 border-b sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/explore')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Preferencias</h1>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-6 space-y-8">
        
        <form onSubmit={handleSavePreferences} className="space-y-8">
          
          {/* Radar Base y Ubicación */}
          <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Radar de Búsqueda</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Zona Base por Defecto</label>
                <select 
                  name="defaultZone"
                  value={formData.defaultZone}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow appearance-none"
                >
                  {ZONES.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-gray-700">Radio de Búsqueda</label>
                  <span className="text-sm font-black text-green-600">{formData.searchRadius} km</span>
                </div>
                <input 
                  type="range" 
                  name="searchRadius"
                  min="1" 
                  max="25" 
                  value={formData.searchRadius}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                  <span>1 km</span>
                  <span>12 km</span>
                  <span>25 km</span>
                </div>
              </div>
            </div>
          </section>

          {/* Preferencias Dietéticas */}
          <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Filtros Dietéticos Permanentes</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium">El dashboard filtrará el mapa automáticamente basándose en estas opciones.</p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {DIETARY_OPTIONS.map(option => {
                const isActive = formData.dietaryPreferences.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDietaryPreference(option.id)}
                    className={`flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-colors border ${
                      isActive 
                        ? 'bg-green-600 text-white border-green-700 shadow-sm' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Centro de Notificaciones */}
          <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Notificaciones</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Alertas de stock en locales favoritos</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Recibe un aviso cuando publiquen excedentes.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => toggleNotification('stockAlerts')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.notifications.stockAlerts ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.notifications.stockAlerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recordatorios de recogida</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Te avisaremos 30 minutos antes de tu turno.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => toggleNotification('pickupReminders')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.notifications.pickupReminders ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.notifications.pickupReminders ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </section>

          {/* Botón Guardar Cambios */}
          <div className="pt-4 pb-8">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : saveSuccess ? (
                <>
                  <Save size={20} />
                  ¡Preferencias Actualizadas!
                </>
              ) : (
                <>
                  <Save size={20} />
                  Actualizar Preferencias
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientPreferencesView;
