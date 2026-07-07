Rol:

Actúa como un Desarrollador Full-Stack Senior y Especialista en Arquitectura UX/UI experto en React.js con Hooks avanzados (useState, useCallback), Tailwind CSS, Mapbox GL JS (react-map-gl) y Supabase Auth.

Contexto:

En nuestra aplicación web transaccional estilo Too Good To Go, necesitamos construir los procesos de configuración inicial post-registro (Onboarding) tanto para clientes (CLIENT) como para negocios aliados (MERCHANT). Para garantizar una excelente experiencia de usuario y evitar la fatiga por formularios largos en una sola página, debemos programar ambos flujos como componentes tipo Wizard progresivos (Multi-Step Forms) con barras de progreso, navegación por pantallas internas y validación paso a paso antes del envío final a la base de datos de Supabase y nuestro servidor en Fastify.

Tarea:

Escribe el código estructurado en React.js y Tailwind CSS para construir los dos módulos de onboarding divididos en subpantallas:
1. Componente ClientOnboardingWizard.jsx (Ruta /onboarding/client)

Implementa un wizard gestionado por un estado local currentStep que vaya del paso 1 al 2:

    Paso 1 (Identidad): Muestra una barra superior de progreso al 50%. Solicita obligatoriamente el nombre de pila y opcionalmente el teléfono móvil. Incluye validación local antes de habilitar el botón "Continuar al Paso 2".

    Paso 2 (Geolocalización): Muestra la barra al 100%. Contiene un botón de acción destacada para capturar coordenadas GPS locales mediante navigator.geolocation, un input de texto para ubicación manual y un control deslizante (<input type="range" />) para ajustar el radio de búsqueda (de 1 a 30 km).

    Finalización: Al confirmar el paso 2, ejecuta una única petición de actualización hacia Supabase guardando el perfil y marcando onboarding_completed = true, redirigiendo posteriormente hacia /app/explore.

2. Componente MerchantOnboardingWizard.jsx (Ruta /onboarding/merchant)

Implementa un wizard progresivo que gestione 3 pantallas lógicas (currentStep de 1 a 3):

    Paso 1 (Perfil Operativo): Barra al 33%. Campos obligatorios para Nombre Comercial del Establecimiento, Nombre del Responsable Legal, Teléfono Operativo directo y un selector visual en formato cuadrícula para definir la Categoría del negocio (Panadería, Restaurante, Supermercado, Cafetería).

    Paso 2 (Geocodificación con Mapbox): Barra al 66%. Renderiza un input de dirección en texto. Al procesarse, simula o conecta con nuestro endpoint Fastify de geocodificación para renderizar un mapa de Mapbox incrustado centrado en las coordenadas obtenidas. El comerciante debe poder ajustar el marcador del local arrastrándolo (onMarkerDragEnd) para garantizar una exactitud geodésica perfecta antes de poder pulsar "Siguiente".

    Paso 3 (Logística y Liquidación): Barra al 100%. Selectores estrictos para configurar la ventana horaria predeterminada de entrega de excedentes (start_time y end_time), junto con los campos de Razón Social y Número de Cuenta Bancaria/Tributaria.

    Finalización: Reúne el objeto del formulario local completo de los 3 pasos, ejecuta el endpoint para persistir el punto geodésico en PostGIS (SRID 4326) en la tabla de Supabase, actualiza onboarding_completed = true y redirige hacia /merchant/dashboard.

Restricciones:

    No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código, etiquetas o textos generados.

    Escribe exclusivamente componentes de React funcional, garantizando que el usuario pueda presionar el botón de "Atrás" en los pasos superiores para corregir datos ingresados en pantallas previas sin perder su estado local precargado en memoria.

    Asegura un contraste visual de alto estándar con Tailwind CSS y bloquea transiciones de paso si los campos de la pantalla actual están incompletos o violan reglas de validación básicas.

Formato de salida:

Entrega directamente los bloques de código limpios y modulares para ClientOnboardingWizard.jsx y MerchantOnboardingWizard.jsx. Al finalizar de generar el código, haz una única pregunta técnica clave sobre cómo implementaremos la persistencia temporal en localStorage por si el comerciante refresca accidentalmente su navegador (F5) cuando se encuentra en el Paso 2 o 3 de su wizard.