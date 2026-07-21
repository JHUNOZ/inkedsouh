// Constantes globales del sitio
export const SITE_NAME = 'INKEDSOUH'
export const SITE_DESCRIPTION = 'Arte en tu piel — Tatuajes profesionales en Rancagua, Chile'
export const SITE_LOCATION = 'Almarza 552, Rancagua, Chile'

// Categorías de servicio para reservas
export const SERVICE_CATEGORIES = [
  {
    id: 'tamano',
    title: 'Tatuaje por Tamaño',
    services: [
      { id: 'pequeno', title: 'Tatuaje pequeño', desc: 'Tatuaje hasta 6 cm aplicable a letras, minimalistas o pequeñas cosas en rojo, negro o rosa.', time: 1, timeStr: '1 h', priceStr: '35.000' },
      { id: 'mediano', title: 'Tatuaje mediano', desc: 'Tatuaje entre 10 cm a 18 cm', time: 2, timeStr: '2 h', priceStr: '70.000 a 120.000' },
      { id: 'grande', title: 'Tatuaje grande', desc: 'Tatuaje de zona completa de hasta 30 cm. No aplica a coberturas, si aplica a realismo.', time: 3, timeStr: '3 h', priceStr: '120.000 a 190.000' }
    ]
  },
  {
    id: 'mangas',
    title: 'Mangas y Brazos',
    services: [
      { id: 'mediamanga', title: 'Media manga', desc: 'Valor por media manga completa, ya sea de hombro a codo o de codo a muñeca, valor incluye el brazo y sus bordes por completo.', time: 5, timeStr: '5 h', priceStr: '320.000 a 400.000' },
      { id: 'blackwork', title: 'Brazo Blackwork', desc: 'Sesión para proyectos grandes de Blackwork, valor por 4 horas de tatuaje, aplicable a coberturas, proyectos grandes, mangas, entre otros.', time: 4, timeStr: '4 h', priceStr: '450.000 a 550.000' },
      { id: 'brazocompleto', title: 'Brazo completo', desc: '', time: 10, timeStr: '10 h', priceStr: '900.000 a 1.200.000' }
    ]
  },
  {
    id: 'especiales',
    title: 'Proyectos Especiales',
    services: [
      { id: 'cobertura', title: 'Cobertura de tatuajes', desc: 'Sesión para cubrir tatuajes. A veces es necesario 2 sesiones para lograr una cobertura de buena calidad.', time: 4, timeStr: '4 h', priceStr: 'Desde los 65.000 a 160000' },
      { id: 'lienzo', title: 'Lienzo artistico', desc: 'Si todavía estás en la búsqueda de esa idea perfecta para tu próximo tatuaje, nuestro servicio está diseñado especialmente para ti.', time: 2, timeStr: '2 h', priceStr: '$140.000' },
      { id: 'espalda', title: 'Espalda completa', desc: '', time: 6, timeStr: '6 h', priceStr: '950.000 a 1.500.000' }
    ]
  }
]

export const SERVICE_TYPES = SERVICE_CATEGORIES.flatMap(c => c.services)

// Estados de citas
export const APPOINTMENT_STATUS = {
  pendiente: { label: 'Pendiente', color: '#f59e0b' },
  confirmada: { label: 'Confirmada', color: '#22c55e' },
  completada: { label: 'Completada', color: '#3b82f6' },
  cancelada: { label: 'Cancelada', color: '#ef4444' }
}

// Categorías de productos
export const PRODUCT_CATEGORIES = ['Cuidado', 'Kits', 'Diseños', 'Accesorios', 'Otro']

// Niveles de cursos
export const COURSE_LEVELS = {
  principiante: { label: 'Principiante', color: '#22c55e' },
  intermedio: { label: 'Intermedio', color: '#f59e0b' },
  avanzado: { label: 'Avanzado', color: '#ef4444' }
}

// Días de la semana
export const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Navegación principal
export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#galeria-preview', label: 'Galería' },
  { href: '/reservar', label: 'Reservar' },
  { href: '/productos', label: 'Productos' },
  { href: '/cursos', label: 'Cursos' }
]

// Google Maps embed URL para Rancagua
export const DEFAULT_MAP_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.0!2d-70.7394!3d-34.1701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x966318c8e5a1f1f1%3A0x1!2sAlmarza%20552%2C%20Rancagua%2C%20Chile!5e0!3m2!1ses!2scl!4v1'
