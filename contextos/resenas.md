Rol: Actúa como Arquitecto Full-Stack Senior, experto en React.js, Fastify y Supabase (PostgreSQL).

Contexto: Necesitamos implementar el sistema completo de reseñas (Reviews) para nuestra plataforma de rescate de comida. El flujo de negocio dicta que dejar una reseña debe ser un proceso completamente opcional para el cliente (B2C), accesible desde su historial de pedidos. Por el lado del comercio (B2B), el gerente debe tener un panel analítico estilo "Uber Eats Manager" para leer y responder a estas valoraciones.

Tarea: Desarrolla el ciclo de vida completo de la funcionalidad dividiéndolo en 4 capas arquitectónicas:

1. Base de Datos (Supabase SQL):
   - Define la estructura para una nueva tabla `reviews`.
   - Columnas requeridas: `id` (UUID), `order_id` (Relación única para evitar reseñas dobles), `client_id`, `store_id`, `rating` (Integer 1-5), `tags` (JSONB para guardar etiquetas como "Rápido", "Delicioso"), `comment` (Text, opcional), `merchant_reply` (Text, opcional), y timestamps.

2. Backend (Fastify / Node.js):
   - Crea el endpoint `POST /api/reviews` (B2C): Debe recibir el payload del cliente, verificar que el `order_id` pertenezca a ese usuario y que el estado de la orden sea `DELIVERED`, y luego insertar el registro.
   - Crea el endpoint `GET /api/merchant/reviews/:storeId` (B2B): Debe devolver las reseñas de la sucursal activa, incluyendo un cálculo del promedio total de estrellas.
   - Crea el endpoint `PATCH /api/merchant/reviews/:reviewId/reply` (B2B): Permite al comercio actualizar la columna `merchant_reply`.

3. Frontend Cliente B2C (`ClientOrderHistory.jsx` & `ReviewModal.jsx`):
   - En la vista del historial de pedidos del cliente, añade un botón sutil "Calificar pedido" únicamente en las tarjetas de pedidos con estado `DELIVERED` que aún no tengan reseña.
   - Al hacer clic, abre un modal limpio que solicite:
     A) Estrellas (1 a 5).
     B) Selección de Etiquetas (Pills seleccionables: "Excelente valor", "Buena cantidad", "Personal amable").
     C) Un área de texto opcional.
   - Al enviar, consume el endpoint `POST` y actualiza la interfaz localmente para ocultar el botón de calificar.

4. Frontend Comercio B2B (`MerchantReviewsView.jsx`):
   - Construye el panel analítico replicando la interfaz de Uber Eats Manager.
   - Cabecera: Promedio de calificación gigante y selectores para filtrar la tabla por "Calificación" o "Estado de respuesta".
   - Lista: Filas independientes donde se vea el nombre del cliente, las estrellas, las etiquetas seleccionadas y el comentario.
   - Interacción: Un botón "Responder" en cada fila que despliegue un textarea para enviar una contestación oficial del local mediante el endpoint `PATCH`.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero emojis en toda tu respuesta, código generado o textos de la interfaz. Utiliza exclusivamente `lucide-react` para la renderización de las estrellas y los avatares.
- Implementa manejo de errores estricto en Fastify para evitar que un cliente califique un pedido cancelado o que no le pertenece.
- Gestiona los estados de carga (`isLoading`) en React para deshabilitar los botones de envío mientras se resuelven las peticiones HTTP.