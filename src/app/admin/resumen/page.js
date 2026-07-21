'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Package, BookOpen } from 'lucide-react'
import styles from './resumen.module.css'

export default function ResumenPage() {
  const [stats, setStats] = useState({
    reservasPendientes: 0,
    productosActivos: 0,
    cursosActivos: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    try {
      // 1. Reservas Pendientes
      const { count: countReservas } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente')

      // 2. Productos Activos
      const { count: countProductos } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 3. Cursos Activos
      const { count: countCursos } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setStats({
        reservasPendientes: countReservas || 0,
        productosActivos: countProductos || 0,
        cursosActivos: countCursos || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }

    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Resumen del Estudio</h1>
        <p className={styles.subtitle}>Vista general de tu negocio</p>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Cargando estadísticas...</p>
      ) : (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span>Reservas Pendientes</span>
              <div className={styles.statIcon}><Calendar size={18} /></div>
            </div>
            <div className={styles.statValue}>{stats.reservasPendientes}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span>Productos en Venta</span>
              <div className={styles.statIcon}><Package size={18} /></div>
            </div>
            <div className={styles.statValue}>{stats.productosActivos}</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span>Cursos Activos</span>
              <div className={styles.statIcon}><BookOpen size={18} /></div>
            </div>
            <div className={styles.statValue}>{stats.cursosActivos}</div>
          </div>
        </div>
      )}
    </div>
  )
}
