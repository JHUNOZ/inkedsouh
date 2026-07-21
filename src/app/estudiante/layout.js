'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, LogOut, Menu, X, User } from 'lucide-react'
import styles from './layout.module.css'
import { createClient } from '@/lib/supabase/client'

export default function EstudianteLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/estudiante', label: 'Mis Cursos', icon: BookOpen },
    { href: '/estudiante/perfil', label: 'Mi Perfil', icon: User },
  ]

  return (
    <div className={styles.layout}>
      {/* Mobile Toggle */}
      <button 
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            INKED<span className={styles.logoAccent}>SOUH</span>
          </Link>
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Portal de Estudiantes</div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
