'use client'
// Layout del dashboard con sidebar
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Image, Package, BookOpen,
  User, Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import styles from './dashboard.module.css'

const MENU_ITEMS = [
  { href: '/admin/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/dashboard/perfil', label: 'Mi Perfil', icon: User },
  { href: '/admin/dashboard/reservas', label: 'Reservas', icon: Calendar },
  { href: '/admin/dashboard/productos', label: 'Catálogo', icon: Package },
  { href: '/admin/dashboard/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/admin/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            INKED<span className={styles.logoAccent}>SOUH</span>
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.navActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {pathname === href && <ChevronRight size={14} className={styles.activeArrow} />}
            </Link>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido principal */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className={styles.topbarRight}>
            <span className={styles.adminLabel}>Admin</span>
            <div className={styles.avatar}>A</div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}
