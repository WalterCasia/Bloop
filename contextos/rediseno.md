Rol: Actúa como Diseñador UI/UX Senior y Arquitecto Frontend experto en Tailwind CSS y React.js.

Contexto: Necesitamos aplicar un "Reskin" (rediseño puramente visual) a dos componentes existentes de nuestra aplicación B2C: `OrderConfirmationView.jsx` y `ClientOrdersView.jsx`. El diseño actual se ve anticuado. Queremos adoptar estrictamente la estética de "Airbnb": minimalismo absoluto, fondos blancos, tipografía grande y pesada (sans-serif), alto contraste (blanco y negro principal) y botones prominentes. 

Tarea: Reescribe la estructura de clases de Tailwind CSS de los siguientes componentes. 

DIRECTIVA CRÍTICA (PRESERVACIÓN DE LÓGICA): NO modifiques, renombres ni elimines variables de estado, hooks (`useState`, `useEffect`), manejadores de eventos (`onClick`) ni props. Tu trabajo es 100% estético (HTML y Tailwind CSS). Asume que los datos ya están disponibles.

1. Rediseño de Vista de Confirmación (`OrderConfirmationView.jsx`):
   - Fondo y Layout: Elimina cualquier gradiente verde. Utiliza un fondo gris ultraclaro (`bg-gray-50 min-h-screen flex items-center justify-center p-4`).
   - Tarjeta Central: Un contenedor blanco puro, con bordes muy redondeados y sombra amplia (`bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center`).
   - Cabecera de Éxito: Reemplaza el check verde simple por un contenedor circular llamativo (`w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6`). Dentro, un icono de check grueso en verde oscuro.
   - Tipografía Gigante: El texto "¡Pago Exitoso!" debe ser inmenso y pesado (`text-3xl font-extrabold text-gray-900 tracking-tight`). El subtítulo en gris medio (`text-gray-500 mt-2`).
   - Caja de Detalles (Comercio, Paquete, Horario): Envuelve estos datos en un recuadro de fondo gris muy tenue (`bg-gray-50 rounded-2xl p-5 text-left my-8 space-y-4`). Usa flexbox y los iconos de `lucide-react` alineados a la izquierda para cada dato.
   - Contenedor del QR: Dale protagonismo. Un recuadro blanco con un borde sutil (`border border-gray-200 rounded-2xl p-4 inline-block shadow-sm`).
   - Botones (Bottom Actions): El botón "Ir a Mis Pedidos" debe ser negro sólido, ancho completo y redondeado (`w-full bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-gray-900 transition`). El botón secundario ("Explorar Más Packs") debe ser texto simple y limpio, sin fondo (`text-black underline font-medium mt-4 block hover:text-gray-600`).

2. Rediseño de Panel de Mis Pedidos (`ClientOrdersView.jsx`):
   - Cabecera y Navegación (Tabs): Elimina la línea verde. Las pestañas deben verse como las de Airbnb. El texto inactivo en gris (`text-gray-500 hover:text-black font-medium`). La pestaña activa en texto negro pesado con una línea inferior negra gruesa (`text-black font-bold border-b-2 border-black pb-2`).
   - Tarjetas de Pedido (Order Cards): Elimina los bordes rígidos. Cada tarjeta debe ser `bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`.
   - Layout de la Tarjeta: 
     - Fila Superior: Flex entre el nombre del local (`text-xl font-bold text-gray-900`) y el precio (`text-xl font-bold text-black`).
     - Pastilla de Estado (Badge): En lugar de un texto gris que diga "PAGADO", usa una pastilla elegante (`bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`).
     - Detalles (Dirección y Reloj): Texto en gris oscuro (`text-gray-600`) con iconos limpios.
   - Botón de Acción ("Ver código QR"): Reemplaza el fondo gris genérico. Usa un botón de contorno negro robusto (`w-full mt-4 border-2 border-black text-black bg-transparent py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex justify-center items-center gap-2`).

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en todo el texto, código, explicaciones o interfaz. Utiliza únicamente la librería `lucide-react` para la iconografía.
- Mantén la responsividad (`md:`, `lg:`) para que se vea perfecto en teléfonos móviles.
