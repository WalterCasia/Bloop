-- ==========================================
-- SCRIPT DE DATOS SEMILLA (Seed Data)
-- ==========================================
-- Instrucciones: Ejecute este script en el SQL Editor de su panel de Supabase.
-- Generará usuarios ficticios (1 Cliente, 2 Comercios) y Packs Sorpresa activos.
-- Las ubicaciones de ejemplo están en el centro de la Ciudad de México.

-- 1. Insertar usuarios en auth.users (Requerido por la llave foránea de profiles)
-- Nota: La contraseña para estos usuarios no es válida para iniciar sesión vía UI,
-- sirven exclusivamente para visualizar y probar el mapa y los endpoints.

INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at
) VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente@bloop.com', 'dummy_hash', NOW(), NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'panaderia@bloop.com', 'dummy_hash', NOW(), NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sushi@bloop.com', 'dummy_hash', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Perfiles (Profiles)
-- Se define el rol, los datos personales y, en el caso de los comercios, las coordenadas.
-- Formato ST_GeomFromText: 'POINT(longitud latitud)'

INSERT INTO public.profiles (
    id, 
    role, 
    full_name, 
    store_name, 
    description, 
    address, 
    location
) VALUES 
    -- Cliente (No requiere ubicación ni datos de tienda)
    (
        '11111111-1111-1111-1111-111111111111', 
        'CLIENTE', 
        'Juan Pérez', 
        NULL, 
        NULL, 
        NULL, 
        NULL
    ),
    -- Comercio 1: Panadería
    (
        '22222222-2222-2222-2222-222222222222', 
        'COMERCIO', 
        'María López', 
        'Panadería La Central', 
        'Elaboramos pan dulce tradicional, bolillos y pasteles frescos todos los días.', 
        'Av. Juárez 15, Centro, CDMX', 
        ST_GeomFromText('POINT(-99.141315 19.434057)', 4326) -- Palacio de Bellas Artes aprox.
    ),
    -- Comercio 2: Restaurante de Sushi
    (
        '33333333-3333-3333-3333-333333333333', 
        'COMERCIO', 
        'Carlos Tanaka', 
        'Sushi Express', 
        'Rollos y bowls asiáticos listos para llevar.', 
        'Calle Sonora 20, Condesa, CDMX', 
        ST_GeomFromText('POINT(-99.169123 19.416801)', 4326) -- Parque México aprox.
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Packs Sorpresa (Surprise Packs)
-- Los horarios de recogida se establecen en el futuro (HOY, en unas horas) para que sean visibles y válidos.

INSERT INTO public.surprise_packs (
    store_id, 
    title, 
    description, 
    original_price, 
    discounted_price, 
    pickup_start_time, 
    pickup_end_time, 
    total_quantity, 
    available_quantity, 
    is_active
) VALUES 
    -- Pack 1 (Panadería)
    (
        '22222222-2222-2222-2222-222222222222', 
        'Pack de Pan Dulce Variado', 
        'Incluye al menos 4 piezas de pan dulce del día (conchas, orejas, donas).', 
        60.00, 
        20.00, 
        NOW() + INTERVAL '2 hours', 
        NOW() + INTERVAL '4 hours', 
        5, 
        5, 
        true
    ),
    -- Pack 2 (Panadería - Salado)
    (
        '22222222-2222-2222-2222-222222222222', 
        'Pack Salado (Bolillos y Teleras)', 
        'Excedente de bolillos y teleras perfectos para tortas.', 
        40.00, 
        10.00, 
        NOW() + INTERVAL '1 hour', 
        NOW() + INTERVAL '3 hours', 
        3, 
        3, 
        true
    ),
    -- Pack 3 (Sushi)
    (
        '33333333-3333-3333-3333-333333333333', 
        'Rollos del Día', 
        'Puede contener rollos california, empanizados o sushi bowls.', 
        150.00, 
        49.00, 
        NOW() + INTERVAL '5 hours', 
        NOW() + INTERVAL '6 hours', 
        2, 
        2, 
        true
    );
