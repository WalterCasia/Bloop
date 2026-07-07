Rol: Actúa como un Desarrollador Full-Stack Senior y Especialista en Frontend con React.js, Tailwind CSS y consumo de APIs REST en flujos transaccionales y de canje móvil.

Contexto: En nuestra aplicación web estilo Too Good To Go, el flujo de compra del consumidor finaliza con la reserva y el pago transaccional gestionado por nuestro backend en Fastify y verificado en Supabase. Actualmente, el cliente carece de una interfaz donde consultar el historial de sus compras activas o pasadas y no tiene un mecanismo visual para renderizar el Código QR único que debe mostrar en el mostrador del comercio para retirar su paquete durante la ventana de recogida asignada.

Tarea: Escribe el código modular en React.js y Tailwind CSS para implementar la vista de pedidos del cliente, dividiendo la solución en dos componentes principales:

    CustomerOrders.jsx: El componente principal para la ruta /app/orders (o /customer/orders). Al montarse, debe consultar al endpoint protegído GET /api/customer/orders utilizando el token del usuario activo en Supabase. Debe estructurar la información mediante pestañas de navegación sencillas: Activos (pedidos en estado RESERVED pendientes de canje), Pasados (DELIVERED) y Cancelados (CANCELLED). Si la lista está vacía, debe renderizar un estado vacío limpio que invite al usuario a explorar el mapa.

    OrderQRModal.jsx: Un componente modal que se active al presionar un pedido en estado "Activo". Debe renderizar:

        Los datos clave del comercio (nombre, dirección y ventana horaria exacta de recogida).

        Un Código QR dinámico de alta resolución y máximo contraste (negro sobre blanco) generado con la librería react-qr-code, pasando como valor el hash único del pedido (order.validation_token).

        El código alfanumérico corto de 4 dígitos visible en texto grande justo debajo del QR como alternativa de validación manual para el empleado de la tienda.

        Un temporizador visual o indicador de estado que muestre en tiempo real si la ventana horaria de recogida ya inició, está próxima a abrirse o ha finalizado.

Restricciones: * No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código generado.

    Escribe exclusivamente en React funcional utilizando Hooks (useState, useEffect, useMemo), estilizando la interfaz únicamente con utilidades puras de Tailwind CSS adaptadas a dispositivos móviles (Mobile-First).

    Asegúrate de gestionar correctamente los estados de carga (isLoading) mientras se obtienen los pedidos del servidor y proporcionar retroalimentación visual en caso de fallo en la red.

    El modal del QR debe incluir un botón claro para cerrarse y estar diseñado para evitar cierres accidentales al tocar la pantalla mientras se presenta al mostrador.

Formato de salida: Entrega directamente los bloques de código funcional para CustomerOrders.jsx y OrderQRModal.jsx listos para implementarse en el directorio /src/pages/customer/ o /src/components/orders/. Al recibir este prompt, genera el código solicitado y cierra respondiendo única y exclusivamente con una pregunta clave sobre qué acción debe tomar el frontend si el usuario mantiene el modal del QR abierto en pantalla justo en el segundo exacto en que finaliza la hora límite de la ventana de recogida sin haber sido escaneado.