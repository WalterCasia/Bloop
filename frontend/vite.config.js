import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true // Expone el frontend para pruebas en red local si es necesario (ej: desde un teléfono móvil)
  }
});
