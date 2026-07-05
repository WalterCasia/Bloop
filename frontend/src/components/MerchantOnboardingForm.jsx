import React, { useState } from 'react';
import apiClient from '../api/apiClient';

/**
 * Formulario de Onboarding para Comercios
 * Permite actualizar datos legales y geocodificar la dirección física.
 */
const MerchantOnboardingForm = () => {
  const [formData, setFormData] = useState({
    store_name: '',
    category: '',
    address: '',
    legal_id: '',
    bank_account: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.put('/api/merchant/profile', formData);
      if (response.data.status === 'success') {
        setSuccess(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Ocurrió un error al procesar la solicitud. Revisa tu conexión y los datos ingresados.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center items-start font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-10 mt-10">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Configuración del Comercio
        </h1>
        <p className="text-gray-500 text-sm md:text-base mb-8">
          Completa tus datos comerciales y dirección. Nuestro sistema verificará tu ubicación vía satélite para que los clientes te encuentren fácilmente en el mapa.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold mb-6 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold mb-6 border border-green-200 flex items-center">
            <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ¡Ubicación confirmada y perfil guardado con éxito!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Local</label>
              <input
                type="text"
                name="store_name"
                required
                value={formData.store_name}
                onChange={handleChange}
                placeholder="Ej. Panadería Central"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Categoría Principal</label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                <option value="panaderia">Panadería y Repostería</option>
                <option value="restaurante">Restaurante</option>
                <option value="supermercado">Supermercado</option>
                <option value="cafeteria">Cafetería</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Dirección Física (Texto Plano)</label>
            <textarea
              name="address"
              required
              rows="2"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej. Av. Reforma 222, Colonia Juárez, Ciudad de México, 06600"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            ></textarea>
            <p className="text-xs text-gray-500 mt-2">
              Trata de ser lo más específico posible (calle, número, ciudad, código postal) para garantizar una localización GPS precisa.
            </p>
          </div>

          <hr className="border-gray-100 my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Identificación Legal / NIT</label>
              <input
                type="text"
                name="legal_id"
                required
                value={formData.legal_id}
                onChange={handleChange}
                placeholder="Número de registro fiscal"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cuenta Bancaria (CLABE / IBAN)</label>
              <input
                type="text"
                name="bank_account"
                required
                value={formData.bank_account}
                onChange={handleChange}
                placeholder="Cuenta para liquidaciones"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                loading 
                  ? 'bg-blue-400 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {loading ? 'Sincronizando Satélite...' : 'Guardar y Localizar Negocio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantOnboardingForm;
