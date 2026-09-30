'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, X, ExternalLink, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import styles from './GalleryPreview.module.css'

const CURATED_GALLERY = [
  {
    id: 'cg-1',
    mediaUrl: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Realismo Sombras & Samurai',
    category: 'Realismo'
  },
  {
    id: 'cg-2',
    mediaUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Blackwork Floral & Botánica',
    category: 'Blackwork'
  },
  {
    id: 'cg-3',
    mediaUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Fine Line & Espalda Completa',
    category: 'Fine Line'
  },
  {
    id: 'cg-4',
    mediaUrl: 'https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Lettering & Tipografía',
    category: 'Lettering'
  },
  {
    id: 'cg-5',
    mediaUrl: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Neotradicional & Ilustración',
    category: 'Neotradicional'
  },
  {
    id: 'cg-6',
    mediaUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Geometría & Puntillismo',
    category: 'Blackwork'
  },
  {
    id: 'cg-7',
    mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
    mediaType: 'IMAGE',
    caption: 'Arte Conceptual & Escultura',
    category: 'Realismo'
  }
]

export default function GalleryPreview() {
  const carouselRef = useRef(null)
  const [posts, setPosts] = useState(CURATED_GALLERY)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    async function loadGallery() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('instagram_cache')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8)

        if (!error && data && data.length > 0) {
          const formatted = data.map(item => {
            let itemTitle = 'Tatuaje InkedSouh'
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
              permalink: item.media_url,
              mediaUrl: item.media_url,
              mediaType: item.media_type || 'IMAGE',
              caption: itemTitle,
              category: itemCategory
            }
          })
          setPosts([...formatted, ...CURATED_GALLERY])
        } else {
          setPosts(CURATED_GALLERY)
        }
      } catch (err) {
        console.error('Error loading gallery feed:', err)
        setPosts(CURATED_GALLERY)
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape') setLightboxIndex(null)
    if (e.key === 'ArrowRight') {
      setLightboxIndex((prev) => (prev + 1) % posts.length)
    }
    if (e.key === 'ArrowLeft') {
      setLightboxIndex((prev) => (prev - 1 + posts.length) % posts.length)
    }
  }, [lightboxIndex, posts.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  }

  const currentItem = lightboxIndex !== null ? posts[lightboxIndex] : null

  return (
    <section className={styles.section} id="galeria-preview">
      <div className={styles.inner}>
        
        {/* Encabezado Superior */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle number="01" subtitle="PORTAFOLIO DE TRABAJOS">GALERÍA DE ARTE</SectionTitle>
        </motion.div>

        {/* Controles del Carrusel y Link a Galería */}
        <motion.div 
          className={styles.controlsRow}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={styles.navButtons}>
            <button className={`${styles.navBtn} interactive magnetic`} onClick={scrollLeft} aria-label="Anterior">
              <ArrowLeft size={18} />
            </button>
            <button className={`${styles.navBtn} interactive magnetic`} onClick={scrollRight} aria-label="Siguiente">
              <ArrowRight size={18} />
            </button>
            <span className={styles.counter}>{posts.length > 0 ? `01 / ${String(posts.length).padStart(2, '0')}` : '...'}</span>
          </div>

          <Link
            href="/galeria"
            className={`${styles.igLink} interactive magnetic`}
          >
            <span>VER GALERÍA COMPLETA</span>
            <ExternalLink size={14} />
          </Link>
        </motion.div>

        <motion.div 
          className={styles.carouselWrap}
          variants={containerVars}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div 
            className={styles.carousel} 
            ref={carouselRef}
            drag="x"
            dragConstraints={{ left: -1000, right: 0 }}
            whileTap={{ cursor: "grabbing" }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <motion.div key={i} className={`${styles.card} bracket-borders scanlines`} variants={itemVars}>
                  <div className={styles.placeholder} />
                  <div className={styles.cardFooter}>
                    <span className={styles.cardNumber}>--</span>
                    <div className={styles.cardLine}></div>
                    <span className={styles.cardLabel}>CARGANDO...</span>
                  </div>
                </motion.div>
              ))
            ) : (
              posts.map((post, index) => (
                <div 
                  key={post.id || index} 
                  className={`${styles.card} bracket-borders scanlines interactive magnetic`}
                  onClick={() => setLightboxIndex(index)}
                  title="Clic para ver en detalle"
                  role="button"
                  tabIndex={0}
                >
                  {post.mediaType === 'VIDEO' ? (
                    <video src={post.mediaUrl} autoPlay muted loop playsInline className={styles.igMedia} />
                  ) : (
                    <img 
                      src={post.mediaUrl} 
                      alt={post.caption || 'Galería de Tatuajes'} 
                      className={styles.igMedia}
                      onError={(e) => {
                        // Fallback in case of external network issues
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?q=80&w=800&auto=format&fit=crop'
                      }}
                    />
                  )}
                  
                  <div className={styles.hoverOverlay}>
                    <div className={styles.hoverAction}>
                      <Eye size={20} />
                      <span>Ver Obra</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <div className={styles.cardLine}></div>
                    <span className={styles.cardLabel}>
                      {post.caption ? post.caption.toUpperCase() : (post.mediaType === 'VIDEO' ? 'REEL' : 'TATUAJE')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </motion.div>

      </div>

      {/* Lightbox Modal Interactivo */}
      <AnimatePresence>
        {currentItem && (
          <motion.div 
            className={styles.lightboxOverlay} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            <button 
              className={styles.lightboxCloseBtn} 
              onClick={() => setLightboxIndex(null)}
              aria-label="Cerrar vista"
            >
              <X size={26} />
            </button>

            {/* Nav Arrows */}
            <button 
              className={`${styles.lightboxNavBtn} ${styles.lightboxPrev}`} 
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((prev) => (prev - 1 + posts.length) % posts.length)
              }}
              aria-label="Foto anterior"
            >
              <ChevronLeft size={28} />
            </button>

            <button 
              className={`${styles.lightboxNavBtn} ${styles.lightboxNext}`} 
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((prev) => (prev + 1) % posts.length)
              }}
              aria-label="Siguiente foto"
            >
              <ChevronRight size={28} />
            </button>

            <motion.div 
              className={styles.lightboxContent}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.lightboxMediaWrapper}>
                {currentItem.mediaType === 'VIDEO' ? (
                  <video src={currentItem.mediaUrl} controls autoPlay className={styles.lightboxMedia} />
                ) : (
                  <img src={currentItem.mediaUrl} alt={currentItem.caption} className={styles.lightboxMedia} />
                )}
              </div>

              <div className={styles.lightboxInfo}>
                <div>
                  <span className={styles.lightboxBadge}>{currentItem.category || 'Tatuaje Inked'}</span>
                  <h3 className={styles.lightboxTitle}>{currentItem.caption}</h3>
                </div>

                <div className={styles.lightboxActions}>
                  <Link href="/galeria" className={styles.lightboxBtnGallery}>
                    Ver Galería Completa
                  </Link>
                  <Link href="/reservar" className={styles.lightboxBtnBook}>
                    Cotizar Tatuaje
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
