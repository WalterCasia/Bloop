Rol: Actúa como Arquitecto Full-Stack Senior y Especialista en Integraciones Financieras B2B, experto en React.js, Fastify y Stripe Connect API.

Contexto: Necesitamos construir el módulo de "Pagos y Liquidaciones" (`MerchantPaymentsView.jsx`) en el dashboard del comercio. La plataforma opera como un Marketplace multi-tenant, por lo que utilizaremos Stripe Connect (Express/Custom) para gestionar las subcuentas de los comerciantes y automatizar las transferencias. 

Tarea: Desarrolla el ciclo transaccional dividiéndolo en los siguientes entregables:

1. Backend - Gestión de Subcuentas (Fastify):
   - Crea el endpoint `POST /api/merchant/payments/onboarding`. Debe generar un "Account Link" de Stripe Connect para el ID del usuario/tienda activo y devolver la URL para redirigir al usuario al flujo seguro de Stripe.
   - Crea el endpoint `GET /api/merchant/payments/balance/:storeId`. Debe consultar la API de Stripe para recuperar el saldo pendiente y disponible en la subcuenta asociada al comerciante, devolviendo el objeto JSON al frontend.

2. Frontend - Vista Principal Financiera (React + Tailwind CSS):
   - Estado No Vinculado: Si la base de datos local indica que la tienda no tiene un `stripe_account_id` asociado, muestra un "Empty State" corporativo informando que debe configurar su cuenta bancaria para recibir ingresos. Incluye un botón primario negro "Vincular cuenta bancaria" que dispare el endpoint de onboarding.
   - Estado Vinculado (Panel Activo): Si la cuenta está activa, renderiza un layout dividido. En la parte superior, un contenedor destacado (`bg-gray-50 border border-gray-200 p-8 rounded-xl`) que muestre en tipografía gigante el "Saldo Pendiente de Liquidación".
   - Tabla de Historial: Debajo del saldo, maqueta la tabla de "Últimas transferencias" que incluya las columnas: Identificador de Liquidación, Fecha de depósito, Monto neto y Estado. Utiliza pastillas visuales (Pills) para los estados: verde tenue para "Completado" y amarillo/gris para "Procesando".

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero emojis en toda la respuesta, explicaciones, código fuente o interfaz gráfica. Emplea exclusivamente iconos vectoriales de `lucide-react` (ej. candados de seguridad, bancos, tarjetas).
- Todos los valores monetarios deben formatearse nativamente con `Intl.NumberFormat` ajustado a la moneda correspondiente de la operación.
- Queda totalmente prohibido modelar tablas en Supabase para almacenar información financiera sensible (números de cuenta, CLABE, IBAN). Toda esta carga de cumplimiento PCI-DSS debe delegarse a Stripe.