'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, Package, Image as ImageIcon, Settings, LogOut, 
  Menu, X, LayoutDashboard, BookOpen, User, Sparkles, ExternalLink 
} from 'lucide-react'
import { useState, useEffect } from 'react'
import styles from './layout.module.css'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { href: '/admin/resumen', label: 'Resumen', icon: LayoutDashboard },
    { href: '/admin/reservas', label: 'Reservas', icon: Calendar },
    { 
      href: '/admin/productos', 
      label: 'HONE CATALOG', 
      icon: Package, 
      badge: 'PRO',
      highlight: true
    },
    { href: '/admin/cursos', label: 'Cursos & Alumnos', icon: BookOpen },
    { href: '/admin/galeria', label: 'Multimedia', icon: ImageIcon },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    { href: '/admin/perfil', label: 'Mi Perfil', icon: User }
  ]

  return (
    <div className={styles.adminContainer}>
      {/* Botón menú móvil */}
      <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div>
            <div className={styles.logo}>INKEDSOUH</div>
            <div style={{ fontSize: '0.72rem', color: '#ff2a3d', fontWeight: 600, letterSpacing: '1px', marginTop: '2px' }}>
              ADMIN SUITE
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${item.highlight ? styles.navItemHighlight : ''}`}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'rgba(255, 42, 61, 0.2)',
                    color: '#ff8591',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 42, 61, 0.4)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <Link 
              href="/" 
              target="_blank" 
              className={styles.navItem} 
              style={{ fontSize: '0.82rem', color: '#8e8e9f' }}
            >
              <ExternalLink size={16} />
              <span>Ver Web en Vivo</span>
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      <div 
        className={`${styles.overlay} ${mobileOpen ? styles.overlayActive : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Contenido principal */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
