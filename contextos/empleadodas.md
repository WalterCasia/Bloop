Rol: Actúa como Arquitecto Frontend Senior y Especialista en Seguridad RBAC, experto en React.js, React Router y Tailwind CSS.

Contexto: Necesitamos implementar el control de acceso basado en roles (RBAC) en nuestro panel B2B. Actualmente, los empleados de mostrador (rol 'STAFF') ven la misma interfaz que los dueños de franquicia (rol 'OWNER'). Debemos segregar las vistas para proteger los datos financieros y operativos, creando un dashboard simplificado y de acción rápida para el empleado.

Tarea: Desarrolla el sistema de control de roles dividiéndolo en los siguientes entregables:

1. Refactorización de la Barra Lateral (`MerchantDashboardLayout.jsx`):
   - Envuelve los elementos de navegación (enlaces) en validaciones condicionales basadas en la variable `userRole` proveniente del contexto global.
   - Si `userRole === 'STAFF'`, el menú lateral SOLO debe renderizar: "Inicio Operativo", "Escanear QR" y "Lista de Pedidos".
   - Si `userRole === 'OWNER'`, se renderiza el menú completo (incluyendo Rendimiento, Configuración, Empleados).

2. Protección de Rutas (`MerchantRouter.jsx`):
   - Implementa un componente de orden superior (HOC) o un Wrapper llamado `RoleProtectedRoute`.
   - Utilízalo para envolver las rutas sensibles (ej. `/merchant/reports`, `/merchant/settings`). Si un usuario con rol 'STAFF' intenta acceder a estas rutas, redirígelo automáticamente a `/merchant/dashboard` mostrando un aviso de "Acceso Denegado".

3. Vista Principal del Empleado (`EmployeeDashboardHome.jsx`):
   - Construye la pantalla de inicio exclusiva para el rol STAFF que se renderizará en `/merchant/dashboard`.
   - Layout: Una cuadrícula asimétrica limpia.
   - Área Principal (Izquierda): Un contenedor destacado de borde grueso y fondo claro con un botón gigante de acción primaria (fondo negro, texto blanco) rotulado "Abrir Escáner QR". Debajo de este, integra la tabla minimalista construida previamente (`MerchantOrdersView`) filtrada automáticamente para mostrar solo los pedidos "Pendientes de retiro" del día de hoy.
   - Área Lateral (Derecha): Una tarjeta fija de Control de Stock. Muestra el número grande de inventario disponible y dos botones táctiles gigantes ("+" y "-") para ajustar el excedente en vivo.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en explicaciones, comentarios de código o interfaz de usuario. Utiliza `lucide-react` para iconos.
- Asegúrate de que el componente de tabla de pedidos sea reciclable o invocado correctamente sin duplicar su código interno.
- Mantén el diseño táctil (Touch-First), asumiendo que el empleado usará una tablet o un móvil. Los botones deben tener un padding generoso (`p-4` o superior).