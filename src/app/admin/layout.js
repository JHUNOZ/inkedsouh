'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Package, Image as ImageIcon, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import styles from './layout.module.css'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (isLoginPage) {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Settings },
    { href: '/admin/reservas', label: 'Reservas', icon: Calendar },
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/galeria', label: 'Galería IG', icon: ImageIcon },
  ]

  return (
    <div className={styles.adminContainer}>
      {/* Botón menú móvil */}
      <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>INKEDSOUH</div>
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
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
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
