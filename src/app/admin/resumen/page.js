'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Calendar, Package, BookOpen, ArrowUpRight, 
  Users, Sparkles, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, ArrowRight, ShieldCheck, Zap
} from 'lucide-react'
import styles from './resumen.module.css'

export default function ResumenPage() {
  const [stats, setStats] = useState({
    reservasPendientes: 0,
    productosActivos: 0,
    cursosActivos: 0,
    totalAlumnos: 0,
    totalStock: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    try {
      // 1. Reservas Pendientes
      const { count: countReservas, data: bookingsData } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)

      // 2. Productos Activos
      const { data: prods } = await supabase
        .from('products')
        .select('stock, is_active')
      
      const activeProds = (prods || []).filter(p => p.is_active)
      const stockTotal = (prods || []).reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0)

      // 3. Cursos Activos
      const { count: countCursos } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 4. Alumnos Totales
      const { count: countAlumnos } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      setStats({
        reservasPendientes: (bookingsData || []).filter(b => b.status === 'pending' || b.status === 'pendiente').length,
        productosActivos: activeProds.length,
        cursosActivos: countCursos || 0,
        totalAlumnos: countAlumnos || 0,
        totalStock: stockTotal
      })

      if (bookingsData) {
        setRecentBookings(bookingsData)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.greetingTag}>
            <Sparkles size={14} />
            <span>ESTUDIO INKEDSOUH</span>
          </div>
          <h1 className={styles.title}>Panel de Control Principal</h1>
          <p className={styles.subtitle}>Visión global de citas, catálogo sincronizado y formación académica.</p>
        </div>

        <div className={styles.headerBadge}>
          <span className={styles.statusLiveDot}></span>
          <span>SISTEMA EN LÍNEA</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Sincronizando métricas en tiempo real...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Citas & Reservas</span>
                <div className={`${styles.statIcon} ${styles.iconRed}`}>
                  <Calendar size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{stats.reservasPendientes}</span>
                <span className={styles.statSubText}>Pendientes por revisar</span>
              </div>
              <Link href="/admin/reservas" className={styles.statLink}>
                <span>Ver Agenda</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>HONE CATALOG</span>
                <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                  <Package size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{stats.productosActivos}</span>
                <span className={styles.statSubText}>{stats.totalStock} unidades en inventario</span>
              </div>
              <Link href="/admin/productos" className={styles.statLink}>
                <span>Gestionar Catálogo</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Academia & Alumnos</span>
                <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                  <BookOpen size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{stats.cursosActivos}</span>
                <span className={styles.statSubText}>{stats.totalAlumnos} alumnos registrados</span>
              </div>
              <Link href="/admin/cursos" className={styles.statLink}>
                <span>Ver Cursos & Alumnos</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className={styles.quickHub}>
            <h3 className={styles.hubTitle}>Accesos Rápidos</h3>
            <div className={styles.hubGrid}>
              <Link href="/admin/productos" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><Package size={20} /></div>
                <div>
                  <strong>Carga Masiva de Productos</strong>
                  <p>Sube imágenes en lote y gestiona precios</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/reservas" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><Calendar size={20} /></div>
                <div>
                  <strong>Revisar Cotizaciones</strong>
                  <p>Acepta, agenda o reprograma clientes</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/cursos" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><BookOpen size={20} /></div>
                <div>
                  <strong>Nuevo Curso & Lecciones</strong>
                  <p>Publica clases con video y materiales</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/galeria" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><Sparkles size={20} /></div>
                <div>
                  <strong>Actualizar Portafolio</strong>
                  <p>Sube tus últimos tatuajes a la galería</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Últimas Solicitudes de Reserva</h3>
                <p className={styles.sectionDesc}>Clientes que han cotizado a través del formulario web</p>
              </div>
              <Link href="/admin/reservas" className={styles.btnViewAll}>
                Ver Todas las Reservas
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <Calendar size={36} style={{ color: '#ff2a3d', opacity: 0.6 }} />
                <p>No hay solicitudes de reserva recientes.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Servicio / Idea</th>
                      <th>Fecha Solicitada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong style={{ color: '#fff' }}>{b.client_name}</strong></td>
                        <td style={{ color: '#8e8e9f' }}>{b.client_email}</td>
                        <td style={{ color: '#c7c7cc' }}>{b.service_type || b.tattoo_details?.substring(0, 30) || 'Tatuaje'}</td>
                        <td style={{ color: '#8e8e9f' }}>{b.requested_date}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${b.status === 'accepted' ? styles.statusAccepted : b.status === 'rejected' ? styles.statusRejected : styles.statusPending}`}>
                            {(b.status || 'pendiente').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
