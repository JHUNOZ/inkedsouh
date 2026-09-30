'use client'
// Página de galería pública sincronizada con Supabase e Instagram
import { useState, useEffect, useCallback } from 'react'
import { X, Heart, ExternalLink, ChevronLeft, ChevronRight, Filter, Sparkles } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import styles from './galeria.module.css'

const CURATED_WORKS = [
  {
    id: 'art-1',
    media_url: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Realismo Sombras & Máscara Samurai Tradicional',
    category: 'Realismo'
  },
  {
    id: 'art-2',
    media_url: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Blackwork Floral & Botánica de Alta Definición',
    category: 'Blackwork'
  },
  {
    id: 'art-3',
    media_url: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Fine Line & Cobertura Integral de Espalda',
    category: 'Fine Line'
  },
  {
    id: 'art-4',
    media_url: 'https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Lettering Gótico & Tipografía Personalizada',
    category: 'Lettering'
  },
  {
    id: 'art-5',
    media_url: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Neotradicional & Ilustración de Alto Contraste',
    category: 'Neotradicional'
  },
  {
    id: 'art-6',
    media_url: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Geometría Sagrada & Puntillismo de Precisión',
    category: 'Blackwork'
  },
  {
    id: 'art-7',
    media_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Arte Conceptual & Escultura Clásica',
    category: 'Realismo'
  },
  {
    id: 'art-8',
    media_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
    media_type: 'IMAGE',
    caption: 'Retrato Hiperrealista & Texturas',
    category: 'Realismo'
  }
]

export default function GaleriaPage() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [posts, setPosts] = useState(CURATED_WORKS)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todos')

  const supabase = createClient()

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('instagram_cache')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          // Merge custom supabase uploads with curated works
          const dbItems = data.map(item => ({
            id: item.id,
            media_url: item.media_url,
            media_type: item.media_type || 'IMAGE',
            caption: item.caption || 'Obra InkedSouh',
            category: item.category || 'Portafolio'
          }))
          setPosts([...dbItems, ...CURATED_WORKS])
        } else {
          setPosts(CURATED_WORKS)
        }
      } catch (err) {
        console.error('Error al cargar la galería:', err)
        setPosts(CURATED_WORKS)
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

  // Categories list
  const categories = ['Todos', 'Blackwork', 'Lettering', 'Realismo', 'Fine Line', 'Neotradicional']

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'Todos') return true
    return (post.category || '').toLowerCase() === activeCategory.toLowerCase()
  })

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape') setLightboxIndex(null)
    if (e.key === 'ArrowRight') {
      setLightboxIndex((prev) => (prev + 1) % filteredPosts.length)
    }
    if (e.key === 'ArrowLeft') {
      setLightboxIndex((prev) => (prev - 1 + filteredPosts.length) % filteredPosts.length)
    }
  }, [lightboxIndex, filteredPosts.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const activeItem = lightboxIndex !== null ? filteredPosts[lightboxIndex] : null

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.header}>
          <SectionTitle subtitle="Portafolio de Tatuajes y Obras de Arte">GALERÍA MULTIMEDIA</SectionTitle>
          <a
            href="https://www.instagram.com/inked.tto/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.igBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Seguir @inked.tto
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Categories Bar */}
        <div className={styles.categoryBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat)
                setLightboxIndex(null)
              }}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de Galería */}
        {loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p>Cargando portafolio de arte...</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredPosts.map((post, idx) => (
              <div
                key={post.id || idx}
                className={styles.gridItem}
                onClick={() => setLightboxIndex(idx)}
              >
                {post.media_type === 'VIDEO' ? (
                  <video src={post.media_url} autoPlay loop muted playsInline className={styles.mediaImg} />
                ) : (
                  <img 
                    src={post.media_url} 
                    alt={post.caption || "Portafolio InkedSouh"} 
                    className={styles.mediaImg}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?q=80&w=800&auto=format&fit=crop'
                    }}
                  />
                )}
                
                <div className={styles.overlay}>
                  <div className={styles.stats}>
                    <span className={styles.stat}><Heart size={16} /> Ver Detalle</span>
                  </div>
                  <span className={styles.itemCaption}>{post.caption}</span>
                </div>
                <div className={styles.neonBorder} />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Interactivo */}
        {activeItem && (
          <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
            <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)} aria-label="Cerrar">
              <X size={26} />
            </button>

            {/* Nav Arrows */}
            {filteredPosts.length > 1 && (
              <>
                <button 
                  className={`${styles.lightboxNavBtn} ${styles.lightboxPrev}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev - 1 + filteredPosts.length) % filteredPosts.length)
                  }}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={28} />
                </button>
                <button 
                  className={`${styles.lightboxNavBtn} ${styles.lightboxNext}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev + 1) % filteredPosts.length)
                  }}
                  aria-label="Siguiente"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.lightboxMediaContainer}>
                {activeItem.media_type === 'VIDEO' ? (
                  <video src={activeItem.media_url} controls autoPlay className={styles.lightboxMedia} />
                ) : (
                  <img src={activeItem.media_url} alt={activeItem.caption} className={styles.lightboxMedia} />
                )}
              </div>

              <div className={styles.lightboxFooter}>
                <div>
                  <span className={styles.lightboxCategory}>{activeItem.category || 'Tatuaje'}</span>
                  <h4 className={styles.lightboxCaption}>{activeItem.caption}</h4>
                </div>
                <Link href="/reservar" className={styles.btnBookNow}>
                  <Sparkles size={16} /> Cotizar Este Estilo
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
