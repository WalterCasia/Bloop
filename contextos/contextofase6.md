

### Prompt para la Sub-fase 6.1: Onboarding del Comercio y Geocodificación (Mapbox Geocoding API)

**Rol:**

Actúa como un Desarrollador Full-Stack Senior especializado en Node.js (Fastify), React.js y servicios de georreferenciación geoespacial.

**Contexto:**

Estamos programando el módulo B2B (Comercios) de nuestra plataforma estilo *Too Good To Go*. Para que los clientes puedan descubrir los comercios mediante PostGIS (`ST_Distance_Sphere`), cada restaurante debe convertir su dirección de texto plano en coordenadas de punto geodésico (`SRID 4326`) al momento de crear y configurar su perfil.

**Tarea:**

Escribe el código para la conexión del backend y el formulario del frontend:

1. `store.controller.js` (Fastify): Un endpoint `PUT /api/merchant/profile` que reciba los datos de la tienda (nombre, categoría, dirección en texto). Debe consultar en el backend a la **Mapbox Geocoding API REST** usando el `MAPBOX_SECRET_TOKEN`, extraer las coordenadas exactas `[longitud, latitud]` y actualizar la tabla `profiles` en Supabase almacenando el punto en formato PostGIS mediante `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.
2. `MerchantOnboardingForm.jsx` (React + Tailwind): Un formulario para que el comerciante ingrese sus datos legales, dirección física e información bancaria básica para liquidaciones de pago, manejando estados de carga y confirmación visual al completarse la geocodificación.

**Restricciones:**

* No utilices emojis en tus respuestas.
* Valida el payload de entrada en Fastify utilizando un esquema formal de JSON Schema.
* En el frontend, maneja errores de forma clara en caso de que la API de Mapbox no encuentre la dirección suministrada por el usuario.

**Formato de salida:**

Entrega los dos bloques de código (backend en Fastify y frontend en React) listos para implementarse. Al finalizar, realiza una única pregunta clave sobre qué categoría por defecto debemos asignar si la API no localiza el tipo de negocio.

---

### Prompt para la Sub-fase 6.2: Gestión del Plantillado y Horarios de Recogida

**Rol:**

Actúa como un Arquitecto de Software y Desarrollador React Senior enfocado en usabilidad B2B y formularios de alta eficiencia.

**Contexto:**

Los restaurantes asociados no venden ítems individuales del menú a pedido, sino plantillas estandarizadas de *Packs Sorpresa* con reglas estrictas de descuentos y ventanas horarias fijas de recogida.

**Tarea:**

Escribe el componente `SurprisePackTemplateEditor.jsx` en React y Tailwind CSS para el panel del comercio. Este componente debe permitir:

1. Configurar el nombre del pack (ej. "Pack Sorpresa de Bollería"), categoría, descripción e instrucciones operativas (ej. "Traer bolsa propia").
2. Implementar un cálculo de **Anclaje Financiero Automático**: el comerciante introduce el Precio Original (ej. Q60.00) e inmediatamente la interfaz sugiere y bloquea un Precio de Venta en el rango de descuento estándar del 66% al 70% (ej. Q20.00), mostrando claramente el porcentaje de descuento otorgado.
3. Configurar la ventana horaria fija de recogida mediante selectores estrictos de hora de inicio (`start_time`) y hora de fin (`end_time`), validando que la hora de finalización sea siempre posterior al inicio.

**Restricciones:**

* No utilices emojis en tus respuestas.
* Utiliza componentes de formulario controlados en React.
* Aplica un diseño estructurado y responsivo con Tailwind CSS que sea claro de leer en pantallas de tabletas o laptops en entornos comerciales iluminados.

**Formato de salida:**

Entrega el código modular en React en un bloque de código limpio. Al final, formula una única pregunta clave sobre si permitiremos al comercio crear ventanas de recogida que pasen de la medianoche (ej. de 23:30 a 00:30) para validar la lógica del backend.

---

### Prompt para la Sub-fase 6.3: Dashboard Diario (Control Rápido de Stock Efímero)

**Rol:**

Actúa como un Desarrollador Frontend Senior experto en interfaces ágiles y sistemas táctiles (*Touch-First*) orientados a operadores operativos en entornos de alta presión.

**Contexto:**

Durante la rutina diaria, un empleado de mostrador en una panadería necesita modificar la cantidad de packs disponibles o detener la venta del día en menos de 5 segundos desde un teléfono móvil o tableta, sin navegar por menús profundos.

**Tarea:**

Escribe el componente `DailyStockDashboard.jsx` para la vista principal del comerciante en React + Tailwind CSS. Debe implementar:

1. Una tarjeta de estado rápido que muestre el pack activo del día, las unidades vendidas hasta el momento y el stock actualmente disponible.
2. Controles de acción inmediata con botones grandes táctiles de incremento (`+`) y reducción (`-`). Al pulsar, debe realizar una actualización optimista (*Optimistic UI Update*) en pantalla y enviar la petición HTTP de sincronización al backend para actualizar el stock en la base de datos y liberar o ajustar la disponibilidad temporal en Upstash Redis.
3. Un botón de acción crítica de un solo toque rotulado "Agotado por hoy / Detener ventas", que establezca inmediatamente el stock disponible en `0` y desactive la oferta pública del día sin borrar la plantilla para mañana.

**Restricciones:**

* No utilices emojis en tus respuestas.
* Los botones interactivos (`+` / `-`) deben tener un área de tap (puntero táctil) de al menos 48x48 píxeles para asegurar usabilidad móvil rápida.
* Implementa prevención de envíos dobles o rebotes (*debounce* o bloqueo por estado de carga) si el usuario presiona el botón varias veces seguidas rápidamente.

**Formato de salida:**

Entrega el bloque de código funcional de React con Tailwind CSS. Concluye formulando una única pregunta clave sobre qué hacer con las reservas pendientes de pago en Redis si el comercio pulsa el botón "Agotado por hoy".

---

### Prompt para la Sub-fase 6.4: Operación en Tienda (Escáner de QR y Validación)

**Rol:**

Actúa como un Desarrollador Full-Stack Senior experto en integraciones de hardware web (cámaras móviles), Fastify y seguridad transaccional en bases de datos.

**Contexto:**

Cuando un cliente llega al mostrador a retirar su comida durante la ventana horaria permitida, el empleado necesita validar el canje instantáneamente utilizando la cámara de su dispositivo comercial o introduciendo el código del pedido.

**Tarea:**

Escribe la lógica del validador de entregas dividida en dos capas:

1. `QRScannerModal.jsx` (React): Un componente modal que active la cámara trasera del dispositivo móvil utilizando una librería ligera (como `html5-qrcode` o `react-qr-reader`). Al detectar exitosamente un Código QR, debe extraer el token alfanumérico y llamar automáticamente al endpoint de validación. Debe incluir también un input de texto para la búsqueda manual del código de 4 dígitos en caso de fallo en la cámara.
2. `orderValidation.controller.js` (Fastify): El endpoint `POST /api/merchant/orders/validate`. Recibe el `token` o código, verifica en Supabase que el pedido corresponda a ese local y que el estado sea `RESERVED`. Debe validar en el servidor que la hora del sistema actual se encuentre estrictamente dentro del intervalo de recogida configurado (`start_time` y `end_time`). Si todo es válido, cambia el estado en PostgreSQL a `DELIVERED` y devuelve la confirmación.

**Restricciones:**

* No utilices emojis en tus respuestas.
* Si el escáner del mostrador intenta validar el QR antes o después del horario estricto de recogida, el backend debe rechazar el cambio de estado con un código HTTP `400 Bad Request` y un mensaje formal de error operativo.
* Asegúrate de cerrar adecuadamente el *stream* de video de la cámara web cuando el modal del escáner en React se desmonte.

**Formato de salida:**

Entrega el componente de React y el controlador de Fastify en bloques de código separados. Cierra tu respuesta realizando una única pregunta clave sobre si el sistema debe notificar al cliente en tiempo real vía WebSockets al momento en que el comercio marca su código como entregado.