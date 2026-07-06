Rol:

Actúa como un Arquitecto Frontend Senior y Diseñador UI/UX experto en React.js, Tailwind CSS y componentes accesibles e interactivos (estilo Airbnb).

Contexto:

Estamos desarrollando la vista del cliente (CLIENT) para nuestra plataforma web de rescate de excedentes de comida estilo Too Good To Go. Necesitamos construir el componente del panel superior de navegación fijo (ClientTopNav.jsx) que reemplazará la cabecera estándar en la vista de exploración (ClientExploreDashboard).

Tarea:

Escribe el código modular, limpio y funcional en React con Hooks para el componente ClientTopNav.jsx. El diseño principal debe estar contenido en una barra fija en la parte superior (sticky top-0 z-50 bg-white border-b border-gray-200) y dividirse estructuralmente en dos filas horizontales:
1. Fila Principal (Navegación y Píldora de Búsqueda Central)

Debe utilizar un layout Flexbox/Grid horizontal alineado al centro (flex items-center justify-between px-6 py-4):

    Extremo Izquierdo (Marca): El logotipo o nombre comercial de la aplicación con un enlace que devuelva a /app/explore.

    Centro (Barra de Selección / Píldora de Búsqueda): Crea una barra con bordes redondeados tipo píldora (rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow flex items-center p-1.5 bg-white). Debe contener dos botones o selectores desplegables integrados:

        Modo de Ubicación: Un selector interactivo que permita alternar o elegir entre dos opciones:

            Opción A: "Mi ubicación actual (GPS)" (Al seleccionarse, emite un evento o callback onLocationChange con coordenadas locales vía navigator.geolocation).

            Opción B: "Zonas de Guatemala" (Al hacer clic, abre un menú desplegable de estilo Dropdown con las principales áreas de cobertura, por ejemplo: Antigua Guatemala, Zona 10 - Ciudad de Guatemala, Zona 4 - Cuatro Grados Norte, Zona 15, Cayalá). Al elegir una zona, emite las coordenadas centrales del área seleccionada.

        Radio de Distancia: A la par del selector de zona, dentro de la misma píldora (separado por un divisor vertical border-l), un pequeño botón que diga "A X km" y que al hacer clic permita ajustar el radio de búsqueda (3 km, 5 km, 10 km).

        Botón de Búsqueda: En el extremo derecho de la píldora, un botón circular de color primario (rounded-full bg-red-500 text-white p-2.5) con el icono de una lupa para activar la recarga de ofertas.

    Extremo Derecho (Acciones de Usuario):

        Botón "Mis Pedidos": Ubicado exactamente a la izquierda del perfil de usuario. Un botón con bordes redondeados (rounded-full px-4 py-2 border border-gray-300 hover:bg-gray-100 font-medium text-sm flex items-center gap-2) que redirija o active la vista /app/orders. Debe incluir un icono vectorial de bolsa de compras (lucide-react) y renderizar una insignia numérica o contador dinámico rojo si el usuario tiene pedidos en estado RESERVED pendientes de retirar el día de hoy.

        Menú de Perfil: Un botón circular tipo pastilla a la derecha extrema que muestre las iniciales del usuario o su avatar, abriendo un menú desplegable para ver "Mi Perfil", "Preferencias" y "Cerrar Sesión".

2. Fila Inferior (Filtros Rápidos en Carrusel Horizontal)

Justo debajo de la fila principal, implementa una barra de desplazamiento horizontal suave (flex items-center gap-3 overflow-x-auto py-3 px-6 bg-white) con pastillas seleccionables (rounded-full border px-4 py-1.5 text-xs font-medium) para filtrar los Packs Sorpresa:

    Filtros a renderizar: Todos, Panadería y Pastelería, Restaurantes, Supermercados, Recogida Hoy, Recogida Mañana, Vegano/Vegetariano.

    El filtro seleccionado actualmente debe cambiar su estilo visual a fondo oscuro y texto blanco (bg-gray-900 text-white border-gray-900).

Restricciones:

    No utilices emojis en absolutamente ninguna parte de tus respuestas ni en los textos del código. Utiliza estrictamente la librería lucide-react para todos los iconos gráficos (lupa, bolsa de compras, pin de ubicación, flechas desplegables y usuario).

    El componente debe aceptar props o consumir el contexto para recibir: activeLocationMode, selectedZone, selectedRadius, activeFilter, y un contador pendingOrdersCount.

    Escribe exclusivamente código React funcional utilizando Tailwind CSS puro, sin depender de librerías UI externas pesadas (como Material-UI o AntD).

Formato de salida:

Entrega directamente el bloque de código funcional completo y modular para ClientTopNav.jsx, incluyendo los subcomponentes necesarios para los menús desplegables integrados en el mismo archivo o en archivos adyacentes listos para importar.