-- Agregar columna stripe_account_id a la tabla stores para vincular cuentas de Stripe Connect
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);

-- Opcional: Índice para búsquedas rápidas al recibir webhooks de Stripe
CREATE INDEX IF NOT EXISTS idx_stores_stripe_account_id ON public.stores(stripe_account_id);
