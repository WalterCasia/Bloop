Rol:

Actúa como un Arquitecto Frontend Senior y Diseñador de Interfaces Experto en React.js, Tailwind CSS y sistemas geoespaciales interactivos con Mapbox GL JS (react-map-gl).

Contexto:

Estamos construyendo la vista principal del cliente (CLIENT) para nuestra plataforma web de rescate de excedentes de comida estilo Too Good To Go. Necesitamos implementar el dashboard principal de exploración (ClientExploreDashboard.jsx) replicando el patrón visual de pantalla dividida de Airbnb para resoluciones de escritorio, adaptado a nuestra lógica de Packs Sorpresa con horarios estrictos de recogida y stock efímero.

Tarea:

Escribe el código completo, modular y altamente tipado para el dashboard de exploración integrando los siguientes requerimientos arquitectónicos y visuales:
1. Estructura de Pantalla Dividida Responsiva (ClientExploreDashboard.jsx)

    En Escritorio (lg: y superiores): Divide el contenedor principal en un layout de dos columnas sin desbordamiento global de página (height: calc(100vh - headerHeight)):

        Panel Izquierdo (Lista de Ofertas - 55% del ancho): Un contenedor con scroll vertical independiente (overflow-y-auto). Debe incluir una barra superior de filtros rápidos (Radio en km, Categoría, Ordenar por precio/distancia) y un contador del total de locales disponibles en la zona. Renderiza las tarjetas en una cuadrícula responsiva (grid-cols-1 xl:grid-cols-2).

        Panel Derecho (Mapa Interactivo - 45% del ancho): Un contenedor fijo (sticky top-0 h-full) que renderice el mapa interactivo de Mapbox utilizando react-map-gl.

    En Móvil (< lg:): Renderiza una sola vista a pantalla completa que por defecto muestre la lista de tarjetas. Agrega un botón de acción flotante (FAB) fijo en la parte inferior central de la pantalla con el texto "Ver Mapa" o "Ver Lista" para alternar dinámicamente entre ambas vistas.

2. Componente de Tarjeta de Pack (SurprisePackCard.jsx)

    Renderiza la información crítica del negocio en el panel izquierdo:

        Imagen de portada del establecimiento con bordes redondeados.

        Etiqueta superpuesta en la imagen indicando la distancia exacta (ej. a 1.2 km).

        Nombre del local y puntuación de estrellas (1-5).

        Horario estricto de recogida resaltado (ej. Recogida hoy: 19:30 - 20:30).

        Anclaje de precio: Precio original tachado en color gris junto al precio rebajado en tipografía destacada (ej. Q60.00 -> Q20.00).

        Advertencia de escasez de inventario si quedan pocas unidades (ej. ¡Quedan 2!). Si stock === 0, oscurece la tarjeta y muestra la etiqueta Agotado.

3. Marcadores Personalizados en el Mapa (MapPricePills.jsx)

    En lugar de usar el típico pin rojo genérico de mapa, crea marcadores personalizados utilizando el componente <Marker/> de react-map-gl.

    Cada marcador debe comportarse visualmente como una píldora de precio (al estilo de Airbnb), mostrando directamente el precio rebajado en texto compacto dentro del pin (ej. Q20).

    Aplica coloración semántica en el fondo de la píldora según el inventario:

        Verde/Blanco si stock > 2.

        Ámbar/Naranja si stock <= 2 (indicando urgencia).

        Gris neutro si stock === 0.

4. Sincronización Interactiva en Tiempo Real (Hover & Click State)

    Declara un estado global o local de sincronización [hoveredStoreId, setHoveredStoreId].

    Interacción Lista -> Mapa: Cuando el usuario pasa el puntero del ratón (onMouseEnter) sobre una tarjeta en el panel izquierdo, el marcador correspondiente en el mapa derecho debe elevarse visualmente (aumentar escala con un transform scale-110, cambiar el color de borde o sombra y cambiar su zIndex al máximo).

    Interacción Mapa -> Lista: Al hacer clic en una píldora de precio en el mapa, despliega un Popup nativo con la vista previa del local o desplaza el scroll del panel izquierdo automáticamente para centrar la tarjeta de ese negocio utilizando scrollIntoView({ behavior: 'smooth' }).

5. Integración con el Backend (Fastify)

    Al cargar el componente y cuando el usuario mueva el mapa (onMoveEnd), dispara una petición HTTP optimizada y con prevención de rebotes (Debounced Fetch) a GET /api/packs/explore?lat={centerLat}&lng={centerLng}&radius={selectedRadius}.

    Muestra un indicador de carga sutil (Skeleton Loader en la lista y un indicador giratorio discreto en el mapa) mientras se actualizan las ofertas de la nueva zona.

Restricciones:

    No utilices emojis en absolutamente ninguna parte de tus respuestas, ni en los textos de la interfaz, ni en comentarios, ni dentro del código generado. Utiliza íconos vectoriales limpios (como lucide-react) para estrellas, ubicación y filtros.

    Escribe exclusivamente código modular en React funcional con Hooks, asegurando que las clases de Tailwind CSS mantengan el layout perfectamente bloqueado sin barras de desplazamiento horizontales involuntarias.

    Asegúrate de validar la existencia del token público de Mapbox (import.meta.env.VITE_MAPBOX_TOKEN) antes de intentar renderizar el mapa para evitar errores críticos en consola.

Formato de salida:

Entrega directamente los bloques de código limpios, estructurados y listos para implementarse para ClientExploreDashboard.jsx, SurprisePackCard.jsx y la configuración de marcadores en el mapa.