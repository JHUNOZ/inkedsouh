'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_LINKS } from '@/lib/constants'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const pathname = usePathname()
  const lastScrollY = useRef(0)

  // Lightweight scroll direction detector with hysteresis (avoids per-pixel re-renders)
  useEffect(() => {
    let ticking = false

    const updateNav = () => {
      const currentY = window.scrollY || window.pageYOffset
      const diff = currentY - lastScrollY.current

      if (currentY < 120) {
        setHidden(false)
        lastScrollY.current = currentY
      } else if (diff > 10 && !mobileOpen) {
        setHidden(true)
        lastScrollY.current = currentY
      } else if (diff < -10) {
        setHidden(false)
        lastScrollY.current = currentY
      }
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(updateNav)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mobileOpen])

  // Close mobile menu on page change
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMobileOpen(false)
    }, 0)
    return () => clearTimeout(timeout)
  }, [pathname])

  // Lock scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <nav
        className={`${styles.nav} ${styles.navSolid} ${hidden && !mobileOpen ? styles.navHidden : ''}`}
      >
        <div className={styles.inner}>
          {/* Logo Texto */}
          <Link href="/" className={`${styles.logo} interactive`}>
            INKEDSOUH
          </Link>

          {/* Links desktop */}
          <div className={styles.links}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${pathname === link.href ? styles.linkActive : ''} interactive`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" className={`${styles.loginBtn} interactive magnetic`}>
              Login
            </Link>
          </div>

          {/* Hamburger móvil */}
          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''} interactive`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú de navegación"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </nav>

      {/* Overlay móvil fuera del contenedor transformado */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.mobileOverlay}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menú móvil deslizante */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.mobileLinksContainer}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileLink} interactive`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={`${styles.mobileLoginBtn} interactive`}
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
