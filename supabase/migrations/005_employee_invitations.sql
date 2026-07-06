-- Migración: Tabla de Invitaciones de Empleados
-- Propósito: Almacenar los códigos de invitación generados por los dueños para sus empleados.

CREATE TABLE IF NOT EXISTS public.store_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.store_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas (RLS)
-- Los dueños pueden ver y crear invitaciones para sus propias tiendas
DROP POLICY IF EXISTS "invitations_owner_policy" ON public.store_invitations;
CREATE POLICY "invitations_owner_policy" ON public.store_invitations FOR ALL
USING (
  (SELECT owner_id FROM public.stores WHERE id = store_invitations.store_id) = auth.uid()
);

-- Todos los usuarios autenticados o anónimos no pueden consultar directamente esta tabla.
-- La validación del código (canje) se hará a través del backend usando la llave de servicio de Supabase o ignorando RLS en el backend,
-- porque el empleado aún no tiene cuenta o rol cuando intenta validar el código.
