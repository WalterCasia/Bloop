Rol: Actúa como Arquitecto Frontend Senior y Especialista en UX/UI B2C, experto en React.js, React Router y Tailwind CSS.

Contexto: Necesitamos construir la Vista de Detalle del Paquete (`ClientPackDetailView.jsx`) para el consumidor final. Esta pantalla se activará cuando el usuario haga clic en una tarjeta de paquete desde el mapa de exploración. El diseño debe replicar rigurosamente la arquitectura de conversión de "Too Good To Go", utilizando un flujo de divulgación progresiva de arriba hacia abajo y una barra de acción inferior fija. 

Tarea: Desarrolla el componente aislando la interfaz en secciones modulares para evitar conflictos con la vista padre. Asume que la ruta es `/app/pack/:packId`.

1. Cabecera Visual (Header Image & Nav):
   - Contenedor superior (`h-64 relative w-full`).
   - Imagen de fondo: Utiliza un div con `bg-cover bg-center` simulando la foto del local/pack.
   - Navegación Flotante: Un botón circular semi-transparente en la esquina superior izquierda (Icono `ArrowLeft` de lucide-react) con un manejador `Maps(-1)` para regresar al mapa sin perder el estado anterior. En la esquina derecha, un botón de "Favorito" (Icono `Heart`).
   - Logotipo Solapado: Un contenedor circular (`w-20 h-20 bg-white rounded-full absolute -bottom-10 left-6 border-4 border-white shadow-md`) para el logo del comercio.

2. Sección de Identidad y Ventana de Recogida:
   - Layout: Contenedor principal con `padding` generoso (`px-6 pt-14 pb-6`).
   - Títulos: Nombre del comercio en texto mediano y color gris oscuro. Nombre del Pack en tipografía gigante y negrita (`text-3xl font-bold mt-1`).
   - Indicadores: Fila con la distancia ("A 2.5 km") y una pastilla (Pill) destacada para el stock ("Quedan 3 packs").
   - Ventana de Recogida: Un bloque destacado con fondo gris muy suave (`bg-gray-50 rounded-xl p-4 mt-6 flex items-center gap-4`). Usa el icono `Clock` a la izquierda. Muestra el texto "Recógelo hoy" y el horario (ej. "18:00 - 19:30").

3. Contenido, Reseñas y Ubicación:
   - Divisores: Separa las siguientes secciones con una línea sutil (`border-t border-gray-100 my-6`).
   - ¿Qué podrías recibir?: Título "Acerca de este pack". Párrafo descriptivo sobre el concepto sorpresa y un bloque de advertencia de alérgenos en texto más pequeño y color gris.
   - Reseñas: Muestra la calificación (ej. 4.6) con el icono `Star` relleno, y una fila de pastillas (`flex flex-wrap gap-2`) con etiquetas predefinidas (ej. "Gran valor", "Rápido").
   - Ubicación: Un recuadro estático simulando el mapa (o componente `react-map-gl` con `interactive={false}`) y la dirección en texto plano debajo.

4. Barra Inferior de Acción (Sticky Bottom Bar):
   - Contenedor: Fijo en la parte inferior de la pantalla (`fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 md:px-8 z-50 flex justify-between items-center max-w-2xl mx-auto`).
   - Precios: A la izquierda, un bloque en columna. Arriba, el precio original tachado en gris (`text-gray-400 line-through text-sm`); abajo, el precio final en texto grande y negro (`text-2xl font-bold`).
   - Botón (CTA): A la derecha, un botón ancho y negro sólido rotulado "Reservar". Si la variable de stock es 0, el botón debe tener `opacity-50 cursor-not-allowed` y cambiar el texto a "Agotado".

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en toda tu respuesta, código, comentarios o interfaz gráfica. Emplea exclusivamente iconos de `lucide-react`.
- Formateo: Aplica `Intl.NumberFormat` para los precios (Moneda local).
- Scroll: Asegúrate de que el contenedor principal tenga un `padding-bottom` (ej. `pb-24`) equivalente a la altura de la barra inferior fija, para que el texto final de la ubicación no quede oculto detrás de la barra de pago al hacer scroll hasta el fondo.