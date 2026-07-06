-- Migración: Implementación de Control de Acceso Basado en Roles (RBAC) para Entorno Multi-Store
-- Propósito: Restringir acceso de empleados únicamente a la sucursal asignada utilizando RLS.

-- 1. Agregar las columnas de jerarquía comercial a la tabla de perfiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS merchant_role VARCHAR(20) DEFAULT 'OWNER' CHECK (merchant_role IN ('OWNER', 'EMPLOYEE')),
ADD COLUMN IF NOT EXISTS assigned_store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- 2. Habilitar RLS en las tablas afectadas si no estaban habilitadas
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para la tabla STORES (Tiendas)
-- El dueño puede ver sus tiendas, el empleado solo ve la tienda asignada.
CREATE POLICY "stores_select_policy" ON stores FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  id = (SELECT assigned_store_id FROM profiles WHERE id = auth.uid())
);

-- Solo el dueño puede editar o crear nuevas tiendas.
CREATE POLICY "stores_modify_policy" ON stores FOR ALL 
USING (owner_id = auth.uid());

-- 4. Políticas para la tabla PACKS (Inventario Diario)
-- Ver los packs: Dueño de la tienda, Empleado asignado o Cliente (todos públicos)
-- Omitiremos la regla SELECT pública si ya existe, pero aseguramos la de modificación:

-- Editar/Crear Packs: 
-- A. El auth.uid() debe coincidir con el owner_id de la tabla stores relacionada.
-- B. O el auth.uid() debe ser un EMPLOYEE cuyo assigned_store_id coincide con el store_id del pack.
CREATE POLICY "packs_modify_policy" ON packs FOR ALL 
USING (
  -- Es el dueño
  (SELECT owner_id FROM stores WHERE id = packs.store_id) = auth.uid()
  OR
  -- O es un empleado autorizado para esta sucursal exacta
  (
    (SELECT merchant_role FROM profiles WHERE id = auth.uid()) = 'EMPLOYEE' AND
    (SELECT assigned_store_id FROM profiles WHERE id = auth.uid()) = packs.store_id
  )
);

-- 5. Políticas para la tabla ORDERS (Pedidos y Reservas)
-- El dueño ve y gestiona los pedidos de TODAS sus tiendas. El empleado solo las de su tienda.
CREATE POLICY "orders_merchant_policy" ON orders FOR ALL 
USING (
  -- Es el dueño de la tienda donde se hizo el pedido
  (SELECT owner_id FROM stores WHERE id = orders.store_id) = auth.uid()
  OR
  -- Es el empleado asignado a la tienda donde se hizo el pedido
  (
    (SELECT merchant_role FROM profiles WHERE id = auth.uid()) = 'EMPLOYEE' AND
    (SELECT assigned_store_id FROM profiles WHERE id = auth.uid()) = orders.store_id
  )
);
