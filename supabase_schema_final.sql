-- Supabase Schema for Final Admin Sections
-- Copy and paste this entirely into your Supabase SQL Editor and hit RUN.

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. STUDENTS TABLE (Alumnos de los cursos)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'activo', -- 'activo', 'expirado', 'vetado'
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 3. SITE CONFIG TABLE (Textos Dinámicos de la web)
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT NOT NULL, -- ej: 'Inicio', 'Footer'
    key_name TEXT NOT NULL UNIQUE, -- ej: 'hero_title'
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow Public Read, Admin Write)
-- (Assuming anonymous users can read courses and configs, but only authenticated can edit/view students)

-- Courses Policies
CREATE POLICY "Allow public read-only access to active courses" ON public.courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated full access to courses" ON public.courses
    FOR ALL USING (auth.role() = 'authenticated');

-- Students Policies
CREATE POLICY "Allow authenticated full access to students" ON public.students
    FOR ALL USING (auth.role() = 'authenticated');

-- Site Config Policies
CREATE POLICY "Allow public read-only access to site config" ON public.site_config
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access to site config" ON public.site_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert Initial Site Config Data (Defaults)
INSERT INTO public.site_config (section, key_name, value) VALUES
('Inicio', 'hero_title', 'ARTE EN TU PIEL'),
('Inicio', 'hero_subtitle', 'Cada tatuaje es una historia única, creada con pasión y precisión.'),
('Footer', 'footer_description', 'Estudio especializado en Blackwork y Lettering en Rancagua.')
ON CONFLICT (key_name) DO NOTHING;
