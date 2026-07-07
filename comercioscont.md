Fase 1: Estructura Base, Barra Lateral y Cabecera Corporativa (Shell Layout)

El objetivo central es construir el contenedor visual persistente (Layout Shell) que replicará el diseño limpio sobre fondo blanco de Uber Eats, organizando la barra de navegación lateral y el encabezado superior sin la pestaña de Marketing.
Prompt para la IA (Fase 1)
Plaintext

Rol: Actúa como Arquitecto Frontend Senior y Especialista en Sistemas UI/UX B2B experto en React.js con Hooks y Tailwind CSS.

Contexto: Estamos reestructurando el panel operativo del comercio en nuestra aplicación de rescate de excedentes gastronómicos para adoptar la arquitectura visual limpia y tipografía sans-serif de "Uber Eats Manager". El diseño debe basarse en un contenedor maestro persistente que aloje una barra lateral izquierda fija y una barra superior minimalista.

Tarea: Refactoriza y crea el componente contenedor principal `MerchantDashboardLayout.jsx`. Debe implementar la siguiente estructura modular:
1. Barra Lateral Izquierda (Sidebar fija): Contenedor de ancho fijo (`w-64 bg-white border-r border-gray-200 h-screen flex flex-col justify-between p-4 sticky top-0`). 
   - Sección Superior: Selector desplegable de negocio/sucursal (`MerchantBranchSelector`) estilizado como el menú jerárquico de Uber Eats (Nombre en negrita, subtítulo "Negocio" y flecha de alternancia).
   - Menú de Navegación: Una lista vertical de enlaces que renderice exactamente estas pestañas en orden lógico (excluyendo explícitamente cualquier módulo de Marketing): `Inicio`, `Sucursales`, `Pedidos`, `Rendimiento`, `Reseñas`, `Packs / Menú`, `Reportes`, `Pagos`, `Configuración`. Cada ítem activo debe resaltar con un fondo gris suave (`bg-gray-100 font-semibold text-black rounded-lg`) y los inactivos en texto gris medio con efecto hover.
2. Barra Superior (Header): Contenedor horizontal (`h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white`). Debe mostrar a la izquierda migas de pan o título de la sección activa, y a la derecha enlaces rápidos limpios en texto: `Ayuda`, `Preguntas frecuentes` y botón `Cerrar sesión`.
3. Área de Contenido Principal: Un contenedor flexible (`flex-1 bg-white p-8 overflow-y-auto`) donde se renderizarán los subcomponentes mediante `children` o enrutamiento anidado, preservando el estado global de la aplicación.

Restricciones:
- No utilices emojis en absolutamente ninguna parte del código, interfaz gráfica o comentarios. Utiliza estrictamente la librería `lucide-react` para iconos minimalistas en la barra lateral.
- Manten estrictamente las variables de estado global de la aplicación (`activeStore`, `user`, `handleSignOut`). No renombres propiedades de objetos que provengan del contexto o backend.
- Escribe exclusivamente código modular en React funcional utilizando clases nativas de Tailwind CSS.

Recomendaciones Arquitectónicas para la Fase 1

    Aislamiento del Enrutador: Asegúrate de que tu enrutador principal (react-router-dom o el sistema propio de tu aplicación) envuelva este layout utilizando una ruta padre (/merchant/*), de modo que al cambiar entre pestañas laterales la recarga de datos sea parcial y no cause parpadeos de pantalla completa.

    Gestión del Scroll Interno: Aplica overflow-hidden al contenedor raíz del navegador en este layout para evitar barras de desplazamiento globales duales. El único elemento con scroll vertical permitido debe ser el área principal de contenido (children).

Fase 2: Vista de Inicio y Operativa Táctil Efímera (Home & Operations)

Reemplazará tu vista inicial actual por un panel de resumen ejecutivo al estilo Uber Eats (Today's summary), integrando el control de inventario efímero en tiempo real y el disparador de escáner de códigos QR.
Prompt para la IA (Fase 2)
Plaintext

Rol: Actúa como Desarrollador Frontend Senior experto en React.js, Tailwind CSS y diseño de interfaces optimizadas para interacción táctil rápida (Touch-First UI).

Contexto: Necesitamos refactorizar la vista principal del comercio (`MerchantHomeView.jsx`) basándonos en la pantalla "Home" de Uber Eats Manager. La interfaz debe priorizar la lectura operativa en menos de 3 segundos para el personal de mostrador o cocina, manteniendo intactas nuestras llamadas asíncronas de control de inventario.

Tarea: Escribe el código completo para `MerchantHomeView.jsx` estructurado en una cuadrícula de dos columnas asimétricas (`grid grid-cols-1 lg:grid-cols-3 gap-8`):
1. Columna Principal (2/3 del ancho):
   - Encabezado de Saludo y Resumen: Muestra el saludo personalizado (`"Buenas tardes, [user.first_name]"`) y el título `"Resumen de hoy"`. Adjunta una pastilla visual indicando la sucursal activa.
   - Tarjetas de Métricas Rápidas: Tres contenedores en fila (`grid grid-cols-3 gap-4`) con bordes redondeados limpios y fondo blanco (`border border-gray-200 p-6 rounded-xl shadow-xs`). Renderiza: `Ventas de hoy` (en moneda local), `Packs Reservados` y `Packs Entregados`.
   - Módulo Táctil de Control de Stock: Una tarjeta destacada que muestre el stock disponible actual (`availableStock`). Incluye botones táctiles de gran formato (`+` y `-`) que invoquen la función preservada `handleStockUpdate(delta)` conectada a nuestro backend de Fastify y Upstash Redis. Incluye el botón crítico de acción secundaria: `"Agotado por hoy"`.
2. Columna Lateral de Acciones Rápidas (1/3 del ancho):
   - Contenedor lateral (`border border-gray-200 p-6 rounded-xl h-fit`).
   - Botón de Acción Primaria: Un botón de ancho completo en color negro sólido (`w-full bg-black text-white p-4 rounded-xl font-medium flex items-center justify-between hover:bg-gray-800 transition`) rotulado `"Escanear QR de Cliente"`, el cual debe disparar el estado local `setIsScannerOpen(true)` para abrir el modal de validación.
   - Lista de Accesos Directos: Enlaces tipo lista limpios para `"Editar horario de entrega"` y `"Ajustar precio del Pack"`.

Restricciones:
- No utilices emojis en el código ni en textos legibles por el usuario.
- Preserva estrictamente los nombres de variables y manejadores existentes que se reciben como props o hooks (`availableStock`, `reservedCount`, `handleStockUpdate`, `openScannerModal`).
- Implementa estados visuales de desactivación (`disabled opacity-50 cursor-not-allowed`) en el botón `-` si el stock disponible alcanza el valor `0`.

Recomendaciones Arquitectónicas para la Fase 2

    Actualizaciones Optimistas (Optimistic UI): Al pulsar los botones + o -, el frontend debe actualizar el número en pantalla de forma inmediata utilizando el estado local en React antes de esperar el 200 OK de Upstash Redis. Si el servidor devuelve un error por falta de conectividad o bloqueo de concurrencia, revierte el valor de forma silenciosa e informa mediante una notificación discreta (Toast).

    Prevención de Rebotes (Debouncing): Si el panadero pulsa 5 veces rápidas el botón +, utiliza un interceptor o debounce temporal de 300 milisegundos para empaquetar la solicitud en una sola llamada de red (PATCH /api/merchant/stock?quantity=5), protegiendo tu servidor Fastify de ráfagas innecesarias.

Fase 3: Gestión de Rescates y Validación en Vivo (Orders Management)

Modificará la tabla de pedidos para replicar la vista estructurada en pestañas de Uber Eats (Orders), con indicadores circulares de estado y filtrado instantáneo por código corto.
Prompt para la IA (Fase 3)
Plaintext

Rol: Actúa como Ingeniero de Software Frontend experto en maquetación de tablas complejas, filtrado de datos en tiempo real y React.js con Tailwind CSS.

Contexto: Necesitamos construir el módulo de pedidos del comercio (`MerchantOrdersView.jsx`) replicando exactamente la interfaz minimalista de pestañas de "Orders" en Uber Eats Manager. Este componente gestionará la entrega de los Packs Sorpresa en la tienda física.

Tarea: Escribe el código estructurado para `MerchantOrdersView.jsx` que administre el listado de pedidos preservado desde nuestra variable de estado `ordersList`.
1. Barra Superior de Filtrado por Pestañas: Una barra horizontal limpia con una línea divisoria inferior. Implementa dos pestañas seleccionables:
   - `Pendientes de retiro` (Filtra pedidos donde `order.status === 'RESERVED'`).
   - `Completados` (Filtra pedidos donde `order.status === 'DELIVERED'`).
   La pestaña activa debe subrayarse con un borde grueso negro (`border-b-2 border-black font-bold text-black`).
2. Barra de Herramientas Operativa: Debajo de las pestañas, incluye un input de búsqueda con el icono de lupa para filtrar en tiempo real por el código alfanumérico corto de 4 dígitos (`order.short_code`) o el nombre del cliente, y un selector de rango de fechas predeterminado para el día actual.
3. Tabla Minimalista de Pedidos: Una estructura tabular limpia (`table-auto w-full text-left border-collapse`).
   - Columnas: `Estado` (Indicador visual), `Detalles del pedido` (Nombre del cliente y fecha), `Código de confirmación` (Destacado con tipografía monospace), `Ventana de recogida` y `Acción`.
   - Indicadores de Estado: En la primera columna, dibuja un círculo sólido (`w-3 h-3 rounded-full`) que sea de color naranja/ámbar si el pedido está pendiente de retiro y verde oscuro si ya fue entregado.
   - Botón de Acción en Fila: En la columna de acción de los pedidos pendientes, renderiza un botón estilizado (`border border-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 font-medium`) rotulado `"Marcar Entregado"` que invoque de inmediato nuestra función preservada `handleConfirmPickup(order.id)`.

Restricciones:
- No utilices emojis en textos, tablas ni comentarios de código.
- Preserva todas las referencias al modelo de datos actual (`order.id`, `order.short_code`, `order.client_name`, `order.pickup_window`).
- Manten un rendimiento óptimo utilizando `useMemo` para calcular las listas filtradas y evitar renderizados innecesarios al escribir en el buscador de códigos cortos.

Recomendaciones Arquitectónicas para la Fase 3

    Sincronización en Segundo Plano: Dado que los clientes pueden reservar paquetes mientras el comerciante tiene esta pantalla abierta, implementa un temporizador de actualización silenciosa (Polling) cada 15 segundos o conecta este componente a un canal WebSocket de Supabase Realtime (postgres_changes) para inyectar las nuevas órdenes en la parte superior de la tabla de forma automática.

    Búsqueda Normalizada: Al comparar el texto ingresado en el buscador de códigos de 4 dígitos, sanitiza la entrada eliminando espacios en blanco y convirtiendo los caracteres a mayúsculas para evitar fallos de coincidencia por tipografía del teclado móvil del usuario.

Fase 4: Configuración de Sucursales y Geolocalización (Stores & Settings)

Construirá el panel de vista previa de tienda al estilo de la sección Stores Info y la configuración general con interruptores deslizantes limpios (Toggles).
Prompt para la IA (Fase 4)
Plaintext

Rol: Actúa como Arquitecto Frontend Senior especializado en integración de mapas interactivos (Mapbox GL JS) y formularios de configuración B2B en React.js y Tailwind CSS.

Contexto: Necesitamos reestructurar la vista de administración de local (`MerchantStoreSettings.jsx`) basada en la pantalla de "Store Info" y "General Settings" de Uber Eats Manager. La interfaz debe mostrar información geodésica verificada e interruptores minimalistas para la operativa diaria.

Tarea: Escribe el código modular para `MerchantStoreSettings.jsx` dividido en dos secciones verticales dentro de un layout de tarjeta limpia (`bg-white border border-gray-200 rounded-xl p-8`):
1. Sección Superior: Perfil de Sucursal y Mapa Contiguo:
   - Crea un contenedor dividido (`grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-gray-200 pb-8`).
   - A la izquierda, encapsula la vista previa del mapa interactivo de Mapbox (`react-map-gl`) centrado en las coordenadas preexistentes de la tienda (`activeStore.latitude`, `activeStore.longitude`) dentro de un recuadro con bordes redondeados (`h-64 w-full rounded-xl overflow-hidden border border-gray-200`).
   - A la derecha, muestra una lista de verificación visual con iconos circulares de verificación verde que presenten los datos operativos validados: Nombre público del local, Dirección física completa y Teléfono de mostrador verificado, acompañado de un botón de enlace simple rotulado `"Editar información de ubicación"`.
2. Sección Inferior: Configuración Operativa (Interruptores Estilo Uber Eats):
   - Una lista vertical de filas independientes (`divide-y divide-gray-100`).
   - Fila A: `"Activación automática del pack diario"` (Permite publicar el saldo de excedentes predeterminado cada día sin intervención manual).
   - Fila B: `"Instrucciones especiales de recolección"` (Habilita que los clientes envíen notas breves sobre alergias al reservar).
   - Fila C: `"Pausa de emergencia del local"` (Oculta temporalmente la tienda en el mapa de los consumidores).
   - Cada fila debe incluir un título en tipografía semibold, una descripción breve en color gris tenue y, en el extremo derecho, un interruptor deslizante (*Toggle Switch*) estilizado pura y nativamente en Tailwind CSS (`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600`), conectado a las variables de preferencia guardadas en la base de datos.

Restricciones:
- No utilices emojis en absoluto dentro de la interfaz o código generado.
- Mantén la integridad técnica de las variables geodésicas consumidas por Mapbox (`import.meta.env.VITE_MAPBOX_TOKEN`).
- Los interruptores deben emitir peticiones asíncronas de actualización hacia la tabla `stores` de Supabase al cambiar de estado, manteniendo indicadores visuales de carga local si el servidor tarda en responder.

Recomendaciones Arquitectónicas para la Fase 4

    Desacoplamiento del Mapa: Para evitar que el componente del mapa intente renderizarse antes de que el árbol DOM tenga dimensiones calculadas (lo que genera que Mapbox muestre un lienzo gris incompleto), envuelve el componente <Map/> dentro de una comprobación condicional que verifique que activeStore.latitude esté completamente resuelta desde el contexto.

    Componentización de los Toggles: Extrae el elemento interruptor deslizante (Toggle Switch) a un subcomponente reutilizable independiente (MerchantToggleSwitch.jsx) para garantizar que las animaciones de cambio de color (verde cuando está activo, gris cuando está inactivo) sean visualmente consistentes en todo el panel de ajustes.

Fase 5: Rendimiento, Impacto Ambiental y Reportes Exportables (Performance & Reports)

Replicará el módulo de reportes y gráficas estadísticas, incorporando el componente diferenciador de Impacto Ecológico (Too Good To Go Model) dentro del formato limpio de cajas de datos de Uber Eats.
Prompt para la IA (Fase 5)
Plaintext

Rol: Actúa como Ingeniero de Software Frontend experto en visualización de datos, métricas analíticas y generación de reportes en React.js con Tailwind CSS.

Contexto: Necesitamos construir la vista analítica del comercio (`MerchantPerformanceView.jsx`) combinando el formato de tarjetas y gráficos de "Performance" y "Reports" de Uber Eats Manager con las métricas de impacto ecológico inherentes a nuestra plataforma de excedentes de comida.

Tarea: Escribe el código estructurado para `MerchantPerformanceView.jsx` que consuma el objeto de métricas consolidadas `storeStats`.
1. Cabecera de Filtrado Temporal: Una barra superior con un título en negrita `"Rendimiento general"` y un selector desplegable a la derecha con opciones de rango de tiempo: `Últimos 7 días`, `Este mes` y `Últimos 90 días`.
2. Tarjetas de Métricas de Ventas e Impacto: Una cuadrícula estructurada de 4 columnas (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 my-6`). Renderiza contenedores limpios sobre fondo blanco con bordes finos:
   - Tarjeta 1: `Ingresos netos` (Muestra monto monetario y un porcentaje de cambio en color verde o rojo).
   - Tarjeta 2: `Packs Salvados` (Total de bolsas de excedentes vendidas).
   - Tarjeta 3: `CO2 Evitado` (Calculado dinámicamente: `storeStats.packs_saved * 2.5` en unidades de Kg).
   - Tarjeta 4: `Desperdicio Evitado` (Cálculo en peso estimado de comida salvada).
3. Sección de Generación de Reportes Exportables: Un contenedor inferior idéntico al estado limpio de reportes de Uber Eats. Muestra un área central con un icono gráfico vectorial en escala de grises de una bolsa o documento, el texto `"Generar reporte detallado"` y un botón de acción primario negro sólido rotulado `"Crear reporte CSV"`. Al presionarse, debe procesar la lista de transacciones del periodo y descargar un archivo de hoja de cálculo en el navegador web del usuario utilizando utilidades estándar de manipulación de blobs de datos en JavaScript.

Restricciones:
- No utilices emojis en ninguna sección gráfica ni en el código.
- Todas las variables numéricas y financieras deben formatearse utilizando `Intl.NumberFormat` ajustado a la localidad monetaria correspondiente (`es-GT` y moneda `GTQ` para Guatemala).
- El cálculo y descarga del archivo CSV debe realizarse en el lado del cliente sin requerir librerías externas pesadas, procesando el arreglo de pedidos existente en memoria.

Recomendaciones Arquitectónicas para la Fase 5

    Formateo Numérico Estricto: Al utilizar Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }), centraliza el formateador dentro de un archivo utilitario (utils/formatters.js) para asegurarte de que tanto los reportes como las tarjetas de métricas en vivo muestren los decimales de la moneda con idéntica precisión formal en toda la interfaz.

    Manejo del Hilo de Ejecución para CSV: Si el comercio intenta generar un reporte de un rango de 90 días que abarque miles de filas, asegúrate de que el armado de las cadenas de texto del archivo CSV se realice dentro de un bloque asíncrono o utilizando un Web Worker ligero para evitar que la interfaz visual del dashboard se congele momentáneamente durante el formateo del archivo.