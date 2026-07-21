'use client'
// Dashboard principal con estadísticas del CMS/ERP
import { Calendar, Package, BookOpen, DollarSign, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { MOCK_RESERVAS, MOCK_ALUMNOS, MOCK_PRODUCTOS } from '@/lib/mockData'
import styles from './main.module.css'

export default function DashboardPage() {
  // Cálculos rápidos de estadísticas
  const reservasPendientes = MOCK_RESERVAS.filter(r => r.status === 'pendiente').length
  const ingresosMensuales = MOCK_RESERVAS
    .filter(r => r.status === 'confirmada')
    .reduce((acc, curr) => acc + parseInt(curr.total.replace('$', '').replace('.', '')), 0)
  const alumnosActivos = MOCK_ALUMNOS.filter(a => a.status === 'activo').length
  const productosAgotados = MOCK_PRODUCTOS.filter(p => p.isSoldOut).length

  const stats = [
    { label: 'Reservas Pendientes', value: reservasPendientes.toString(), icon: Calendar, color: '#f59e0b' },
    { label: 'Alumnos Activos', value: alumnosActivos.toString(), icon: Users, color: '#3b82f6' },
    { label: 'Productos Agotados', value: productosAgotados.toString(), icon: AlertTriangle, color: '#ef4444' },
    { label: 'Ingresos Mensuales', value: `$${ingresosMensuales.toLocaleString('es-CL')}`, icon: DollarSign, color: '#22c55e' },
  ]

  // Tomamos las últimas 5 reservas
  const recentReservas = [...MOCK_RESERVAS].slice(0, 5)
  // Tomamos los últimos 3 alumnos
  const recentAlumnos = [...MOCK_ALUMNOS].slice(0, 3)

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard General</h1>
      <p className={styles.subtitle}>Resumen administrativo de InkedSouh ERP</p>

      {/* Cards de estadísticas */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Secciones */}
      <div className={styles.sections}>
        {/* Columna Izquierda (Tablas) */}
        <div className={styles.mainCol}>
          
          {/* Reservas Recientes */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Clock size={18} /> Últimas Reservas
              </h2>
              <Link href="/admin/dashboard/reservas" className={styles.viewAllBtn}>Ver todas</Link>
            </div>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Cliente</span>
                <span>Servicio</span>
                <span>Fecha</span>
                <span>Estado</span>
              </div>
              {recentReservas.map((apt) => (
                <div key={apt.id} className={styles.tableRow}>
                  <div className={styles.clientCell}>
                    <span className={styles.clientName}>{apt.client}</span>
                    <span className={styles.clientEmail}>{apt.email}</span>
                  </div>
                  <span>{apt.service}</span>
                  <span>{apt.date} a las {apt.time}</span>
                  <span className={`${styles.status} ${styles[`status_${apt.status}`]}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alumnos Recientes */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <BookOpen size={18} /> Cursos: Últimos Alumnos
              </h2>
              <Link href="/admin/dashboard/cursos" className={styles.viewAllBtn}>Ver todos</Link>
            </div>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Alumno</span>
                <span>Inscripción</span>
                <span>Expiración</span>
                <span>Estado</span>
              </div>
              {recentAlumnos.map((alum) => (
                <div key={alum.id} className={styles.tableRow}>
                  <div className={styles.clientCell}>
                    <span className={styles.clientName}>{alum.name}</span>
                    <span className={styles.clientEmail}>{alum.email}</span>
                  </div>
                  <span>{alum.enrolledAt}</span>
                  <span>{alum.expiresAt}</span>
                  <span className={`${styles.status} ${styles[`status_${alum.status}`]}`}>
                    {alum.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha (Acciones Rápidas) */}
        <div className={styles.sideCol}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <TrendingUp size={18} /> Acciones Rápidas
            </h2>
            <div className={styles.quickActions}>
              <Link href="/admin/dashboard/reservas" className={styles.quickAction}>
                <Calendar size={20} />
                <span>Gestionar Reservas</span>
              </Link>
              <Link href="/admin/dashboard/cursos" className={styles.quickAction}>
                <BookOpen size={20} />
                <span>Gestionar Cursos</span>
              </Link>
              <Link href="/admin/dashboard/productos" className={styles.quickAction}>
                <Package size={20} />
                <span>Catálogo e Inventario</span>
              </Link>
              <Link href="/admin/dashboard/perfil" className={styles.quickAction}>
                <Users size={20} />
                <span>Mi Billetera / Perfil</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
