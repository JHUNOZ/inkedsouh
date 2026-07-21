-- =============================================
-- INKEDSOUH - Esquema de Base de Datos
-- PostgreSQL en Supabase
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Perfil del administrador/tatuador
-- =============================================
CREATE TABLE admin_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL DEFAULT 'INKEDSOUH',
  bio TEXT DEFAULT '',
  specialties TEXT[] DEFAULT '{}',
  profile_image_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT 'https://www.instagram.com/inked.tto/',
  whatsapp_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Configuración del sitio
-- =============================================
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_title TEXT DEFAULT 'INKEDSOUH',
  hero_subtitle TEXT DEFAULT 'Arte en tu piel',
  map_embed_url TEXT DEFAULT '',
  instagram_token TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Imágenes de la galería
-- =============================================
CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  style_tag TEXT DEFAULT 'General',
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_visible ON gallery_images(is_visible);
CREATE INDEX idx_gallery_order ON gallery_images(display_order);

-- =============================================
-- Configuración de horarios
-- =============================================
CREATE TABLE schedule_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  slot_duration_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(day_of_week)
);

-- =============================================
-- Fechas bloqueadas
-- =============================================
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT DEFAULT ''
);

CREATE INDEX idx_blocked_date ON blocked_dates(blocked_date);

-- =============================================
-- Citas/Reservas
-- =============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('tatuaje_nuevo', 'retoque', 'consulta', 'diseno')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  notes TEXT DEFAULT '',
  reference_image_url TEXT DEFAULT '',
  estimated_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- =============================================
-- Productos
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discount_percentage INT DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);

-- =============================================
-- Cursos
-- =============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT DEFAULT '',
  video_preview_url TEXT DEFAULT '',
  content_url TEXT DEFAULT '',
  difficulty_level TEXT DEFAULT 'principiante' CHECK (difficulty_level IN ('principiante', 'intermedio', 'avanzado')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_active ON courses(is_active);

-- =============================================
-- Órdenes de compra
-- =============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'aprobado', 'rechazado', 'reembolsado')),
  payment_id TEXT DEFAULT '',
  fulfillment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (fulfillment_status IN ('pendiente', 'enviado', 'entregado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(payment_status);

-- =============================================
-- Items de órdenes
-- =============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =============================================
-- Compras de cursos
-- =============================================
CREATE TABLE course_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'aprobado', 'rechazado')),
  payment_id TEXT DEFAULT '',
  access_token TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_purchases_course ON course_purchases(course_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

-- Lectura pública (datos visibles al público)
CREATE POLICY "lectura_publica_perfil" ON admin_profile FOR SELECT USING (true);
CREATE POLICY "lectura_publica_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "lectura_publica_galeria" ON gallery_images FOR SELECT USING (is_visible = true);
CREATE POLICY "lectura_publica_horarios" ON schedule_config FOR SELECT USING (true);
CREATE POLICY "lectura_publica_bloqueados" ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "lectura_publica_productos" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "lectura_publica_cursos" ON courses FOR SELECT USING (is_active = true);

-- Inserción pública (clientes crean reservas y órdenes)
CREATE POLICY "crear_cita" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "crear_orden" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "crear_items_orden" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "crear_compra_curso" ON course_purchases FOR INSERT WITH CHECK (true);

-- Admin: control total (requiere autenticación)
CREATE POLICY "admin_perfil" ON admin_profile FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_galeria" ON gallery_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_horarios" ON schedule_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_bloqueados" ON blocked_dates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_citas" ON appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_productos" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_cursos" ON courses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_ordenes" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_items_orden" ON order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_compras_curso" ON course_purchases FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- Datos iniciales
-- =============================================

-- Perfil del tatuador
INSERT INTO admin_profile (full_name, bio, specialties, instagram_url)
VALUES (
  'INKEDSOUH',
  'Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión.',
  ARRAY['Blackwork', 'Lettering', 'Realismo', 'Neotradicional'],
  'https://www.instagram.com/inked.tto/'
);

-- Configuración del sitio
INSERT INTO site_settings (hero_title, hero_subtitle, map_embed_url)
VALUES (
  'INKEDSOUH',
  'Arte en tu piel',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.5!2d-70.7394!3d-34.1701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDEwJzEyLjQiUyA3MMKwNDQnMjEuOCJX!5e0!3m2!1ses!2scl!4v1'
);

-- Horarios por defecto (Lun-Sáb)
INSERT INTO schedule_config (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES
(1, '10:00', '19:00', 60, true),
(2, '10:00', '19:00', 60, true),
(3, '10:00', '19:00', 60, true),
(4, '10:00', '19:00', 60, true),
(5, '10:00', '19:00', 60, true),
(6, '10:00', '15:00', 60, true),
(0, '00:00', '00:00', 60, false);

-- Productos placeholder
INSERT INTO products (name, description, price, discount_percentage, stock, category, image_url) VALUES
('Crema Cicatrizante Tattoo', 'Crema especial para el cuidado post-tatuaje. Hidrata y protege durante la cicatrización.', 12990, 0, 25, 'Cuidado', ''),
('Film Protector Premium', 'Film transparente de segunda piel para proteger tu tatuaje nuevo durante los primeros días.', 8990, 10, 50, 'Cuidado', ''),
('Kit Aftercare Completo', 'Kit completo con crema, jabón antibacterial y film protector para el cuidado del tatuaje.', 24990, 15, 15, 'Kits', ''),
('Jabón Antibacterial Tattoo', 'Jabón suave sin fragancia, ideal para la limpieza del tatuaje durante el proceso de cicatrización.', 6990, 0, 30, 'Cuidado', ''),
('Diseño Personalizado Digital', 'Diseño exclusivo digital realizado a medida según tus ideas y preferencias.', 35000, 0, 99, 'Diseños', '');

-- Cursos placeholder
INSERT INTO courses (title, description, price, difficulty_level) VALUES
('Introducción al Tatuaje', 'Aprende los fundamentos del arte del tatuaje: higiene, materiales, técnicas básicas y tu primer trazo.', 49990, 'principiante'),
('Lettering Avanzado', 'Domina el arte del lettering en tatuaje. Tipografías, estilos caligráficos y composición.', 79990, 'avanzado'),
('Blackwork & Dotwork', 'Técnicas de relleno negro sólido y puntillismo para crear piezas impactantes.', 69990, 'intermedio');
