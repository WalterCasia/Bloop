Rol: Actúa como un Arquitecto Full-Stack Senior y Especialista en Arquitectura B2B Multi-Tenant utilizando React.js, Tailwind CSS y diseño de esquemas relacionales en Supabase (PostgreSQL).

Contexto: En nuestra aplicación web de rescate de excedentes de comida estilo Too Good To Go, necesitamos preparar el panel operativo del comercio (/merchant/dashboard) para soportar cadenas o empresas con múltiples sucursales (Multi-Store Architecture). Un solo propietario comercial (MERCHANT) puede gestionar varias tiendas físicas, cada una con su propio inventario efímero, coordenadas espaciales y ventana horaria de recogida.

Tarea: Escribe el código estructurado para implementar la gestión y conmutación de sucursales en el frontend del comercio dividiendo la solución en tres partes:
1. Proveedor de Estado de Sucursal (StoreContext.jsx)

    Crea un Contexto de React que al montarse consulte las sucursales vinculadas al usuario activo en Supabase.

    Debe mantener los estados: stores (array con todas las sucursales del usuario), activeStore (el objeto de la sucursal seleccionada actualmente) y isLoadingStores.

    Al inicializarse, si hay tiendas disponibles, debe seleccionar la primera por defecto o recuperar la última sucursal visitada desde localStorage.

2. Componente de Selección en Cabecera (MerchantBranchSelector.jsx)

    Un componente estilizado para la barra de navegación superior del comercio.

    Si stores.length === 1, renderiza únicamente una etiqueta estática discreta con el nombre del local.

    Si stores.length > 1, renderiza un botón desplegable de alta visibilidad (estilo Dropdown) que muestre el nombre de la tienda activa y permita conmutar a cualquier otra sucursal de la lista. Incluye una opción al final del menú rotulada "+ Agregar nueva sucursal" que redirija al wizard de configuración de local (/merchant/onboarding?mode=new_branch).

3. Refactorización del Consumo en Dashboard (MerchantMainDashboard.jsx)

    Modifica la vista principal del comercio para que consuma useStoreContext().

    Asegura que todas las peticiones al backend para modificar inventario (PATCH /api/merchant/stock) o consultar pedidos en vivo adjunten obligatoriamente el parámetro storeId: activeStore.id.

    Cuando activeStore cambie en el contexto, el dashboard debe mostrar un estado de transición de carga e invalidar o refrescar automáticamente las consultas de stock y pedidos de la nueva ubicación.

Restricciones: * No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código, textos de botones o comentarios generados. Utiliza iconos vectoriales limpios de lucide-react (como iconos de tienda, flechas de alternancia y signos de suma).

    Escribe estrictamente código funcional en React con Hooks, asegurando la propagación limpia del estado sin causar bucles de renderizado infinitos (useEffect con dependencias optimizadas).

Formato de salida: Entrega directamente los bloques de código limpios y modulares para StoreContext.jsx y MerchantBranchSelector.jsx. Al concluir, haz una única pregunta técnica clave sobre qué nivel de aislamiento implementaremos si decidimos permitir que el dueño de la empresa le asigne un rol de solo lectura o acceso restringido al empleado de mostrador de una sucursal en específico.