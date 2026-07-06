-- Migración: Arquitectura Multi-Store y Control de Acceso (RBAC) para Empleados
-- Propósito: Extraer la entidad "Sucursal" de los Perfiles y crear la jerarquía de Empleados mediante RLS.

-- 1. Crear la nueva tabla STORES (Sucursales)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),
    cover_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrar los comercios existentes (del modelo antiguo) a la nueva tabla STORES
-- Esto toma los datos de la tienda que estaban directamente en el perfil del DUEÑO y crea su primera sucursal.
INSERT INTO public.stores (owner_id, name, address, location, cover_url)
SELECT id, store_name, address, location, cover_url 
FROM public.profiles 
WHERE role = 'COMERCIO' AND store_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Modificar las dependencias (Packs y Órdenes) para que apunten a STORES en lugar de PROFILES
-- Eliminamos las llaves foráneas antiguas
ALTER TABLE public.surprise_packs DROP CONSTRAINT IF EXISTS surprise_packs_store_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;

-- Actualizamos los IDs de store_id para que coincidan con los nuevos IDs de la tabla stores generada en el paso 2
UPDATE public.surprise_packs sp 
SET store_id = s.id 
FROM public.stores s 
WHERE sp.store_id = s.owner_id;

UPDATE public.orders o 
SET store_id = s.id 
FROM public.stores s 
WHERE o.store_id = s.owner_id;

-- Añadimos las llaves foráneas corregidas
ALTER TABLE public.surprise_packs 
  ADD CONSTRAINT surprise_packs_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;

-- 4. Agregar las columnas de jerarquía comercial a la tabla de perfiles (Para Empleados)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS merchant_role VARCHAR(20) DEFAULT 'OWNER' CHECK (merchant_role IN ('OWNER', 'EMPLOYEE')),
ADD COLUMN IF NOT EXISTS assigned_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- 5. Habilitar RLS en las tablas afectadas
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. Políticas (RLS) para la tabla STORES (Tiendas)
-- El dueño puede ver sus tiendas, el empleado solo ve la tienda asignada.
DROP POLICY IF EXISTS "stores_select_policy" ON public.stores;
CREATE POLICY "stores_select_policy" ON public.stores FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  id = (SELECT assigned_store_id FROM profiles WHERE id = auth.uid())
);

-- Solo el dueño puede editar o crear nuevas tiendas.
DROP POLICY IF EXISTS "stores_modify_policy" ON public.stores;
CREATE POLICY "stores_modify_policy" ON public.stores FOR ALL 
USING (owner_id = auth.uid());

-- 7. Políticas para la tabla SURPRISE_PACKS (Inventario)
-- El dueño puede modificar los packs de su tienda, o el empleado asignado a ESA tienda exacta.
DROP POLICY IF EXISTS "packs_modify_policy" ON public.surprise_packs;
CREATE POLICY "packs_modify_policy" ON public.surprise_packs FOR ALL 
USING (
  (SELECT owner_id FROM public.stores WHERE id = surprise_packs.store_id) = auth.uid()
  OR
  (
    (SELECT merchant_role FROM profiles WHERE id = auth.uid()) = 'EMPLOYEE' AND
    (SELECT assigned_store_id FROM profiles WHERE id = auth.uid()) = surprise_packs.store_id
  )
);

-- 8. Políticas para la tabla ORDERS (Pedidos)
-- El dueño gestiona todos los pedidos de todas sus sucursales. El empleado solo su sucursal.
DROP POLICY IF EXISTS "orders_merchant_policy" ON public.orders;
CREATE POLICY "orders_merchant_policy" ON public.orders FOR ALL 
USING (
  (SELECT owner_id FROM public.stores WHERE id = orders.store_id) = auth.uid()
  OR
  (
    (SELECT merchant_role FROM profiles WHERE id = auth.uid()) = 'EMPLOYEE' AND
    (SELECT assigned_store_id FROM profiles WHERE id = auth.uid()) = orders.store_id
  )
);
