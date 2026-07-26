'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { NAV_LINKS } from '@/lib/constants'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const pathname = usePathname()
  
  const { scrollY } = useScroll()

  // Detect scroll direction for Smart Navbar
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious()
    if (latest > 50) {
      setScrolled(true)
    } else {
      setScrolled(false)
    }

    if (latest > 150 && latest > previous) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

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
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <motion.nav 
      className={`${styles.nav} ${scrolled ? styles.navSolid : styles.navTransparent}`}
      variants={{
        visible: { y: 0 },
        hidden: { y: '-100%' },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
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
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      {/* Overlay móvil con Framer Motion */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={styles.mobileOverlay}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menú móvil deslizante con Framer Motion */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className={styles.mobileMenu}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.mobileLinksContainer}>
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Link href={link.href} className={`${styles.mobileLink} interactive`}>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.1 + NAV_LINKS.length * 0.1 }}
              >
                <Link href="/login" className={`${styles.mobileLoginBtn} interactive`}>
                  Login
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
