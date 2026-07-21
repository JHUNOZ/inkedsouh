-- Supabase Schema for Roles, Portal Estudiante and Upgrades
-- Copia y pega esto en tu SQL Editor de Supabase y presiona RUN.

-- 1. ACTUALIZAR TABLA COURSES (Imágenes y Descripciones)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. ACTUALIZAR TABLA STUDENTS (Vincular a usuarios reales)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. ACTUALIZAR TABLA PRODUCTS (Especificaciones técnicas)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS specifications TEXT;

-- 4. CREAR TABLA DE ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'estudiante' -- roles: 'admin', 'estudiante'
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden ver roles (necesario para el middleware/login)
CREATE POLICY "Allow authenticated to read user roles" ON public.user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. TRIGGER AUTOMÁTICO PARA NUEVOS REGISTROS
-- Cada vez que alguien se registre en el sistema, por defecto será 'estudiante'.
-- Si eres tú (junomaemaul@gmail.com), se te asigna 'admin' automáticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'junomaemaul@gmail.com' THEN
    INSERT INTO public.user_roles (id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (id, role) VALUES (NEW.id, 'estudiante');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borrar el trigger si existe para recrearlo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. ASIGNAR ROL AL ADMIN EXISTENTE
-- Como tu usuario admin ya existe, le asignamos el rol 'admin' manualmente (si no lo tiene).
INSERT INTO public.user_roles (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'junomaemaul@gmail.com'
ON CONFLICT (id) DO NOTHING;
