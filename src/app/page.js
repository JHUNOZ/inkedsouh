'use client'
// Página principal — Home con scroll reveal avanzado y Contexto
import { useEffect } from 'react'
import { useConfig } from '@/context/ConfigContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import BookingCTA from '@/components/home/BookingCTA'
import GalleryPreview from '@/components/home/GalleryPreview'
import ProductsPreview from '@/components/home/ProductsPreview'

// Lazy load below-the-fold interactive map for faster initial load
const GoogleMap = dynamic(() => import('@/components/layout/GoogleMap'), {
  ssr: true,
  loading: () => <div style={{ height: '350px', background: '#07070B' }} />
})

export default function Home() {
  const { maintenance } = useConfig()

  // Framer Motion handles all scroll reveals inside the individual components

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
        <BookingCTA />
        <GalleryPreview />
        <ProductsPreview />
        <GoogleMap />
      </main>
      <Footer />
    </>
  )
}
