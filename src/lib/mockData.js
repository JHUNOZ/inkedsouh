// mockData.js - Datos simulados para el panel de administración

export const MOCK_RESERVAS = [
  { id: '1', date: '2026-05-26', time: '10:00', client: 'Andrés López', email: 'andres@ejemplo.com', service: 'Tatuaje Realismo', status: 'confirmada', total: '$150.000' },
  { id: '2', date: '2026-05-27', time: '14:30', client: 'Camila Rojas', email: 'camila@ejemplo.com', service: 'Tatuaje Blackwork', status: 'pendiente', total: '$80.000' },
  { id: '3', date: '2026-05-28', time: '11:00', client: 'Felipe Soto', email: 'felipe@ejemplo.com', service: 'Retoque', status: 'cancelada', cancel_reason: 'Cliente avisó que no podía asistir por trabajo.', total: '$30.000' }
]

export const MOCK_CURSOS = [
  { id: 'c1', title: 'Curso de Blackwork Básico', price: '$100.000', discount: 10, isActive: true, studentsCount: 15 },
  { id: 'c2', title: 'Máster en Realismo Sombras', price: '$250.000', discount: 0, isActive: true, studentsCount: 8 },
  { id: 'c3', title: 'Seminario de Bioseguridad', price: '$40.000', discount: 20, isActive: false, studentsCount: 0 }
]

export const MOCK_ALUMNOS = [
  { id: 'a1', courseId: 'c1', name: 'Diego Muñoz', email: 'diego@ejemplo.com', enrolledAt: '2026-05-15', expiresAt: '2026-06-15', status: 'activo' },
  { id: 'a2', courseId: 'c1', name: 'Sara Valenzuela', email: 'sara@ejemplo.com', enrolledAt: '2026-04-10', expiresAt: '2026-05-10', status: 'expirado' },
  { id: 'a3', courseId: 'c2', name: 'Ignacio Perez', email: 'ignacio@ejemplo.com', enrolledAt: '2026-05-20', expiresAt: '2026-06-20', status: 'vetado' }
]

export const MOCK_PRODUCTOS = [
  { id: 'p1', name: 'Crema Aftercare 50ml', price: '$15.000', stock: 45, isSoldOut: false, category: 'Cuidado' },
  { id: 'p2', name: 'Polera INKEDSOUH Negra', price: '$20.000', stock: 0, isSoldOut: true, category: 'Ropa' },
  { id: 'p3', name: 'Jabón Espuma 150ml', price: '$12.000', stock: 12, isSoldOut: false, category: 'Cuidado' }
]

export const MOCK_ACCESOS = [
  { id: 'u1', name: 'Jhunoz (Admin Principal)', email: 'admin@inkedsouh.com', role: 'admin' },
  { id: 'u2', name: 'Asistente Estudio', email: 'staff@inkedsouh.com', role: 'staff' }
]

export const MOCK_TEXTOS = [
  { id: 't1', section: 'Inicio', key: 'Hero Title', value: 'ARTE EN TU PIEL' },
  { id: 't2', section: 'Inicio', key: 'Hero Subtitle', value: 'Cada tatuaje es una historia única, creada con pasión y precisión.' },
  { id: 't3', section: 'Footer', key: 'Descripción', value: 'Estudio especializado en Blackwork y Lettering en Rancagua.' }
]
