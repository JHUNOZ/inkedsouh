'use client'
// Barra de navegación principal
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS } from '@/lib/constants'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Detectar scroll para cambiar estilo de navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar menú móvil al cambiar de página
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Bloquear scroll cuando menú está abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navSolid : styles.navTransparent}`}>
      <div className={styles.inner}>
        {/* Logo Texto */}
        <Link href="/" className={styles.logo}>
          INKEDSOUH
        </Link>

        {/* Links desktop */}
        <div className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === link.href ? styles.linkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className={styles.loginBtn}>
            Login
          </Link>
        </div>

        {/* Hamburger móvil */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú de navegación"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      {/* Overlay móvil */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.active : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Menú móvil deslizante */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ''}`}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.mobileLink}>
            {link.label}
          </Link>
        ))}
        <Link href="/login" className={styles.mobileLoginBtn}>
          Login
        </Link>
      </div>
    </nav>
  )
}
