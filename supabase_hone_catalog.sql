-- ========================================================
-- HONE CATALOG & PLATAFORMA INKEDSOUH (Actualización Pro V2)
-- Motor de Catálogo, Variantes, Combos / Packs y Checkout
-- Pega este script en tu Supabase SQL Editor y dale a RUN
-- ========================================================

-- 1. ACTUALIZAR TABLA PRODUCTS PARA HONE CATALOG (Soporte Variantes & Combos)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS old_price NUMERIC,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS specifications TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS badge TEXT;

-- 2. TABLA SITE_CONFIG (Para Plazos de Entrega, Términos y Condiciones y Configuración Global)
CREATE TABLE IF NOT EXISTS public.site_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configuración por defecto para plazos y términos
INSERT INTO public.site_config (key_name, value, description)
VALUES 
  ('delivery_timeframe', '24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones', 'Plazo de entrega especificado por el administrador'),
  ('terms_url', '', 'Enlace al documento PDF de Términos y Condiciones')
ON CONFLICT (key_name) DO NOTHING;

-- 3. ACTUALIZAR TABLA COURSES PARA SYLLABUS / MÓDULOS / LECCIONES
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT 'A tu propio ritmo',
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Todos los niveles',
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;

-- 4. ACTUALIZAR TABLA STUDENTS (Vincular a auth.users si no existe)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}'::jsonb;

-- 5. ACTUALIZAR TABLA ORDERS PARA CHECKOUT Y MÉTODOS DE PAGO (BNPL Banca.me, Transferencia, WhatsApp)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  delivery_type TEXT DEFAULT 'santiago', -- 'santiago', 'starken'
  delivery_address TEXT,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'bancame', 'transfer', 'whatsapp'
  payment_status TEXT DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'rechazado', 'anulado'
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. POLÍTICAS RLS SEGURAS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies: Products (Público Lee, Admin Gestiona)
DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all on products" ON public.products;
CREATE POLICY "Allow auth all on products" ON public.products FOR ALL TO authenticated USING (true);

-- Policies: Site Config
DROP POLICY IF EXISTS "Allow public read on site_config" ON public.site_config;
CREATE POLICY "Allow public read on site_config" ON public.site_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all on site_config" ON public.site_config;
CREATE POLICY "Allow auth all on site_config" ON public.site_config FOR ALL TO authenticated USING (true);

-- Policies: Courses
DROP POLICY IF EXISTS "Allow public read on courses" ON public.courses;
CREATE POLICY "Allow public read on courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow auth all on courses" ON public.courses;
CREATE POLICY "Allow auth all on courses" ON public.courses FOR ALL TO authenticated USING (true);

-- Policies: Orders
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow auth all on orders" ON public.orders;
CREATE POLICY "Allow auth all on orders" ON public.orders FOR ALL TO authenticated USING (true);

-- 7. STORAGE BUCKET 'admin_uploads'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admin_uploads', 'admin_uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "Allow public view admin_uploads" ON storage.objects;
CREATE POLICY "Allow public view admin_uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'admin_uploads');

DROP POLICY IF EXISTS "Allow public upload admin_uploads" ON storage.objects;
CREATE POLICY "Allow public upload admin_uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'admin_uploads');

DROP POLICY IF EXISTS "Allow auth delete admin_uploads" ON storage.objects;
CREATE POLICY "Allow auth delete admin_uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'admin_uploads');

-- ========================================================
-- EJEMPLO DE PRODUCTO COMBO / PACK PROMOCIONAL (HONE BUNDLE)
-- ========================================================
/*
INSERT INTO public.products (
  name, sku, category, price, old_price, discount, stock, badge, is_active, is_featured, description, specifications
) VALUES (
  'Super Pack Inicio: Máquina Rotativa + Fuente Digital + Cartuchos',
  'INK-COM-9901A',
  'Promociones & Combos',
  89990,
  119990,
  25,
  15,
  'COMBO PACK',
  true,
  true,
  'Pack promocional con todo lo necesario para iniciar. Incluye máquina profesional, fuente y variedad de agujas.',
  '{"bundle_config": {"enabled": true, "items": [{"productId": "sample-id-1", "name": "Máquina Rotativa Bishop Replica", "price": 59990, "quantity": 1}, {"productId": "sample-id-2", "name": "Fuente Digital Touch", "price": 39990, "quantity": 1}, {"productId": "sample-id-3", "name": "Caja 20 Cartuchos RM", "price": 20000, "quantity": 1}]}}'
);
*/
