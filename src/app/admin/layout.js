'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, Package, Image as ImageIcon, Settings, LogOut, 
  Menu, X, LayoutDashboard, BookOpen, User, ExternalLink,
  ChevronRight, Shield, Flame
} from 'lucide-react'
import { useState, useEffect } from 'react'
import styles from './layout.module.css'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    async function getAdminUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setAdminEmail(user.email)
      }
    }
    getAdminUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { href: '/admin/resumen', label: 'Resumen General', icon: LayoutDashboard },
    { href: '/admin/reservas', label: 'Agenda & Citas', icon: Calendar },
    { 
      href: '/admin/productos', 
      label: 'HONE CATALOG', 
      icon: Package, 
      badge: 'WP-SYNC',
      highlight: true
    },
    { href: '/admin/cursos', label: 'Academia & Alumnos', icon: BookOpen },
    { href: '/admin/galeria', label: 'Portafolio & Galería', icon: ImageIcon },
    { href: '/admin/configuracion', label: 'Configuración Web', icon: Settings },
    { href: '/admin/perfil', label: 'Perfil de Artista', icon: User }
  ]

  return (
    <div className={styles.adminContainer}>
      {/* Botón menú móvil */}
      <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin/resumen" className={styles.logoLink}>
            <span className={styles.logoText}>INKED<span className={styles.logoAccent}>SOUH</span></span>
            <span className={styles.dot}></span>
          </Link>
          <button className={styles.closeBtn} onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSectionLabel}>NAVEGACIÓN PRINCIPAL</div>
          
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${item.highlight ? styles.navItemHighlight : ''}`}
              >
                <div className={styles.navIconWrapper}>
                  <Icon size={18} />
                </div>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && (
                  <span className={styles.navBadge}>
                    {item.badge}
                  </span>
                )}
                {isActive && <div className={styles.activeGlowBar} />}
              </Link>
            )
          })}

          <div className={styles.navDivider}></div>
          <div className={styles.navSectionLabel}>ENLACE PÚBLICO</div>

          <Link 
            href="/" 
            target="_blank" 
            className={styles.navItemExternal}
          >
            <div className={styles.navIconWrapper}>
              <ExternalLink size={16} />
            </div>
            <span>Ver Sitio Web en Vivo</span>
          </Link>
        </nav>

        {/* User Footer Profile Card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.adminProfileRow}>
            <div className={styles.adminAvatar}>
              <Shield size={16} />
            </div>
            <div className={styles.adminInfo}>
              <span className={styles.adminName}>Administrador</span>
              <span className={styles.adminEmail}>{adminEmail || 'Sesión Activa'}</span>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar Sesión">
            <LogOut size={16} />
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
