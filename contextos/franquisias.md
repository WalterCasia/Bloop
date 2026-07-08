Rol: Actúa como Arquitecto Full-Stack Senior y Especialista en Sistemas Multi-Tenant B2B, experto en React.js, Tailwind CSS, Fastify y Supabase (PostgreSQL/PostGIS).

Contexto: En nuestra aplicación web de rescate de excedentes de comida (estilo Too Good To Go), un comerciante con una cuenta matriz (Organización) necesita poder crear nuevas sucursales físicas (Franquicias) desde su panel operativo. Ya contamos con un esquema de base de datos donde la tabla `organizations` se relaciona con la tabla `stores` (sucursales) y los permisos se manejan en `merchant_users`.

Tarea: Desarrolla el flujo completo (Frontend y Backend) para la creación de una nueva sucursal, dividido en dos entregables:

1. Endpoint de Backend (Fastify): Crea la ruta `POST /api/merchant/stores`.
   - Validaciones: El cuerpo de la petición debe requerir `name` (Nombre de la sucursal), `address` (Dirección física), `latitude` y `longitude` (Coordenadas geodésicas).
   - Base de Datos (Supabase): El endpoint debe insertar un nuevo registro en la tabla `stores`. Debe utilizar la función PostGIS para convertir `latitude` y `longitude` al formato de punto espacial (`POINT(lng lat)`) en la columna `location`.
   - Permisos: Tras crear la tienda, debe insertar automáticamente un registro en la tabla `merchant_users` asignando el ID de la nueva tienda y el ID del usuario autenticado con el rol de `OWNER` o `MANAGER`.

2. Formulario de Frontend (React.js): Crea el componente `MerchantBranchCreator.jsx`.
   - Layout: Un formulario limpio y estructurado en una sola columna centrado en pantalla, utilizando clases puras de Tailwind CSS (sin dependencias UI externas pesadas).
   - Campos de Texto: Inputs estilizados para "Nombre de la Sucursal" y "Dirección Completa".
   - Selector Geográfico (Mapbox): Integra el componente `<Map />` de `react-map-gl` que permita al usuario arrastrar un marcador (Pin) sobre el mapa para fijar exactamente las coordenadas de la nueva tienda. Guarda estas coordenadas en el estado del formulario.
   - Acciones: Un botón de "Guardar Sucursal" que dispare la petición `POST` hacia Fastify. Debe manejar los estados de carga (`isLoading`) deshabilitando el botón y mostrando un texto de "Guardando...". Al recibir un HTTP 201 (Created), debe actualizar el contexto global `StoreContext` para incluir la nueva tienda.

Restricciones:
- PROHIBICIÓN ESTRICTA: No utilices emojis en ninguna parte del código generado, ni en los textos de la interfaz, comentarios o explicaciones. Utiliza iconos de `lucide-react` si requieres apoyos visuales.
- Escribe el frontend utilizando componentes funcionales de React con Hooks (`useState`, `useCallback`).
- Escribe el backend de Fastify con un manejo robusto de bloques `try/catch` y respuestas de error estandarizadas.

Recomendación Arquitectónica para este Módulo

Al incluir Mapbox en el formulario de creación, te aseguras de que las coordenadas guarden una precisión milimétrica. Esto es crítico porque el algoritmo de búsqueda de tu aplicación (B2C) dependerá exclusivamente de la columna location de PostGIS para calcular los "X kilómetros a la redonda" que el cliente configuró en sus preferencias.