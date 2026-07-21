-- ========================================================
-- INKEDSOUH - Supabase Database Schema
-- Pega este script en el SQL Editor de tu proyecto Supabase
-- ========================================================

-- 1. Tabla de Reservas (Bookings)
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    tattoo_details TEXT NOT NULL,
    requested_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'rescheduled')),
    reschedule_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Productos (Products)
CREATE TABLE public.products (
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

-- 3. Tabla de Caché de Instagram (Instagram Gallery)
CREATE TABLE public.instagram_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ig_id TEXT UNIQUE NOT NULL,
    media_url TEXT NOT NULL,
    permalink TEXT,
    media_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_cache ENABLE ROW LEVEL SECURITY;

-- Políticas para Bookings
-- Todo el mundo puede insertar una reserva (Cotizar)
CREATE POLICY "Allow public insert on bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Solo admin (usuarios logueados) puede leer o modificar reservas
CREATE POLICY "Allow auth read on bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth update on bookings" ON public.bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow auth delete on bookings" ON public.bookings FOR DELETE TO authenticated USING (true);

-- Políticas para Products
-- Todo el mundo puede ver productos
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT TO anon, authenticated USING (true);
-- Solo admin puede modificar productos
CREATE POLICY "Allow auth insert on products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth update on products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow auth delete on products" ON public.products FOR DELETE TO authenticated USING (true);

-- Políticas para Instagram Cache
-- Todo el mundo puede ver la galería
CREATE POLICY "Allow public read on instagram_cache" ON public.instagram_cache FOR SELECT TO anon, authenticated USING (true);
-- Solo admin puede actualizar la caché de Instagram
CREATE POLICY "Allow auth all on instagram_cache" ON public.instagram_cache FOR ALL TO authenticated USING (true);

-- ========================================================
-- STORAGE (Para subir fotos de productos y otros archivos)
-- ========================================================
-- Crear un bucket llamado 'admin_uploads'
INSERT INTO storage.buckets (id, name, public) VALUES ('admin_uploads', 'admin_uploads', true);

-- Políticas del Bucket 'admin_uploads'
CREATE POLICY "Allow public view admin_uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'admin_uploads');
CREATE POLICY "Allow auth insert admin_uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'admin_uploads');
CREATE POLICY "Allow auth update admin_uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'admin_uploads');
CREATE POLICY "Allow auth delete admin_uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'admin_uploads');
