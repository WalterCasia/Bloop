import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

/**
 * SurprisePackTemplateEditor
 * Componente B2B para crear plantillas de "Packs Sorpresa"
 * Incluye anclaje financiero automático y validación de ventanas de recogida.
 */
const SurprisePackTemplateEditor = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    instructions: '',
    originalPrice: '',
    startTime: '',
    endTime: ''
  });

  const [discountRate, setDiscountRate] = useState(66);
  const [salePrice, setSalePrice] = useState('0.00');
  const [timeError, setTimeError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Efecto de Anclaje Financiero Automático
  useEffect(() => {
    const original = parseFloat(formData.originalPrice);
    if (!isNaN(original) && original > 0) {
      // Calculamos el precio de venta bloqueado
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
        setTimeError('Aviso: La recogida cruzará la medianoche y terminará al día siguiente.');
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
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('La imagen no puede pesar más de 5MB');
        return;
      }
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timeError || isSubmitting) return;
    
    const payload = {
      title: formData.title,
      // category, description, instructions are currently not stored in DB, but we send them just in case
      originalPrice: parseFloat(formData.originalPrice),
      salePrice: parseFloat(salePrice),
      startTime: formData.startTime,
      endTime: formData.endTime,
      imageBase64: imagePreview // Send base64 directly
    };
    
    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/merchant/packs/template', payload);
      if (response.data.status === 'success') {
        alert('Plantilla guardada correctamente en el sistema. Redirigiendo a tu inventario...');
        navigate('/merchant/daily-stock');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar el pack. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        
        {/* Cabecera del Editor */}
        <div className="bg-gray-900 px-6 py-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Editor de Plantilla: Pack Sorpresa</h2>
          <p className="text-gray-400 text-sm mt-1">Configura las reglas de tu inventario diario de rescate de alimentos.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* SECCIÓN 1: Información General */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              1. Identidad del Pack
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ej. Pack Sorpresa de Bollería"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Instrucciones Operativas para el Cliente</label>
                <input
                  type="text"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  placeholder="Ej. Traer bolsa propia. Entrar por la puerta lateral."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fotografía del Producto (Obligatorio)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                      <p className="text-xs text-gray-500">PNG o JPG (MAX. 5MB)</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageChange} required />
                </label>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Anclaje Financiero */}
          <section className="bg-blue-50 rounded-lg p-5 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
              2. Modelo Financiero y Descuentos
            </h3>
            <p className="text-sm text-blue-700 mb-5">
              Nuestra política exige un descuento mínimo del 66% para garantizar la venta rápida y evitar el desperdicio.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Valor Original */}
              <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Original (Q)</label>
                <input
                  type="number"
                  name="originalPrice"
                  required
                  min="1"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="Ej. 60.00"
                  className="w-full text-2xl font-black text-gray-900 border-none focus:ring-0 p-0"
                />
              </div>

              {/* Selector de Descuento */}
              <div className="flex flex-col items-center">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descuento Ofrecido</label>
                <input 
                  type="range" 
                  min="66" 
                  max="70" 
                  step="1" 
                  value={discountRate} 
                  onChange={handleDiscountChange}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="mt-2 text-xl font-black text-blue-600">{discountRate}% OFF</span>
              </div>

              {/* Precio de Venta Bloqueado */}
              <div className="bg-gray-900 p-4 rounded-md shadow-sm border border-black">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio al Público (Q)</label>
                <div className="text-3xl font-black text-green-400">
                  {salePrice}
                </div>
              </div>

            </div>
          </section>

          {/* SECCIÓN 3: Logística de Recogida */}
          <section>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              3. Ventana Estricta de Recogida
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de Inicio</label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Límite</label>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {timeError && (
              <div className="mt-3 text-sm font-bold text-blue-800 bg-blue-100 p-3 rounded border border-blue-200">
                {timeError}
              </div>
            )}
          </section>

          {/* Acciones */}
          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={!formData.originalPrice || isSubmitting}
              className="px-8 py-3 bg-gray-900 text-white text-sm font-bold rounded-md hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Plantilla Base'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SurprisePackTemplateEditor;
