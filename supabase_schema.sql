-- ========================================================
-- INKEDSOUH - Supabase Database Schema (Seguro & Optimizado)
-- Pega este script en el SQL Editor de tu proyecto Supabase
-- ========================================================

-- 1. Tabla de Reservas (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    service_type TEXT NOT NULL DEFAULT 'general',
    tattoo_details TEXT NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TEXT,
    reference_url TEXT,
    consent_data JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'rescheduled')),
    reschedule_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Bloqueos Manuales de Agenda (Manual Blocks - Vice Feature)
CREATE TABLE IF NOT EXISTS public.manual_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    block_date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    reason TEXT DEFAULT 'No disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Productos (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    old_price NUMERIC,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Caché de Instagram (Instagram Gallery)
CREATE TABLE IF NOT EXISTS public.instagram_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ig_id TEXT UNIQUE NOT NULL,
    media_url TEXT NOT NULL,
    permalink TEXT,
    media_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Configuraciones del Sitio (Site Settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) & SEGURIDAD ANTI-VULNERABILIDADES
-- ========================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para Bookings
-- Público sólo puede insertar cotizaciones/reservas
CREATE POLICY "Allow public insert on bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Solo administradores autenticados pueden leer o modificar reservas
CREATE POLICY "Allow auth read on bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth update on bookings" ON public.bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow auth delete on bookings" ON public.bookings FOR DELETE TO authenticated USING (true);

-- Políticas para Manual Blocks
CREATE POLICY "Allow public read on manual_blocks" ON public.manual_blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all on manual_blocks" ON public.manual_blocks FOR ALL TO authenticated USING (true);

-- Políticas para Products
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth insert on products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth update on products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow auth delete on products" ON public.products FOR DELETE TO authenticated USING (true);

-- Políticas para Instagram Cache
CREATE POLICY "Allow public read on instagram_cache" ON public.instagram_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all on instagram_cache" ON public.instagram_cache FOR ALL TO authenticated USING (true);

-- Políticas para Site Settings
CREATE POLICY "Allow public read on site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all on site_settings" ON public.site_settings FOR ALL TO authenticated USING (true);

-- ========================================================
-- STORAGE (Bucket seguro para referencias y uploads)
-- ========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('admin_uploads', 'admin_uploads', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public view admin_uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'admin_uploads');
CREATE POLICY "Allow public upload references" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'admin_uploads');
CREATE POLICY "Allow auth update admin_uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'admin_uploads');
CREATE POLICY "Allow auth delete admin_uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'admin_uploads');
