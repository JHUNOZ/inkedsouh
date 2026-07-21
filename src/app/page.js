'use client'
// Página principal — Home con scroll reveal avanzado y Contexto
import { useEffect } from 'react'
import { useConfig } from '@/context/ConfigContext'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GoogleMap from '@/components/layout/GoogleMap'
import Hero from '@/components/home/Hero'
import GalleryPreview from '@/components/home/GalleryPreview'
import BookingCTA from '@/components/home/BookingCTA'
import ProductsPreview from '@/components/home/ProductsPreview'

export default function Home() {
  const { maintenance } = useConfig()

  // Scroll reveal con animaciones escalonadas
  useEffect(() => {
    if (maintenance) return // No animar si está en mantenimiento
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    )

    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    document.querySelectorAll(selectors).forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [maintenance])

  if (maintenance) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', textAlign: 'center', padding: '20px' }}>
        <img src="/images/logo.png" alt="INKEDSOUH" style={{ width: '150px', marginBottom: '30px', opacity: 0.8 }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', letterSpacing: '4px', marginBottom: '15px' }}>EN MANTENIMIENTO</h1>
        <p style={{ color: '#888', maxWidth: '400px', lineHeight: '1.6', marginBottom: '40px' }}>
          Estamos actualizando nuestra plataforma para ofrecerte una mejor experiencia. Volveremos a estar en línea pronto.
        </p>
        <footer style={{ marginTop: 'auto', padding: '20px', textAlign: 'center' }}>
          <Link href="/login" style={{ opacity: 0.1, fontSize: '0.8rem', textDecoration: 'none', color: '#fff' }}>
            Admin
          </Link>
        </footer>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <GalleryPreview />
        <BookingCTA />
        <ProductsPreview />
        <GoogleMap />
      </main>
      <Footer />
    </>
  )
}
