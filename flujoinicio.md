Rol: Actúa como Arquitecto Frontend Senior y Diseñador UX experto en React.js y Tailwind CSS.

Contexto: Necesitamos refactorizar la arquitectura de enrutamiento y los flujos de registro (Onboarding) para separar completamente la experiencia del Cliente (B2C) y la del Comercio (B2B) desde la página de inicio, eliminando el embudo unificado anterior.

Tarea: Desarrolla la estructura lógica y los componentes visuales para los nuevos flujos de acceso:

1. Landing Page (`LandingView.jsx`):
   - Modifica la cabecera (Header) y el hero section para incluir dos botones de acceso distintos: "Entrar como Cliente" (redirige a `/auth/client`) y "Portal para Comercios" (redirige a `/auth/merchant`).

2. Flujo de Onboarding B2C (`ClientAuthFlow.jsx`):
   - Crea un formulario de registro para el cliente.
   - Tras la autenticación exitosa (Google o Email), implementa un paso intermedio (Pantalla de Preferencias) que pregunte: "Personaliza tu experiencia. ¿Tienes alguna preferencia dietética?".
   - Renderiza botones tipo pastilla (Pills) para: "Vegetariano", "Vegano", "Sin Gluten", "Sin restricciones". Al seleccionar y continuar, actualiza el perfil del usuario en Supabase y redirige a `/app/explore`.

3. Flujo de Onboarding B2B (`MerchantAuthFlow.jsx`):
   - Crea la pantalla de inicio del comerciante. Antes de pedir datos de registro, muestra dos tarjetas seleccionables:
     - Tarjeta 1: "Soy Propietario/Gerente" (Texto de apoyo: "Registraré un nuevo negocio en la plataforma").
     - Tarjeta 2: "Soy Empleado" (Texto de apoyo: "Tengo un código de invitación de mi gerente").
   - Lógica de la Tarjeta 1: Redirige al wizard de configuración de local (`/merchant/onboarding/new-store`) solicitando nombre, mapa y datos fiscales.
   - Lógica de la Tarjeta 2: Muestra únicamente un formulario de Email, Contraseña y un input destacado para "Código de Invitación de 6 dígitos". Al procesarlo, redirige directamente a `/merchant/dashboard`.

Restricciones:
- PROHIBICIÓN ESTRICTA: No utilices emojis en el código, comentarios, ni en la interfaz generada. Utiliza `lucide-react` para ilustrar las tarjetas de roles y las preferencias dietéticas.
- Escribe código modular utilizando `react-router-dom` para gestionar estas rutas limpiamente.
- Mantén el diseño minimalista, utilizando fondos blancos, bordes suaves (`border-gray-200`) y sombras sutiles.