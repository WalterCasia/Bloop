-- Habilitar RLS (Row Level Security) en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Políticas para la tabla 'profiles'
-- ==========================================

-- 1. Lectura: Cualquier usuario puede ver los perfiles (necesario para mostrar los comercios en el mapa)
CREATE POLICY "Perfiles visibles para todos" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Inserción: Un usuario solo puede crear un perfil con su propio ID (asociado a auth.users)
CREATE POLICY "Usuarios pueden insertar su propio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Actualización: Un usuario solo puede modificar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- ==========================================
-- Políticas para la tabla 'surprise_packs'
-- ==========================================

-- 1. Lectura: Cualquier usuario puede ver los packs sorpresa
CREATE POLICY "Packs sorpresa visibles para todos" 
ON public.surprise_packs FOR SELECT 
USING (true);

-- 2. Modificación (INSERT, UPDATE, DELETE): Solo el comercio propietario puede gestionar sus propios packs
CREATE POLICY "Comercios gestionan sus propios packs" 
ON public.surprise_packs FOR ALL 
USING (auth.uid() = store_id);

-- ==========================================
-- Políticas para la tabla 'orders'
-- ==========================================

-- 1. Lectura: Los clientes ven sus propias reservas, los comercios ven las reservas hechas a su tienda
CREATE POLICY "Lectura de pedidos restringida a involucrados" 
ON public.orders FOR SELECT 
USING (auth.uid() = client_id OR auth.uid() = store_id);

-- 2. Inserción: Solo los clientes pueden generar un pedido y debe estar asociado a su propio ID
CREATE POLICY "Clientes pueden crear sus reservas" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = client_id);

-- 3. Actualización: Solo el comercio puede actualizar el estado del pedido (ej. confirmar recogida)
CREATE POLICY "Comercios pueden actualizar el estado de sus pedidos" 
ON public.orders FOR UPDATE 
USING (auth.uid() = store_id);
