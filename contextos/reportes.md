Rol: Actúa como Arquitecto Full-Stack Senior y Analista de Datos, experto en React.js, Tailwind CSS, Fastify y PostgreSQL (Supabase).

Contexto: Necesitamos implementar el módulo de "Reportes Analíticos" (`MerchantReportsView.jsx`) para el dashboard del comercio B2B. El diseño debe basarse en la estética de datos de Uber Eats Manager: minimalista, de alto contraste y centrado en la legibilidad. 

Tarea: Desarrolla la arquitectura analítica full-stack dividida en los siguientes entregables:

1. Endpoint Backend (Fastify):
   - Crea la ruta `GET /api/merchant/reports/analytics`.
   - Parámetros de Query: `storeId`, `startDate` y `endDate`.
   - Lógica: Construye la consulta SQL (o Supabase JS client) para obtener dos conjuntos de datos: 
     A) Un objeto `summary` con la suma de ingresos (`total_revenue`), conteo de packs entregados (`packs_saved`) y packs cancelados.
     B) Un arreglo `timeseries` agrupando los ingresos y packs salvados por día dentro del rango.

2. Interfaz Visual (React + Tailwind CSS):
   - Cabecera: Título "Rendimiento y Reportes" y un selector nativo de fechas (`<input type="date" />`) para inicio y fin.
   - Tarjetas KPI: Cuadrícula superior (`grid-cols-4`) mostrando: Ventas Totales, Packs Salvados, Packs Cancelados y CO2 Evitado (Packs Salvados * 2.5kg).
   - Área de Gráfico: Integra la librería `recharts` para renderizar un gráfico de líneas (`LineChart`) responsivo que muestre la tendencia de ventas diarias consumiendo el arreglo `timeseries`.

3. Función de Exportación CSV:
   - Crea un botón negro sólido rotulado "Exportar a CSV".
   - Implementa una función utilitaria asíncrona que tome los datos brutos recibidos del backend, los formatee con cabeceras (Fecha, ID Pedido, Estado, Monto) y fuerce la descarga de un archivo `.csv` en el navegador del usuario utilizando `new Blob()`, sin requerir librerías externas.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero emojis en tu respuesta, en el código o en la interfaz. Utiliza `lucide-react` para iconos de gráficas y descarga.
- Formatea los valores monetarios estrictamente con `Intl.NumberFormat` para la moneda GTQ (Quetzales).
- Maneja los estados de carga (`isLoading`) mostrando un esqueleto visual (Skeleton) o un spinner mientras Fastify procesa los datos.