Rol: Actúa como Arquitecto Frontend Senior y Especialista en Mapbox GL JS, experto en React.js, Tailwind CSS y UX para Marketplaces.

Contexto: Necesitamos refactorizar la vista de exploración B2C (`ClientMapExplorer.jsx`). Los archivos ya están creados, por lo que debes omitir cualquier paso de configuración inicial o instalación de dependencias y enfocarte estrictamente en entregar el código actualizado del componente. El objetivo es implementar un mapa minimalista, una función de pantalla completa y tarjetas flotantes de vista previa (estilo Airbnb).

Tarea: Modifica el componente integrando las siguientes tres capas de funcionalidad:

1. Estilo Minimalista de Mapbox y Estado de Pantalla Completa:
   - Estado Local: Crea un estado `isFullScreen` (booleano).
   - Layout Condicional: Si `isFullScreen` es `false`, el mapa debe ocupar su espacio normal en la cuadrícula dividida. Si es `true`, el contenedor del mapa debe cambiar a `fixed inset-0 z-50 w-full h-screen` para abarcar toda la pantalla.
   - Limpieza Visual del Mapa: En el componente `<Map />` de `react-map-gl`, utiliza el prop `mapStyle="mapbox://styles/mapbox/light-v11"` para obtener un diseño base claro y minimalista. Si es posible, aplica parámetros para ocultar la capa de Puntos de Interés (POI) genéricos para que solo resalten nuestros marcadores.

2. Botón de Expansión Flotante:
   - Posicionamiento: En la esquina superior derecha del contenedor del mapa (con posicionamiento `absolute`), renderiza un botón cuadrado o circular flotante (`bg-white shadow-md border border-gray-200 p-2 rounded-lg`).
   - Interactividad: Al hacer clic, debe alternar el estado `isFullScreen`.
   - Iconografía: Utiliza el icono `Maximize` cuando esté colapsado, y `Minimize` cuando esté en pantalla completa (de `lucide-react`).

3. Interacción de Marcadores y Tarjeta Flotante (Estilo Airbnb):
   - Estado de Selección: Crea un estado `selectedStore` (inicializado en `null`).
   - Marcadores: Al hacer clic en un `<Marker />` de un local, actualiza el estado `selectedStore` con los datos de ese pack y centra sutilmente el mapa en esas coordenadas (haciendo un *flyTo* suave).
   - Tarjeta Flotante (Slide-up Card): Renderiza condicionalmente un componente de tarjeta flotante en la parte inferior del mapa (`absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-0`).
   - Diseño de la Tarjeta: Debe contener una franja superior con la imagen del local (o un fondo gris sólido de placeholder), y un área inferior (padding blanco) con el nombre del local, el nombre del pack, la distancia y el precio destacado.
   - Acción de la Tarjeta: Toda la tarjeta debe comportarse como un enlace (o botón) que redirija a la ruta de detalle del paquete que diseñamos anteriormente (`/app/pack/:packId`). Incluye un botón de cierre "X" (Icono `X`) en la esquina superior derecha de la tarjeta para limpiar el estado `selectedStore` y ocultar la tarjeta.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en toda tu respuesta, código, comentarios o interfaz gráfica. Emplea exclusivamente iconos de `lucide-react`.
- Transiciones: Utiliza clases nativas de Tailwind para asegurar que la entrada de la tarjeta flotante y la expansión del mapa sean visualmente fluidas (ej. `transition-all duration-300`).
- Responsividad: Asegúrate de que la tarjeta flotante no se desborde en pantallas móviles pequeñas.