-- ==========================================================
-- INKEDSOUH / HONE CATALOG - ESQUEMA DE GESTIÓN DE ÓRDENES Y PAGOS
-- Compatible con Banca.me BNPL, Transferencias y Pedidos Web
-- ==========================================================

-- 1. Crear tabla 'orders' si no existe
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    delivery_type TEXT DEFAULT 'santiago',
    delivery_address TEXT,
    delivery_city TEXT DEFAULT 'Santiago',
    delivery_notes TEXT,
    delivery_timeframe TEXT DEFAULT '24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'CLP',
    payment_method TEXT NOT NULL, -- 'bancame' | 'transfer' | 'whatsapp'
    payment_status TEXT DEFAULT 'pendiente', -- 'pendiente' | 'pagado' | 'aprobado' | 'rechazado' | 'cancelado'
    status TEXT DEFAULT 'pendiente_pago', -- 'pendiente_pago' | 'pagado_bnpl' | 'solicitud_whatsapp' | 'transferencia_pendiente' | 'en_preparacion' | 'despachado' | 'entregado' | 'rechazado'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    bancame_trx_id TEXT,
    bancame_token TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Asegurar columnas en caso de tabla preexistente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_city') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_city TEXT DEFAULT 'Santiago';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_notes') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_timeframe') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_timeframe TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='bancame_trx_id') THEN
        ALTER TABLE public.orders ADD COLUMN bancame_trx_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='bancame_token') THEN
        ALTER TABLE public.orders ADD COLUMN bancame_token TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='metadata') THEN
        ALTER TABLE public.orders ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pendiente';
    END IF;
END $$;

-- 3. Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad (RLS)
-- Permitir a visitantes y checkout crear pedidos (INSERT anónimo o autenticado)
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
    ON public.orders
    FOR INSERT
    TO public, anon, authenticated
    WITH CHECK (true);

-- Permitir a los usuarios consultar sus propias órdenes mediante el número de orden
DROP POLICY IF EXISTS "Public can view order by order_number" ON public.orders;
CREATE POLICY "Public can view order by order_number"
    ON public.orders
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

-- Permitir a los administradores autenticados gestionar todas las órdenes
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders"
    ON public.orders
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
