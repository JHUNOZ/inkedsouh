'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, X, ExternalLink, Eye, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import VideoPreview from '@/components/ui/VideoPreview'
import { createClient } from '@/lib/supabase/client'
import { isVideoUrl } from '@/lib/productUtils'
import Link from 'next/link'
import styles from './GalleryPreview.module.css'

export default function GalleryPreview() {
  const carouselRef = useRef(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [activeSlide, setActiveSlide] = useState(1)

  // Drag-to-scroll state for desktop mouse
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false
  })

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
          .from('instagram_cache')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (!error && data && data.length > 0) {
          const formatted = data.map(item => {
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
              permalink: item.media_url,
              mediaUrl: item.media_url,
              mediaType: item.media_type || 'IMAGE',
              caption: itemTitle,
              category: itemCategory
            }
          })
          setPosts(formatted)
        } else {
          setPosts([])
        }
      } catch (err) {
        console.error('Error loading gallery feed:', err)
        setPosts([])
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
    if (e.key === 'ArrowRight' && posts.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % posts.length)
    }
    if (e.key === 'ArrowLeft' && posts.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + posts.length) % posts.length)
    }
  }, [lightboxIndex, posts.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current
    if (!el || posts.length === 0) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) {
      setActiveSlide(1)
      return
    }
    const progress = el.scrollLeft / maxScroll
    const idx = Math.min(posts.length, Math.max(1, Math.round(progress * (posts.length - 1)) + 1))
    setActiveSlide(idx)
  }, [posts.length])

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -380, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 380, behavior: 'smooth' })
    }
  }

  // Smooth desktop mouse drag-to-scroll without breaking touch or clicks
  const onMouseDown = (e) => {
    const el = carouselRef.current
    if (!el) return
    dragState.current.isDown = true
    dragState.current.moved = false
    dragState.current.startX = e.pageX - el.offsetLeft
    dragState.current.scrollLeft = el.scrollLeft
  }

  const onMouseLeaveOrUp = () => {
    dragState.current.isDown = false
  }

  const onMouseMove = (e) => {
    if (!dragState.current.isDown) return
    const el = carouselRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - dragState.current.startX) * 1.4
    if (Math.abs(walk) > 8) {
      dragState.current.moved = true
      e.preventDefault()
      el.scrollLeft = dragState.current.scrollLeft - walk
    }
  }

  const handleCardClick = (index) => {
    if (dragState.current.moved) return
    setLightboxIndex(index)
  }

  const currentItem = lightboxIndex !== null && posts[lightboxIndex] ? posts[lightboxIndex] : null

  return (
    <section className={styles.section} id="galeria-preview">
      <div className={styles.inner}>
        {/* Encabezado Superior */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <SectionTitle number="01" subtitle="PORTAFOLIO DE TRABAJOS">GALERÍA</SectionTitle>
        </motion.div>

        {/* Controles del Carrusel y Link a Galería */}
        <motion.div
          className={styles.controlsRow}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className={styles.navButtons}>
            <button className={`${styles.navBtn} interactive magnetic`} onClick={scrollLeft} aria-label="Anterior">
              <ArrowLeft size={18} />
            </button>
            <button className={`${styles.navBtn} interactive magnetic`} onClick={scrollRight} aria-label="Siguiente">
              <ArrowRight size={18} />
            </button>
            <span className={styles.counter}>
              {posts.length > 0
                ? `${String(activeSlide).padStart(2, '0')} / ${String(posts.length).padStart(2, '0')}`
                : '00 / 00'}
            </span>
          </div>

          <Link
            href="/galeria"
            className={`${styles.igLink} interactive magnetic`}
          >
            <span>VER GALERÍA COMPLETA</span>
            <ExternalLink size={14} />
          </Link>
        </motion.div>

        {loading ? (
          <div className={styles.carousel}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.placeholder} />
                <div className={styles.cardFooter}>
                  <span className={styles.cardNumber}>--</span>
                  <div className={styles.cardLine} />
                  <span className={styles.cardLabel}>CARGANDO...</span>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyGalleryBanner}>
            <div className={styles.emptyIconWrap}>
              <ImageIcon size={44} style={{ color: '#ff2a3d' }} />
            </div>
            <h3>Portafolio en Actualización</h3>
            <p>El artista está subiendo nuevos trabajos y sesiones de tatuaje. Puedes seguir las publicaciones diarias en Instagram o cotizar tu cita.</p>
            <div className={styles.emptyActions}>
              <a
                href="https://www.instagram.com/inked.tto/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnEmptyIg}
              >
                Seguir @inked.tto
              </a>
              <Link href="/reservar" className={styles.btnEmptyBook}>
                Agendar Cita
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.carouselWrap}>
            <div
              className={styles.carousel}
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeaveOrUp}
              onMouseUp={onMouseLeaveOrUp}
              onMouseMove={onMouseMove}
            >
              {posts.map((post, index) => (
                <div
                  key={post.id || index}
                  className={`${styles.card} interactive`}
                  onClick={() => handleCardClick(index)}
                  title="Clic para ver en detalle"
                  role="button"
                  tabIndex={0}
                >
                  {(post.mediaType === 'VIDEO' || isVideoUrl(post.mediaUrl)) ? (
                    <VideoPreview
                      src={post.mediaUrl}
                      className={styles.igMedia}
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || 'Galería de Tatuajes'}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className={styles.igMedia}
                    />
                  )}

                  <div className={styles.hoverOverlay}>
                    <div className={styles.hoverAction}>
                      <Eye size={18} />
                      <span>Ver Obra</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <div className={styles.cardLine} />
                    <span className={styles.cardLabel}>
                      {post.caption ? post.caption.toUpperCase() : (post.mediaType === 'VIDEO' ? 'REEL' : 'TATUAJE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

            {posts.length > 1 && (
              <>
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
              </>
            )}

            <motion.div
              className={styles.lightboxContent}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.lightboxMediaWrapper}>
                {(currentItem.mediaType === 'VIDEO' || isVideoUrl(currentItem.mediaUrl)) ? (
                  <video src={currentItem.mediaUrl} controls autoPlay muted loop playsInline className={styles.lightboxMedia} />
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
