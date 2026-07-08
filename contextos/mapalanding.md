Rol: Actúa como Arquitecto Full-Stack Senior y Especialista en Mapbox GL JS, experto en React.js, Fastify y Supabase (PostGIS).

Contexto: Necesitamos integrar una sección de "Mapa de Previsualización" (Teaser Map) en la Landing Page de nuestra plataforma de rescate de comida. El objetivo es mostrar al usuario no autenticado una vista general con los locales que tienen paquetes disponibles, generando interés antes del muro de registro (Paywall/Authwall). Los archivos del proyecto ya están inicializados y creados, por lo que debes omitir cualquier paso de configuración, instalación de dependencias o setup inicial; limítate a generar el código de los componentes y controladores solicitados.

Tarea: Desarrolla el circuito de previsualización dividiéndolo en dos capas (Backend y Frontend):

1. Endpoint Público (Fastify):
   - Crea una nueva ruta pública: `GET /api/public/explore/preview`.
   - Lógica: Realiza una consulta a Supabase (PostGIS) que devuelva únicamente un arreglo de coordenadas (latitud y longitud) y un ID ofuscado de las sucursales que actualmente tengan `availableStock > 0`. 
   - Restricción de Seguridad: Este endpoint NO debe devolver nombres de locales, direcciones exactas ni precios, para evitar la extracción masiva de datos (Scraping).

2. Componente de Mapa de Adelanto (`MapPreviewSection.jsx`):
   - Integra este componente dentro de la Landing Page, justo debajo de la sección "Cómo funciona".
   - Layout: Un contenedor de ancho completo (`w-full h-96 md:h-[500px] relative overflow-hidden`).
   - Integración de Mapbox: Utiliza `react-map-gl` (`<Map />`). Configura el `initialViewState` centrado por defecto en la Ciudad de Guatemala (Latitude: 14.6349, Longitude: -90.5069) con un nivel de zoom alejado (`zoom: 11`) para mostrar un área metropolitana amplia.
   - Renderizado de Marcadores: Itera sobre el arreglo devuelto por el endpoint público y renderiza marcadores (`<Marker />`) utilizando un diseño simple (ej. un círculo verde sólido de Tailwind: `w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md`).

3. Capa de Interacción y Llamada a la Acción (CTA Overlay):
   - Desactiva el scroll del ratón (`scrollZoom={false}`) en el mapa para no interrumpir la navegación vertical de la Landing Page.
   - Superpón un degradado sutil en la parte inferior del mapa y un botón central flotante estilo píldora (`absolute bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-800 transition`).
   - El botón debe decir: "Inicia sesión para ver los locales exactos". Al hacer clic, debe invocar la función de enrutamiento que redirige a `/auth/client`.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en todo el texto, código fuente, comentarios y respuestas. Emplea exclusivamente la librería `lucide-react` si requieres iconos.
- Asegúrate de manejar los estados de carga (`isLoading`) en el frontend, mostrando un fondo gris suave (Skeleton) en el contenedor mientras Mapbox y el endpoint resuelven los datos.
- Todo el estilo debe aplicarse mediante clases utilitarias nativas de Tailwind CSS.