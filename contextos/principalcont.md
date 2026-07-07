Rol: Actúa como un Arquitecto Frontend Senior y Especialista en Sistemas Operativos B2B orientados a dispositivos móviles y tabletas táctiles (Touch-First UI) utilizando React.js y Tailwind CSS.

Contexto: En nuestra aplicación web estilo Too Good To Go, cuando un usuario con rol MERCHANT inicia sesión y ya ha completado su configuración inicial (onboarding_completed === true), el enrutador lo redirige directamente a la primera vista operativa de la plataforma: /merchant/dashboard. Esta pantalla debe estar optimizada para operarse en menos de 5 segundos en un entorno de alta demanda (como el mostrador de una panadería o cocina).

Tarea: Escribe el código completo en React.js y Tailwind CSS para el componente principal MerchantMainDashboard.jsx. El componente debe integrar la siguiente jerarquía visual y funcional:

    Encabezado de Estado Diario: Una sección superior que consulte al backend y renderice el estado operativo del local hoy (Activo, Programado, Agotado) junto con el intervalo exacto de la ventana de recogida predeterminada.

    Tarjeta Central de Control de Stock Efímero: Un módulo visual de gran tamaño que muestre tres indicadores numéricos claros (Packs Reservados, Stock Disponible y Total del Día). Debe incluir dos botones interactivos de gran tamaño táctil (+ y -) que ejecuten una petición asíncrona PATCH /api/merchant/stock al backend de Fastify, aplicando una actualización optimista en la interfaz web solo revertida si el servidor devuelve error por bloqueo en Redis. Incluye también un botón de acción crítica rotulado "Agotado por hoy".

    Acceso Directo al Validador de Pedidos: Un botón de acción altamente destacado que, al presionarse, abra un modal envolvente de escáner de cámara para leer códigos QR (QRScannerModal) y adjunte un campo de texto rápido para validar códigos alfanuméricos cortos de 4 dígitos.

    Lista en Vivo de Pedidos del Día: Una tabla o lista concisa en la parte inferior que renderice los pedidos en estado RESERVED correspondientes a la jornada en curso, mostrando nombre del cliente, código de 4 dígitos y un botón de acción rápida para marcar el pedido como DELIVERED manualmente.

Restricciones: * No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código, comentarios o textos generados.

    Escribe exclusivamente en React funcional con Hooks (useState, useEffect, useCallback), garantizando llamadas limpias al servicio de API que contengan el token de sesión de Supabase en las cabeceras HTTP.

    Asegura un contraste visual óptimo con Tailwind CSS y define alturas y áreas de pulsación táctil mínimas de 48x48 píxeles para todos los botones interactivos, evitando clics erróneos en dispositivos móviles.

Formato de salida: Entrega directamente el bloque de código limpio y modular para MerchantMainDashboard.jsx. Al concluir la generación del código, realiza una única pregunta técnica clave sobre con qué intervalo de polling (o si implementaremos WebSockets mediante Socket.io) actualizaremos la lista en vivo de pedidos cuando un cliente realice una reserva en el exacto momento en que el comerciante tiene su dashboard abierto.