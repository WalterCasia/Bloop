Rol: Actúa como Arquitecto Full-Stack Senior experto en interfaces B2C (React.js, Tailwind CSS) y lógica transaccional (Fastify, Supabase).

Contexto: Necesitamos implementar el flujo de reseñas desde el lado del cliente (B2C) en nuestra aplicación de rescate de comida. El diseño debe ser minimalista e inmersivo (estilo Airbnb), totalmente opcional y activarse tras la entrega del paquete. Ya contamos con la tabla `reviews` en Supabase y el panel B2B que lee de ella, por lo que el enfoque está en la captura de datos en el cliente y su inserción segura. Los archivos base del proyecto ya existen; no generes pasos de configuración ni instalaciones.

Tarea: Desarrolla los siguientes componentes de software y endpoints para completar el ciclo de reseñas:

1. Modal de Calificación Interactivo (`ClientReviewModal.jsx`):
   - Disparador: Este modal debe abrirse automáticamente mediante un estado global si el usuario se encuentra en la app y el estado de su pedido cambia a `DELIVERED` (detectado vía Supabase Realtime). También debe poder abrirse manualmente desde el botón "Calificar" en la pestaña de pedidos Pasados.
   - Componente de Estrellas: Renderiza 5 estrellas interactivas utilizando iconos de `lucide-react`. Al pasar el cursor o presionar, deben iluminarse de forma acumulativa. El estado inicial es 0 y bloquea el botón de envío hasta que se seleccione al menos 1 estrella.
   - Bloque de Etiquetas Dinámicas (Tags): Si la calificación es de 1 a 3 estrellas, muestra etiquetas de mejora (ej. "Espera larga", "Poca cantidad"). Si es de 4 o 5 estrellas, muestra etiquetas de éxito (ej. "Excelente atención", "Mucha comida", "Buen precio"). Las etiquetas deben ser pastillas (`rounded-full border border-gray-200 px-4 py-2 text-sm`) que cambien a fondo negro y texto blanco al ser seleccionadas.
   - Comentario: Un campo `<textarea>` opcional con un marcador de posición limpio.
   - Acción: El botón de enviar debe ser negro sólido, ancho completo y manejar el estado `isLoading`. Al finalizar con éxito, cierra el modal de forma suave con una transición de opacidad.

2. Endpoint de Inserción Seguro (Fastify):
   - Ruta: `POST /api/reviews`.
   - Seguridad y Validación: Recibe `order_id`, `rating`, `tags` (array) y `comment`. Antes de insertar en Supabase, el backend debe verificar estrictamente que:
     A) El pedido exista y tenga estado `DELIVERED`.
     B) El `client_id` del pedido coincida exactamente con el usuario autenticado que emite la petición.
     C) No exista una reseña previa asociada a ese `order_id` (impedir duplicados).
   - Si pasa las validaciones, inserta en la tabla `reviews` guardando el `store_id` correspondiente para que se refleje de inmediato en el dashboard del comercio.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en explicaciones, comentarios de código o textos de la interfaz. Usa exclusivamente iconos de `lucide-react` (ej. `Star`, `X`).
- Toda la maquetación debe realizarse con clases puras de Tailwind CSS, priorizando fondos blancos, textos oscuros de alto contraste y esquinas redondeadas pronunciadas (`rounded-2xl` o `rounded-xl`).
- Asegura un manejo de errores robusto en el cliente si la petición de red falla, mostrando un mensaje de advertencia discreto sin romper la pantalla de navegación.