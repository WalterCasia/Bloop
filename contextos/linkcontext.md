Rol:

Actúa como un Desarrollador Full-Stack Senior experto en React.js, react-router-dom v6+ y consumo optimizado de APIs REST en entornos transaccionales.

Contexto:

En pasos anteriores ya estructuramos el componente global de navegación (NavigationLayout.jsx), el enrutador principal y la interfaz de control de stock diario para los restaurantes (DailyStockDashboard.jsx). Actualmente, al presionar el botón "Inventario" en la barra de navegación de un usuario con rol de comercio, la ruta /merchant/stock no renderiza la funcionalidad completa ni comunica los cambios de stock en tiempo real al backend.

Tarea:

Escribe las modificaciones y adiciones de código necesarias para conectar el inventario del comercio en un flujo funcional 100% operativo:

    Actualiza el archivo de enrutamiento principal (AppRouter.jsx o App.jsx) para importar y declarar formalmente la ruta /merchant/stock, protegiéndola bajo el rol MERCHANT y envolviéndola en el NavigationLayout.

    Actualiza o complementa el archivo DailyStockDashboard.jsx para que, al montarse, obtenga el ID de la tienda desde el contexto de autenticación de Supabase y realice una petición GET /api/merchant/stock al backend de Fastify para cargar las unidades disponibles actuales del día.

    Asegura que los botones de incremento (+), reducción (-) y "Agotado por hoy" dentro de DailyStockDashboard.jsx ejecuten una petición asíncrona PATCH /api/merchant/stock al servidor Node.js/Fastify, actualizando el estado visual en React únicamente cuando el servidor devuelva un código HTTP de éxito (200 OK) para mantener sincronizado el stock en Supabase y Upstash Redis.

Restricciones:

    No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código generado.

    Mantén el código estrictamente tipado o claramente documentado, siguiendo las mejores prácticas de React Hooks (useEffect, useState).

    Maneja explícitamente los estados de carga visual (isLoading) y los estados de error de red (ej. si el backend rechaza reducir el stock porque ya hay reservas activas en curso en Redis) utilizando alertas visuales o modales con Tailwind CSS.

Formato de salida:

Entrega los bloques de código actualizados y listos para ejecutarse en el proyecto frontal. Al recibir este prompt, genera el código solicitado y cierra respondiendo única y exclusivamente con una pregunta clave sobre qué mensaje visual o notificación debemos mostrarle al comercio si intenta reducir el stock del día por debajo de la cantidad de packs que ya fueron reservados por clientes en las últimas horas.