Rol: Actúa como Arquitecto Frontend Senior y Especialista en UI/UX, experto en React.js, React Router y Tailwind CSS.

Contexto: La vista principal de nuestra Landing Page (`LandingPageView.jsx`) ya cuenta con la barra de navegación que incluye los enlaces "Cómo funciona", "Explorar mapa" y "Impacto ambiental". Necesitamos darles funcionalidad completa. El proyecto y los archivos base ya están inicializados; no generes comandos de terminal ni pasos de configuración del entorno, enfócate estrictamente en entregar el código de los componentes.

Tarea: Desarrolla la funcionalidad de estos tres enlaces mediante la creación de dos nuevas secciones en la Landing Page y la lógica de enrutamiento para el mapa.

1. Implementación de "Cómo funciona" (Scroll Interno):
   - Crea el componente `<HowItWorksSection id="como-funciona" />` para renderizarlo debajo del Hero Section.
   - Layout: Un título centrado y una cuadrícula de 3 columnas (`grid-cols-1 md:grid-cols-3`).
   - Contenido: Tres pasos claros ilustrados con iconos grandes de `lucide-react`: 
     1) "Encuentra comida" (Icono de Mapa/Búsqueda).
     2) "Reserva y paga" (Icono de Tarjeta/Móvil).
     3) "Recoge y salva el planeta" (Icono de Bolsa/Corazón).
   - Navegación: Actualiza el enlace en el Header para que utilice desplazamiento suave hacia este ID (`href="#como-funciona"`).

2. Implementación de "Impacto ambiental" (Scroll Interno):
   - Crea el componente `<GlobalImpactSection id="impacto-ambiental" />`.
   - Layout: Un contenedor de ancho completo con un fondo oscuro o verde corporativo (`bg-green-900 text-white`).
   - Contenido: Muestra métricas globales de la plataforma en una tipografía de gran tamaño. Ejemplo: "X Kg de CO2 evitados", "Y Packs Salvados". 
   - Navegación: Actualiza el enlace en el Header para que apunte a este ID (`href="#impacto-ambiental"`).

3. Implementación de "Explorar mapa" (Enrutamiento Inteligente):
   - Este enlace NO debe llevar a una sección de la Landing Page, sino a la vista del mapa interactivo (`/app/explore`).
   - Lógica de Acceso: En el Header, el botón "Explorar mapa" debe actuar como un disparador condicional. Si el usuario no tiene una sesión activa (verificando el contexto de autenticación), debe ser redirigido primero a `/auth/client` para registrarse. Si ya está autenticado, lo lleva directo a `/app/explore`.
   - Crea una función manejadora `handleExploreClick` para ejecutar esta validación antes de utilizar `Maps('/app/explore')`.

Restricciones:
- PROHIBICIÓN ESTRICTA: No utilices emojis en el código, comentarios ni en los textos de la interfaz. Utiliza exclusivamente `lucide-react`.
- Para el desplazamiento suave, asegúrate de aplicar `scroll-behavior: smooth;` en el contenedor principal o utilizar métodos nativos de JS (`element.scrollIntoView`).
- Mantén la consistencia del diseño minimalista estilo Airbnb, con áreas táctiles grandes y amplio espacio en blanco (`padding` generoso).