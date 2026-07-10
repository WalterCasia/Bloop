import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useStoreContext } from '../contexts/StoreContext';
import { Package, Clock, Calendar, Info, Image as ImageIcon, CheckCircle, AlertCircle, X, UploadCloud, Tag } from 'lucide-react';

const SurprisePackTemplateEditor = () => {
  const { activeStore } = useStoreContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  const editMode = location.state?.editMode || false;
  const initialPackData = location.state?.packData || null;

  const parseTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Para asegurar que estamos en hora local o ajustar según se necesite
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).substring(0, 5);
  };
  
  const parseDate = (isoString) => {
    if (!isoString) return new Date().toISOString().split('T')[0];
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: initialPackData?.title || '',
    category: '',
    description: '',
    instructions: '',
    originalPrice: initialPackData?.original_price || '',
    pickupDate: parseDate(initialPackData?.pickup_start_time),
    startTime: parseTime(initialPackData?.pickup_start_time),
    endTime: parseTime(initialPackData?.pickup_end_time)
  });

  const [discountRate, setDiscountRate] = useState(
    initialPackData 
      ? Math.round(100 - (initialPackData.discounted_price / initialPackData.original_price) * 100) 
      : 66
  );
  const [salePrice, setSalePrice] = useState(initialPackData?.discounted_price || '0.00');
  const [timeError, setTimeError] = useState('');
  
  // Si la url ya viene desde db y es string puro no base64, lo agregamos también
  const [imagesPreview, setImagesPreview] = useState(initialPackData?.image_url ? [initialPackData.image_url] : []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efecto de Anclaje Financiero Automático
  useEffect(() => {
    const original = parseFloat(formData.originalPrice);
    if (!isNaN(original) && original > 0) {
      const calculatedSalePrice = original * (1 - discountRate / 100);
      setSalePrice(calculatedSalePrice.toFixed(2));
    } else {
      setSalePrice('0.00');
    }
  }, [formData.originalPrice, discountRate]);

  // Efecto de Validación Estricta de Horarios
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        setTimeError('La recogida terminará al día siguiente (cruza la medianoche).');
      } else {
        setTimeError('');
      }
    }
  }, [formData.startTime, formData.endTime]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDiscountChange = (e) => {
    setDiscountRate(parseInt(e.target.value, 10));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if total exceeds 3
    if (imagesPreview.length + files.length > 3) {
      alert('Solo puedes subir un máximo de 3 imágenes.');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`La imagen ${file.name} pesa más de 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagesPreview(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setImagesPreview(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imagesPreview.length === 0) {
      alert('Debes subir al menos 1 imagen.');
      return;
    }
    if (isSubmitting) return;
    
    const payload = {
      title: formData.title,
      originalPrice: parseFloat(formData.originalPrice),
      salePrice: parseFloat(salePrice),
      pickupDate: formData.pickupDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      imagesBase64: imagesPreview,
      storeId: activeStore?.id
    };
    
    setIsSubmitting(true);
    try {
      if (editMode) {
        // En edición, filtramos las imágenes que ya son URLs (no base64) para no re-subir
        const base64Images = imagesPreview.filter(img => img.startsWith('data:image'));
        const payloadEdit = {
          ...payload,
          imagesBase64: base64Images
        };
        const response = await apiClient.put(`/api/merchant/packs/${initialPackData.id}`, payloadEdit);
        if (response.data.status === 'success') {
          alert('Pack actualizado correctamente.');
          navigate(-1);
        }
      } else {
        const response = await apiClient.post('/api/merchant/packs/template', payload);
        if (response.data.status === 'success') {
          alert('Pack configurado correctamente. Redirigiendo a tu inventario...');
          navigate('/merchant/daily-stock');
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar el pack. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Encabezado fijo superior */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-900 mb-1 transition-colors"
          >
            <X size={24} />
          </button>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {editMode ? 'Editar Pack Sorpresa' : 'Crea tu Pack Sorpresa'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {editMode ? 'Modifica los detalles de este pack.' : 'Completa los datos para publicarlo en la app.'}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || timeError}
          className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95"
        >
          {isSubmitting ? 'Guardando...' : (editMode ? 'Guardar Cambios' : 'Publicar Pack')}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECCIÓN 1: Detalles Básicos */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Info className="text-gray-400" size={20} />
              Detalles del Pack
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ej. Pack de Bollería y Pan"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                >
                  <option value="" disabled>Seleccionar...</option>
                  <option value="panaderia">Panadería</option>
                  <option value="comida_preparada">Comida Preparada</option>
                  <option value="abarrotes">Abarrotes y Fruta</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción del contenido (Ejemplos)</label>
                <textarea
                  name="description"
                  required
                  rows="2"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ej. Puede contener pan dulce, croissants del día anterior o tartas."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Imágenes */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="text-gray-400" size={20} />
                Fotografías del Pack
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {imagesPreview.length} / 3 Máx
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagesPreview.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}

              {imagesPreview.length < 3 && (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 font-semibold">Subir Foto</p>
                    <p className="text-[10px] text-gray-400 mt-1">PNG o JPG</p>
                  </div>
                  <input type="file" className="hidden" accept="image/png, image/jpeg" multiple onChange={handleImageChange} />
                </label>
              )}
            </div>
          </section>

          {/* SECCIÓN 3: Financiero */}
          <section className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-sm border border-blue-100 p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 border-b border-blue-200/50 pb-4">
              <Tag className="text-blue-500" size={20} />
              Modelo Financiero
            </h3>
            
            <p className="text-sm text-blue-700 mb-6 font-medium bg-blue-100/50 p-3 rounded-lg flex items-start gap-2">
              <Info className="shrink-0 mt-0.5 text-blue-500" size={16} />
              Nuestra política exige un descuento mínimo del 66% para garantizar la venta rápida y evitar el desperdicio.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Valor Original (Q)</label>
                <input
                  type="number"
                  name="originalPrice"
                  required
                  min="1"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="60.00"
                  className="w-full text-3xl font-black text-gray-900 border-none focus:ring-0 p-0 placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col items-center px-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Descuento Ofrecido</label>
                <input 
                  type="range" 
                  min="66" 
                  max="70" 
                  step="1" 
                  value={discountRate} 
                  onChange={handleDiscountChange}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="mt-3 text-2xl font-black text-blue-600">{discountRate}% OFF</span>
              </div>

              <div className="bg-gray-900 p-5 rounded-xl shadow-md border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <CheckCircle size={48} />
                </div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 relative z-10">Precio al Público (Q)</label>
                <div className="text-4xl font-black text-green-400 relative z-10">
                  {salePrice}
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 4: Logística */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Calendar className="text-gray-400" size={20} />
              Ventana de Recogida
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="pickupDate"
                  required
                  value={formData.pickupDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de Inicio</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="time"
                    name="startTime"
                    required
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Límite</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="time"
                    name="endTime"
                    required
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {timeError && (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                {timeError}
              </div>
            )}
            
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Instrucciones Operativas para el Cliente</label>
              <input
                type="text"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Ej. Traer bolsa propia. Entrar por la puerta lateral."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </section>

          {/* Acciones */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={!formData.originalPrice || isSubmitting}
              className="px-8 py-3.5 bg-blue-600 text-white text-base font-bold rounded-xl hover:bg-blue-700 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando Pack...
                </>
              ) : (
                'Programar y Guardar Pack'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SurprisePackTemplateEditor;
