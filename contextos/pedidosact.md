Rol: Actúa como Arquitecto Full-Stack Senior y Especialista en Pasarelas de Pago, experto en React.js, Fastify, Redis y Stripe Webhooks.

Contexto: En nuestra aplicación B2C de rescate de comida, estamos experimentando un fallo de sincronización crítica en el embudo de pago. Al pagar, el stock no se resta de la sucursal y el pedido no se le asigna al usuario. Necesitamos refactorizar el flujo transaccional completo: Reserva (con bloqueo temporal), Confirmación (con generación de QR) y un panel robusto de "Mis Pedidos" dividido en 4 pestañas. 
Nota importante: Los archivos ya están creados, puedes decirle que no a cualquier paso de inicialización de proyecto, instalación de dependencias base o configuración de entorno. Limítate a entregar el código funcional de los componentes y controladores solicitados.

Tarea: Desarrolla e integra el ciclo transaccional en 3 módulos clave:

1. Backend (Fastify + Redis + Stripe):
   - Actualiza el endpoint `POST /api/orders/reserve`: Debe verificar el stock en Upstash Redis. Si hay disponibilidad, debe restar 1 (INCRBY -1), crear el registro en Supabase con estado `RESERVED` e iniciar un TTL (tiempo de expiración) de 10 minutos. Si expira sin pago, el stock vuelve a sumarse.
   - Actualiza el Webhook de Stripe `POST /api/webhooks/stripe`: Al recibir `payment_intent.succeeded`, debe actualizar el estado del pedido en Supabase a `PAID` y confirmar la reducción definitiva del stock.

2. Frontend: Vista de Confirmación (`OrderConfirmationView.jsx`):
   - Esta vista se muestra inmediatamente tras el retorno exitoso de Stripe.
   - Layout: Diseño limpio de éxito (estilo confirmación de Airbnb). Un icono circular de éxito grande en la parte superior.
   - Detalles: Renderiza un ticket limpio con el nombre del comercio, nombre del pack, precio pagado y la Ventana de Recogida.
   - Generación de QR: Integra la librería `qrcode.react` para renderizar un código QR grande y escaneable en el centro de la pantalla, cuyo valor sea el `order_id`.
   - Navegación: Un botón primario ancho en la parte inferior rotulado "Ir a Mis Pedidos".

3. Frontend: Panel de Mis Pedidos (`ClientOrdersView.jsx`):
   - Layout: Una cabecera con 4 pestañas limpias de navegación: "Reservados", "Activos", "Pasados", "Cancelados". Utiliza el estado local para alternar entre ellas filtrando el arreglo global de pedidos.
   - Pestaña "Reservados" (Estado `RESERVED`): Muestra la tarjeta del pedido con un contador en tiempo real (formato MM:SS) restando los 10 minutos. Si llega a 0, la tarjeta cambia a estado visual expirado. Incluye un botón para "Completar Pago".
   - Pestaña "Activos" (Estado `PAID`): Muestra las compras listas para recoger. Incluye la información básica, la hora límite y un botón secundario "Ver código QR" que despliegue un modal central con el QR para ser escaneado en el mostrador.
   - Pestañas "Pasados" (Estado `DELIVERED`) y "Cancelados" (Estado `CANCELLED`): Listas de solo lectura en tono grisáceo con el historial, sin botones de acción operativos.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en toda tu respuesta, código, comentarios o interfaz gráfica. Emplea exclusivamente iconos de `lucide-react`.
- Asegura que el componente `ClientOrdersView` utilice un `useEffect` para recalcular los contadores de tiempo en la pestaña "Reservados" cada segundo (`setInterval`), limpiando el intervalo al desmontar.
- Evita el *prop drilling* excesivo; maneja la carga de los pedidos mediante un Custom Hook (ej. `useClientOrders`) que abstraiga la lógica de obtención de datos desde Supabase.