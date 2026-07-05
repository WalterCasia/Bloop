Rol:

Actúa como un Desarrollador Full-Stack Senior y Especialista en Arquitectura UX/UI experto en React.js, Tailwind CSS, gestión de estado con Supabase Auth y control de rutas protegidas.

Contexto:

En nuestra aplicación web estilo Too Good To Go, los usuarios pueden registrarse mediante autenticación social universal (Google OAuth). Al crearse la cuenta por primera vez en Supabase, el campo role en la tabla profiles queda vacío (null o PENDING). Para replicar el modelo de perfilado progresivo de plataformas como Upwork, necesitamos interceptar a estos usuarios incompletos antes de entrar a la plataforma y mostrarles una pantalla visual de selección de rol que actualice su perfil y los redirija al flujo correspondiente.

Tarea:

Escribe el código completo para dos piezas fundamentales del sistema de onboarding:

    RoleSelectionOnboarding.jsx: Un componente de pantalla completa que se renderice en la ruta /onboarding. Debe mostrar dos tarjetas de selección visualmente interactivas y accesibles:

        Opción A (Cliente): Enfocada en salvar comida y ahorrar dinero.

        Opción B (Comercio): Enfocada en registrar un local y vender excedentes del día.

        Al seleccionar una tarjeta y presionar el botón de confirmación ("Continuar"), el componente debe ejecutar una petición de actualización en Supabase (supabase.from('profiles').update({ role: selectedRole }).eq('id', user.id) o llamar a nuestro endpoint en Fastify PATCH /api/users/profile). Una vez confirmado exitosamente el cambio en la base de datos, si el rol elegido fue CLIENT, redirigir al mapa (/app/explore); si fue MERCHANT, redirigir al formulario de configuración inicial de la tienda (/merchant/onboarding).

    Actualización de Guardia de Ruta (ProtectedRoute.jsx o enrutador principal): Modifica la lógica de verificación post-login para que, si un usuario autenticado intenta acceder a cualquier ruta privada del sistema pero su columna role en la base de datos es null, sea redirigido de forma obligatoria y automática hacia /onboarding.

Restricciones:

    No utilices emojis en absolutamente ninguna parte de tus respuestas ni dentro del código generado.

    Escribe exclusivamente en React funcional utilizando Hooks (useState, useEffect), maquetando la interfaz únicamente con utilidades puras de Tailwind CSS.

    Las tarjetas de opción deben contar con estados visuales claros de selección (cambio en color de borde, sombreado y un indicador radial de selección) para garantizar accesibilidad y feedback inmediato al hacer clic.

    El botón de confirmación debe permanecer deshabilitado (disabled) hasta que el usuario haya seleccionado explícitamente una de las dos opciones, y debe mostrar un estado de carga (isLoading) durante la actualización en la base de datos para evitar envíos duplicados.

Formato de salida:

Entrega los bloques de código funcional para RoleSelectionOnboarding.jsx y la lógica de intercepción del enrutador en bloques de código limpios listos para implementarse. Al recibir este prompt, genera el código solicitado y cierra respondiendo única y exclusivamente con una pregunta clave sobre si los usuarios podrán cambiar su rol más adelante desde la pantalla de configuración de su perfil o si esta decisión será permanente.