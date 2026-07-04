-- Habilitar extensión PostGIS en Supabase para consultas geoespaciales
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tipos Enumerados (ENUMS) para roles y estados de pedido
CREATE TYPE public.user_role AS ENUM ('CLIENTE', 'COMERCIO', 'ADMIN');
CREATE TYPE public.order_status AS ENUM ('PENDIENTE', 'PAGADO', 'RECOGIDO', 'CANCELADO');

-- Tabla unificada de Perfiles (Usuarios y Comercios)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'CLIENTE',
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    avatar_url VARCHAR(255),
    
    -- Campos específicos para Comercios (pueden ser nulos si el rol es CLIENTE)
    store_name VARCHAR(255),
    description TEXT,
    address VARCHAR(255),
    -- Columna geográfica usando el SRID 4326 estandar (GPS)
    location GEOGRAPHY(POINT, 4326),
    cover_url VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restricción para garantizar que los perfiles de comercio tengan los datos obligatorios
    CONSTRAINT valid_store_profile CHECK (
        role != 'COMERCIO' OR (store_name IS NOT NULL AND address IS NOT NULL AND location IS NOT NULL)
    )
);

-- Índice GIST espacial para optimizar búsquedas geolocalizadas de comercios
CREATE INDEX idx_profiles_location ON public.profiles USING GIST (location) WHERE role = 'COMERCIO';

-- Tabla de Packs Sorpresa
CREATE TABLE public.surprise_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_price DECIMAL(10, 2) NOT NULL CHECK (original_price > 0),
    discounted_price DECIMAL(10, 2) NOT NULL CHECK (discounted_price >= 0 AND discounted_price < original_price),
    pickup_start_time TIMESTAMPTZ NOT NULL,
    pickup_end_time TIMESTAMPTZ NOT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restricción para asegurar rango de fechas válido
    CONSTRAINT valid_pickup_time CHECK (pickup_end_time > pickup_start_time)
);

-- Índices para optimizar consultas de inventario activo y por comercio
CREATE INDEX idx_surprise_packs_store_id ON public.surprise_packs(store_id);
CREATE INDEX idx_surprise_packs_pickup_time ON public.surprise_packs(pickup_start_time, pickup_end_time);
CREATE INDEX idx_surprise_packs_active ON public.surprise_packs(is_active) WHERE is_active = true;

-- Tabla de Pedidos (Reservas)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    pack_id UUID NOT NULL REFERENCES public.surprise_packs(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status public.order_status NOT NULL DEFAULT 'PENDIENTE',
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    qr_code_secret VARCHAR(255) NOT NULL, -- Código secreto que genera el QR
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para historial y gestión operativa de pedidos
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_pack_id ON public.orders(pack_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Función general para actualizar el timestamp en modificaciones
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de actualización para mantener consistencia de tiempos
CREATE TRIGGER update_profiles_modtime 
    BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_surprise_packs_modtime 
    BEFORE UPDATE ON public.surprise_packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    
CREATE TRIGGER update_orders_modtime 
    BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
