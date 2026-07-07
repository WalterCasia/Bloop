Rol:

Actúa como un Arquitecto Frontend y Desarrollador React Senior especializado en patrones de diseño estructural tipo App Shell, navegación móvil adaptativa (Mobile-First) y gestión de interfaces por roles utilizando Tailwind CSS.

Contexto:

Estamos integrando las vistas de nuestra aplicación web estilo Too Good To Go construida con React, Vite y Tailwind CSS. Ya disponemos de los componentes y vistas individuales tanto para el flujo de Consumidor (Mapa, Listado, Mis Pedidos) como para el flujo de Comercio (Escáner QR, Inventario Diario, Estadísticas). Ahora necesitamos programar el componente contenedor global (NavigationLayout.jsx) que envolverá todas las rutas privadas del sistema y adaptará dinámicamente sus menús según el rol de usuario autenticado en nuestro Auth Context de Supabase.

Tarea:

Escribe el código completo y modular para el componente NavigationLayout.jsx. Este componente debe:

    Consumir el contexto global de autenticación (useAuth o equivalente) para identificar el rol activo del usuario (CLIENT o MERCHANT).

    Definir dos arreglos de navegación estrictos con sus respectivas rutas e iconos limpios (utilizando la librería lucide-react o SVGs en línea sencillos):

        Para CLIENT: Explorar (Mapa/Lista), Mis Pedidos, Perfil.

        Para MERCHANT: Escáner QR, Inventario Diario, Estadísticas.

    Renderizar una Barra de Navegación Inferior fija (Bottom Tab Bar) orientada a dispositivos móviles cuando la pantalla sea inferior al punto de quiebre md de Tailwind, garantizando áreas de pulsación táctil cómodas (mínimo 48x48 píxeles).

    Renderizar una Barra Lateral fija (Sidebar) o encabezado superior estructurado para resoluciones de escritorio (md y superiores).

    Renderizar en el área central el contenido de la ruta activa utilizando <Outlet/> (de react-router-dom) o children, asegurando un desplazamiento vertical independiente sin romper las barras de navegación fijas.

Restricciones:

    No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código generado.

    Reemplaza cualquier representación visual por iconos vectoriales limpios (como lucide-react o SVGs en línea); no dejes texto plano ni caracteres especiales simulando iconos.

    Escribe exclusivamente en React funcional con Hooks, utilizando clases utilitarias puras de Tailwind CSS.

    Respetar los estándares de contraste visual (WCAG) asegurando que el enlace o pestaña actualmente seleccionada tenga un indicador de estado activo visualmente inconfundible (cambio de color de fondo y borde).

Formato de salida:

Entrega directamente el bloque de código funcional de React (NavigationLayout.jsx) listo para implementarse en el proyecto. Al recibir este prompt, genera el código solicitado y cierra respondiendo única y exclusivamente con una pregunta clave sobre cómo gestionaremos el cierre de sesión (Logout) dentro de este mismo menú de navegación.