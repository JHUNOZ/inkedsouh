-- ========================================================
-- INKEDSOUH - Corrección y optimización para tabla 'bookings'
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- para habilitar todas las columnas de citas y permisos públicos
-- ========================================================

-- 1. Agregar columnas si no existen
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requested_time TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'general';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_url TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS consent_data JSONB;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

-- 2. Asegurar que tattoo_details permita texto vacío sin romper el NOT NULL
ALTER TABLE public.bookings ALTER COLUMN tattoo_details DROP NOT NULL;

-- 3. Habilitar RLS y otorgar permisos de inserción para visitantes (anon) y autenticados
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on bookings" ON public.bookings;
CREATE POLICY "Allow public insert on bookings" 
    ON public.bookings 
    FOR INSERT 
    TO public, anon, authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read own bookings" ON public.bookings;
CREATE POLICY "Allow public read own bookings" 
    ON public.bookings 
    FOR SELECT 
    TO public, anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Allow auth all on bookings" ON public.bookings;
CREATE POLICY "Allow auth all on bookings" 
    ON public.bookings 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
