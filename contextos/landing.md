Rol: Actúa como un Arquitecto Frontend Senior y Diseñador UI/UX experto en conversión Web y optimización de interfaces comerciales utilizando React.js y Tailwind CSS.

Contexto: Necesitamos construir la página de inicio (Landing Page) principal para nuestra aplicación web de rescate de excedentes de comida. El diseño debe ser predominantemente claro, iluminado, espacioso y minimalista, inspirado rigurosamente en la estética visual de Airbnb. Debe cumplir con dos objetivos críticos: enamorar al consumidor final (B2C) y bifurcar limpiamente el tráfico hacia el portal de comercios socios (B2B) sin diluir la propuesta de valor principal.

Tarea: Escribe el código completo, modular y responsivo para el componente `LandingPageView.jsx`. El diseño debe estructurarse estrictamente mediante las siguientes secciones verticales utilizando clases nativas de Tailwind CSS sobre un fondo blanco puro (`bg-white`):

1. Barra de Navegación Global (Header):
   - Estilo: Altura fija (`h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50`).
   - Izquierda: Logotipo de la aplicación en tipografía sans-serif negrita y color verde corporativo (`text-green-600 font-bold text-2xl`).
   - Centro: Enlaces limpios de navegación para el consumidor: "Cómo funciona", "Explorar mapa", "Impacto ambiental".
   - Derecha: Un enlace secundario sutil en texto gris oscuro que diga "Registra tu negocio" o "Portal de Socios" (redirige a `/auth/merchant`) y un botón de acción primaria negro sólido con bordes redondeados completos (`rounded-full bg-black text-white px-6 py-2.5 text-sm font-medium hover:bg-gray-800`) rotulado "Iniciar sesión".

2. Sección Hero Inmersiva (B2C Focus):
   - Layout: Dos columnas asimétricas en escritorio (`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-16 px-8 max-w-7xl mx-auto`).
   - Columna de Texto (7 columnas): Un titular gigante con tipografía sans-serif pesada (`text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-none`) que diga "Salva comida deliciosa. Protege el planeta." Un subtítulo claro a las 4 líneas detallando el beneficio económico y ecológico.
   - La Píldora de Búsqueda (Interactiva): Justo debajo del texto, implementa una barra de búsqueda con esquinas completamente redondeadas (`rounded-full border border-gray-200 shadow-lg p-2 flex items-center bg-white hover:border-gray-300 max-w-xl`). Debe simular el comportamiento de Airbnb, conteniendo un selector de "Ubicación actual o zona de Guatemala" y un botón circular negro en el extremo derecho con el icono de lupa para disparar la exploración hacia `/auth/client`.
   - Columna Visual (5 columnas): En lugar de una imagen pesada, maqueta un contenedor flotante que simule de forma limpia y minimalista la interfaz de la app móvil (una tarjeta de pack sorpresa con una imagen de panadería de alta calidad, precio original tachado, precio final rebajado y una etiqueta flotante verde de "Favorito entre huéspedes").

3. Cuadrícula de Propuesta de Valor (Diseño Bento Box):
   - Layout: Una sección con fondo gris casi imperceptible (`bg-gray-50/50 py-20 px-8`), que aloje un titular centrado y una rejilla asimétrica (`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto`).
   - Tarjeta 1 (Ancho 1): Enfocada en el Cliente. Título "Ahorra más del 60%", texto explicativo y un fondo blanco limpio con bordes finos.
   - Tarjeta 2 (Ancho 1): Enfocada en el Impacto. Título "Reduce la huella de CO2", métrica clara explicando la equivalencia ecológica de cada bolsa salvada.
   - Tarjeta 3 (Ancho 1): Enfocada en el Comercio (B2B Callout). Una tarjeta con un borde sutilmente diferenciado que invite a los restaurantes locales a unirse, detallando la reducción de desperdicios y la recuperación de costos de producción.

4. Sección de Cierre y Llamada a la Acción (Final CTA):
   - Estilo: Un contenedor centrado al final de la página con un amplio espacio en blanco a los lados (`py-24 text-center border-t border-gray-100`).
   - Contenido: Título mediano (`text-3xl font-bold text-gray-900`), un párrafo corto de invitación y dos botones de gran formato colocados lado a lado: uno negro sólido para "Empezar a salvar comida" y uno transparente con borde fino para "Quiero afiliar mi restaurante".

Restricciones Técnicas Absolutas:
- PROHIBICIÓN ESTRICTA DE EMOJIS: No utilices ningún emoji en absolutamente ninguna parte del código generado, comentarios, variables o textos visibles de la interfaz. Utiliza únicamente iconos vectoriales limpios de la librería `lucide-react`.
- El código debe ser completamente funcional, utilizando React hooks locales (`useState`) si se requiere gestionar pestañas o estados simulados dentro de la Landing Page.
- Todas las clases deben ser de Tailwind CSS nativo, asegurando un diseño fluido que se adapte perfectamente a teléfonos móviles (layout de una sola columna colapsada) y monitores de escritorio.