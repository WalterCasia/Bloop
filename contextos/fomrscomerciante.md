Rol: Actúa como Arquitecto Frontend Senior y Especialista en UX/UI, experto en React.js, Tailwind CSS y validación de formularios interactivos.

Contexto: Hemos implementado un layout de onboarding inmersivo estilo "Airbnb" (`OnboardingLayout.jsx`) con una barra inferior que contiene el botón "Siguiente". Ahora necesitamos construir el flujo específico para cuando un usuario selecciona "Soy Propietario / Gerente". Este flujo debe dividir la creación de la nueva sucursal en pasos individuales (Progressive Disclosure) y aplicar validación estricta en cada pantalla antes de permitir avanzar.

Tarea: Desarrolla el componente `MerchantStoreWizard.jsx` y sus subcomponentes de pasos. El componente debe gestionar un estado centralizado (ej. `storeData`) e inyectar el contenido en el `OnboardingLayout`. 

Implementa los siguientes 3 pasos secuenciales:

1. Paso 1: Información Básica (`StoreBasicInfoStep.jsx`)
   - Interfaz: Un título gigante "¿Cómo se llama tu negocio?".
   - Campos: Dos inputs de texto grandes, con bordes limpios y texto flotante o placeholders claros: "Nombre de la tienda/sucursal" y "Número de teléfono de contacto".
   - Validación: El botón "Siguiente" del layout padre solo debe habilitarse si el nombre tiene más de 2 caracteres y el teléfono tiene un formato válido (mínimo 8 dígitos).

2. Paso 2: Ubicación Exacta (`StoreLocationStep.jsx`)
   - Interfaz: Título gigante "¿Dónde está ubicado?".
   - Campos: Un input de texto para la "Dirección física completa".
   - Mapa Interactivo: Debajo del input, renderiza un mapa utilizando `react-map-gl` (Mapbox) centrado por defecto en Guatemala (Lat: 14.6349, Lng: -90.5069). El usuario debe poder arrastrar el mapa para ubicar un marcador central (Pin) en su posición exacta.
   - Validación: El botón "Siguiente" se habilita solo si el input de dirección no está vacío y si las coordenadas (latitude, longitude) han sido registradas en el estado local.

3. Paso 3: Categoría y Horarios (`StoreCategoryStep.jsx`)
   - Interfaz: Título gigante "Casi listos. ¿Qué ofreces y a qué hora cierras?".
   - Categoría: Una cuadrícula de 3 tarjetas seleccionables: "Panadería / Pastelería", "Restaurante", "Supermercado". (El usuario debe seleccionar una).
   - Horarios: Dos inputs de tipo "time" nativos para definir el `pickup_start` y el `pickup_end` (Ventana de recogida por defecto).
   - Validación: Debe haber una categoría seleccionada y la hora de fin debe ser estrictamente mayor a la hora de inicio. Al completar esto, el botón del layout cambia de "Siguiente" a "Crear Sucursal".
   
4. Acción Final: Al hacer clic en "Crear Sucursal", muestra un estado visual de carga (bloqueando la pantalla) y ejecuta la función asíncrona para guardar el objeto `storeData` en Supabase/Fastify.

Restricciones:
- PROHIBICIÓN ESTRICTA: Cero uso de emojis en todo el código, comentarios y textos legibles por el usuario.
- Utiliza la librería `lucide-react` para iconos descriptivos en los inputs (ej. teléfono, marcador de mapa, reloj).
- Mantén el diseño de los inputs nativo con Tailwind, utilizando estilos para los estados `:focus` (ej. `focus:ring-2 focus:ring-black focus:outline-none`).
- Extrae la lógica de validación utilizando `useEffect` en cada subcomponente para emitir un flag `isValid` hacia el componente padre (`MerchantStoreWizard`), quien controla la propiedad `disabled` del botón "Siguiente" en el layout.