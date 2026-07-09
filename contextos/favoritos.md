Rol: Actúa como Arquitecto Full-Stack Senior experto en React.js, Tailwind CSS, Fastify y Supabase.

Contexto: Necesitamos implementar el módulo de "Favoritos" en nuestra aplicación B2C de rescate de comida. El cliente debe poder guardar locales comerciales para un acceso rápido. El diseño visual debe mantener la estética minimalista, de alto contraste y bordes redondeados (estilo Airbnb). Los archivos base ya existen, así que omite cualquier paso de configuración de entorno. 

Tarea: Desarrolla el circuito de favoritos dividiéndolo en 3 capas de software:

1. Backend (Fastify + Supabase):
   - Crea la tabla `favorite_stores` (client_id, store_id) si no existe.
   - Crea el endpoint `POST /api/favorites/toggle`: Recibe `store_id` y el token del usuario. Si el registro existe, lo elimina. Si no existe, lo crea. Retorna el nuevo estado.
   - Crea el endpoint `GET /api/favorites`: Retorna un arreglo con la información de los locales favoritos del usuario activo, incluyendo su stock de packs actuales.

2. Actualización de Navegación (Header):
   - Modifica el Header B2C principal. Justo a la izquierda del botón "Mis Pedidos", añade un nuevo botón para "Favoritos". 
   - Estilo del botón: Un botón sutil (`text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-full font-medium flex items-center gap-2 transition`) usando el icono `Heart` de lucide-react.

3. Vista de Favoritos (`ClientFavoritesView.jsx`):
   - Enruta este componente a `/app/favorites`.
   - Layout: Contenedor principal con máximo ancho y centrado (`max-w-7xl mx-auto px-6 py-12`).
   - Cabecera: Título grande y pesado "Tus Favoritos" (`text-3xl font-extrabold text-gray-900 mb-8`).
   - Grid: Una cuadrícula adaptable (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
   - Empty State: Si el arreglo está vacío, renderiza un mensaje centralizado y amigable invitando a explorar el mapa, con un botón negro sólido de "Explorar locales" que redirija a `/app/explore`.
   - Tarjetas de Local: Reutiliza o maqueta una tarjeta limpia (fondo blanco, borde sutil redondeado, sombra suave) que muestre la imagen del local, el nombre, la disponibilidad de stock actual (Pastilla verde si hay stock, texto gris si está agotado) y un icono de corazón relleno (`fill-current`) en la esquina superior para poder quitarlo de favoritos desde esa misma vista.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero emojis en explicaciones, interfaz gráfica y código generado. Usa exclusivamente iconos vectoriales de `lucide-react`.
- PROHIBICIÓN DE COMENTARIOS: Genera el código fuente completamente limpio. Está estrictamente prohibido incluir comentarios de una línea (`//`) o de bloque (`/* */`) dentro del código React o Fastify entregado.
- Maneja el estado de carga (`isLoading`) mostrando una cuadrícula de esqueletos visuales (Skeleton Cards) mientras Fastify retorna los datos.