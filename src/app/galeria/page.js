'use client'
// Página de galería pública sincronizada directamente con las subidas del administrador
import { useState, useEffect, useCallback } from 'react'
import { X, Heart, ExternalLink, ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import { isVideoUrl } from '@/lib/productUtils'
import Link from 'next/link'
import styles from './galeria.module.css'

export default function GaleriaPage() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [posts, setPosts] = useState([])
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
          const dbItems = data.map(item => {
            let itemTitle = 'Obra InkedSouh'
            let itemCategory = 'Tatuaje'
            if (item.permalink) {
              try {
                if (item.permalink.startsWith('{')) {
                  const parsed = JSON.parse(item.permalink)
                  if (parsed.title) itemTitle = parsed.title
                  if (parsed.category) itemCategory = parsed.category
                } else if (!item.permalink.startsWith('http')) {
                  itemTitle = item.permalink
                }
              } catch {
                itemTitle = item.permalink
              }
            }

            return {
              id: item.id,
              media_url: item.media_url,
              media_type: item.media_type || 'IMAGE',
              caption: itemTitle,
              category: itemCategory
            }
          })
          setPosts(dbItems)
        } else {
          setPosts([])
        }
      } catch (err) {
        console.error('Error al cargar la galería:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

  // Dynamic unique categories from uploaded works
  const dynamicCategories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)))
  const categories = ['Todos', ...dynamicCategories]

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'Todos') return true
    return (post.category || '').toLowerCase() === activeCategory.toLowerCase()
  })

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape') setLightboxIndex(null)
    if (e.key === 'ArrowRight' && filteredPosts.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % filteredPosts.length)
    }
    if (e.key === 'ArrowLeft' && filteredPosts.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + filteredPosts.length) % filteredPosts.length)
    }
  }, [lightboxIndex, filteredPosts.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const activeItem = lightboxIndex !== null && filteredPosts[lightboxIndex] ? filteredPosts[lightboxIndex] : null

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.header}>
          <SectionTitle subtitle="Portafolio Oficial de Tatuajes y Obras">GALERÍA MULTIMEDIA</SectionTitle>
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

        {/* Categories Bar (solo se muestra si hay categorías creadas) */}
        {categories.length > 1 && (
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
        )}

        {/* Grid de Galería */}
        {loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p>Cargando portafolio de arte...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyGalleryBox}>
            <div className={styles.emptyIconWrap}>
              <ImageIcon size={48} style={{ color: '#ff2a3d' }} />
            </div>
            <h3>Portafolio en Actualización</h3>
            <p>
              Próximamente se publicarán nuevas fotografías de sesiones y piezas de tatuaje exclusivas.
            </p>
            <div className={styles.emptyActions}>
              <a 
                href="https://www.instagram.com/inked.tto/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.btnEmptyIg}
              >
                Ver Trabajos en Instagram
              </a>
              <Link href="/reservar" className={styles.btnEmptyBook}>
                Agendar Cita
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredPosts.map((post, idx) => (
              <div
                key={post.id || idx}
                className={styles.gridItem}
                onClick={() => setLightboxIndex(idx)}
              >
                {(post.media_type === 'VIDEO' || isVideoUrl(post.media_url)) ? (
                  <video src={post.media_url} autoPlay loop muted playsInline className={styles.mediaImg} />
                ) : (
                  <img 
                    src={post.media_url} 
                    alt={post.caption || "Portafolio InkedSouh"} 
                    className={styles.mediaImg}
                  />
                )}
                
                <div className={styles.overlay}>
                  <div className={styles.stats}>
                    <span className={styles.stat}><Heart size={16} /> Ver Obra</span>
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
                {(activeItem.media_type === 'VIDEO' || isVideoUrl(activeItem.media_url)) ? (
                  <video src={activeItem.media_url} controls autoPlay muted loop playsInline className={styles.lightboxMedia} />
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
