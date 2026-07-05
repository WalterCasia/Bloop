Prompt para la Sub-fase 5.1: Geolocalización del Cliente y Mapa Explorador (Mapbox)

Rol:

Actúa como un Desarrollador Full-Stack Senior experto en React.js, consumo de APIs REST y maquetación de interfaces geográficas utilizando Mapbox (react-map-gl).

Contexto:

Estamos en la Fase 5 del desarrollo de nuestra aplicación web estilo Too Good To Go. Ya contamos con un backend en Fastify que expone el endpoint GET /api/packs/explore?lat={lat}&lng={lng}&radius={km} conectado a Supabase (PostGIS). Ahora necesitamos construir la vista principal de descubrimiento para el rol Cliente en React.

Tarea:

Escribe el código del componente principal de exploración (ExploreView.jsx). El componente debe realizar lo siguiente:

    Solicitar permiso de GPS al navegador del usuario al montarse utilizando la API navigator.geolocation. Si el usuario rechaza o falla, debe usar unas coordenadas predeterminadas de respaldo y permitir la búsqueda manual de ciudad/barrio.

    Integrar react-map-gl para renderizar un mapa interactivo de Mapbox centrado en la ubicación del usuario.

    Hacer una petición al endpoint /api/packs/explore al cargar el mapa o cuando el usuario arrastre el mapa (onMoveEnd), enviando las coordenadas centrales y un radio predeterminado de 5 km.

    Renderizar marcadores geográficos (<Marker/>) en el mapa por cada comercio obtenido. Los pines deben tener colores dinámicos: verde si stock > 2, naranja si stock <= 2 y gris si stock === 0.

Restricciones:

    No utilices emojis en tus respuestas.

    Escribe únicamente componentes funcionales de React con Hooks (useState, useEffect, useCallback).

    Estiliza todo utilizando exclusivamente clases utilitarias de Tailwind CSS.

    Asegúrate de manejar los estados de carga (loading) y error en la petición HTTP.

Formato de salida:

Entrega directamente el bloque de código funcional de React listo para implementarse, gestionando adecuadamente las variables de entorno para el token público de Mapbox (VITE_MAPBOX_TOKEN). Al final, responde con una única pregunta clave de confirmación sobre el manejo de errores de GPS para continuar con la siguiente parte.
Prompt para la Sub-fase 5.2: Feed de Listado y Tarjetas de Producto

Rol:

Actúa como un Desarrollador Frontend Senior experto en React.js, Tailwind CSS y diseño de interfaces optimizadas para dispositivos móviles (Mobile-First).

Contexto:

Ya tenemos el mapa funcionando que recupera los comercios cercanos. Ahora necesitamos alternar esa vista de mapa con una vista de listado de tarjetas estructuradas (el "Feed Principal") para que el consumidor pueda comparar precios, horarios y disponibilidad de los Packs Sorpresa.

Tarea:

Escribe el código para dos componentes:

    PackCard.jsx: Una tarjeta visual reutilizable que reciba los datos del pack como props y renderice: imagen de portada, nombre del local, distancia calculada en km, etiqueta con hora exacta de recogida (ej. Hoy 20:00 - 20:30), precio original tachado junto al precio con descuento rebajado y un indicador visual de unidades disponibles (¡Quedan X packs!). Si el stock es 0, la tarjeta debe tener opacidad reducida y mostrar la etiqueta Agotado.

    ExploreFeed.jsx: Un componente contenedor que incluya un interruptor de pestañas (Toggle) para permitir al usuario alternar entre la vista de "Mapa" (creada en la sub-fase anterior) y la vista de "Listado", renderizando una lista ordenada por distancia utilizando PackCard.jsx.

Restricciones:

    No utilices emojis en tus respuestas.

    Mantén el código limpio, modular y tipado implícitamente o documentado con JSDoc.

    Utiliza Tailwind CSS garantizando un contraste óptimo y un diseño completamente responsivo.

Formato de salida:

Entrega los dos archivos en bloques de código de React separados listos para ejecutarse. Al final, confirma tu respuesta haciendo una única pregunta clave sobre la lógica de ordenamiento (por distancia vs. por precio) para pasar al detalle del producto.
Prompt para la Sub-fase 5.3: Detalle del Pack y Reserva con Temporizador Redis (TTL)

Rol:

Actúa como un Arquitecto Frontend y Desarrollador React Senior experto en gestión de estado temporal y manejo de concurrencia transaccional en el navegador.

Contexto:

Cuando un cliente hace clic en una tarjeta del feed o en un pin del mapa, entra a la página de detalle del comercio. Al presionar "Reservar", nuestro backend de Fastify ejecuta una petición transaccional a Upstash Redis (POST /api/packs/:id/reserve), decrementando el stock y devolviendo un objeto con una marca de tiempo de expiración de 10 minutos (expiresAt).

Tarea:

Escribe el código del componente PackDetailView.jsx. Este componente debe:

    Mostrar la información completa del Pack Sorpresa: concepto de bolsa sorpresa, ventana estricta de recogida, notas operativas del local y avisos de alérgenos.

    Implementar un botón principal de acción llamado "Reservar Pack".

    Al hacer clic en "Reservar Pack", debe disparar la petición HTTP al backend. Si la respuesta es exitosa (stock bloqueado en Redis), la interfaz debe transformarse inmediatamente y mostrar un módulo flotante de pago pendiente con una cuenta regresiva estricta (Countdown Timer) de 10:00 minutos sincronizada con la marca de tiempo expiresAt enviada por el servidor.

    Si el temporizador llega a 00:00 antes de confirmar el pago, la interfaz debe deshabilitar la compra, avisar que el tiempo expiró y redirigir al usuario al feed principal.

Restricciones:

    No utilices emojis en tus respuestas.

    Utiliza useEffect y setInterval limpiando correctamente el intervalo al desmontar el componente para evitar fugas de memoria en React.

    El temporizador no debe depender únicamente de los segundos locales del navegador, sino calcular la diferencia en tiempo real contra el valor expiresAt del backend.

Formato de salida:

Entrega el código funcional en un bloque modular de React + Tailwind CSS. Al final, formula una única pregunta clave sobre el comportamiento de la interfaz si el usuario recarga la página web durante la cuenta regresiva de 10 minutos.
Prompt para la Sub-fase 5.4: Billetera de Pedidos, Canje y Código QR Dinámico

Rol:

Actúa como un Desarrollador Full-Stack Senior experto en React.js y flujos transaccionales de comercio electrónico móvil.

Contexto:

Una vez que el usuario confirma el pago dentro de los 10 minutos, el backend formaliza la orden en PostgreSQL (orders), asigna un código hash único de canje y actualiza el estado a RESERVED. Ahora el cliente se dirige al local físico para retirar su comida y necesita validar su pedido frente al empleado del comercio.

Tarea:

Escribe el código para la sección de gestión de pedidos del consumidor creando dos componentes:

    CustomerOrdersView.jsx: Una vista con pestañas que clasifique los pedidos del usuario consultando el backend: Activos (pendientes de recoger), Pasados (entregados) y Cancelados.

    OrderRedemptionModal.jsx: Una vista de detalle para un pedido activo cuando el usuario llega a la tienda. Debe renderizar un Código QR dinámico utilizando la librería react-qr-code basado en el hash único del pedido (order.validation_token). Además, debe incluir un botón interactivo de confirmación visual (o un componente tipo Slider / "Desliza para canjear") que ejecute el endpoint POST /api/orders/:id/claim-preview para mostrar una animación dinámica en pantalla que le confirme al empleado de la tienda que el ticket es real y no una captura de pantalla estática.

Restricciones:

    No utilices emojis en tus respuestas.

    Asegúrate de que el Código QR renderice con un contraste altísimo (negro puro sobre fondo blanco puro) para facilitar la lectura por las cámaras de los comercios en entornos con mucha o poca iluminación.

    Implementa la lógica que impida canjear el pedido si la hora actual del sistema no está dentro de la ventana horaria de recogida estricta establecida por la tienda.

Formato de salida:

Entrega el código modular completo en React y Tailwind CSS para ambos componentes. Al recibir este prompt, entrega el código solicitado y cierra respondiendo única y exclusivamente con una pregunta clave sobre cómo manejamos la actualización en tiempo real cuando el comercio marca el QR como entregado en su propio panel.