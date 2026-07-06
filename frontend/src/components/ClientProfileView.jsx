import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Leaf, 
  CreditCard, 
  Settings, 
  LogOut, 
  Save,
  MapPin,
  ArrowLeft,
  Camera
} from 'lucide-react';

const ClientProfileView = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Estado de Impacto (Simulado para este ejemplo si no hay historial)
  const [impactStats, setImpactStats] = useState({
    packsSaved: 12, // Este valor debería venir del backend
  });

  // Estado del Formulario
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });



  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          fullName: data.full_name || user.user_metadata?.full_name || '',
          phone: data.phone_number || ''
        });
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadAvatar = async (event) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Hubo un error al subir la foto. Verifica que el bucket "avatars" exista en Supabase.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone_number: formData.phone,
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Hubo un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500 animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  const co2Saved = (impactStats.packsSaved * 2.5).toFixed(1);

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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
        </div>
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 overflow-hidden border border-green-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={20} />
          )}
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-6 space-y-8">
        
        {/* Módulo de Impacto Ecológico */}
        <section className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="text-green-600" size={24} />
            <h2 className="text-lg font-bold text-green-900 tracking-tight">Tu Impacto Ecológico</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center text-center">
              <span className="text-3xl font-black text-green-700">{impactStats.packsSaved}</span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Packs Salvados</span>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center text-center">
              <span className="text-3xl font-black text-green-700">{co2Saved}</span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Kg CO2 Evitado</span>
            </div>
          </div>
        </section>

        {/* Formulario Principal */}
        <form onSubmit={handleSaveProfile} className="space-y-8">
          
          {/* Datos Personales */}
          <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Datos Personales</h2>
            </div>
            
            <div className="flex flex-col items-center py-4">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border-2 border-gray-200 shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md cursor-pointer hover:bg-green-700 transition-colors">
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera size={14} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={uploadAvatar} 
                    disabled={uploadingAvatar}
                    className="hidden" 
                  />
                </label>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-3">Cambiar foto de perfil</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  placeholder="Tu nombre"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">El correo está vinculado a tu cuenta y no puede modificarse aquí.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono Celular</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  placeholder="+502 0000-0000"
                />
              </div>
            </div>
          </section>



          {/* Botón Guardar Cambios (Sticky en Desktop o Inline) */}
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
                  ¡Cambios Guardados!
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>

        {/* Métodos de Pago y Cierre de Sesión */}
        <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Métodos de Pago</h2>
            </div>
            {/* Simulación de tarjeta guardada */}
            <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-[10px] text-white font-black italic">VISA</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Visa terminada en 4242</span>
                  <span className="text-xs font-medium text-gray-500">Expira 12/28</span>
                </div>
              </div>
              <button className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
                Eliminar
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button 
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión Segura
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ClientProfileView;
