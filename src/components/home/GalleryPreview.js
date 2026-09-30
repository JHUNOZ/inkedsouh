'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import styles from './GalleryPreview.module.css'

export default function GalleryPreview() {
  const carouselRef = useRef(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

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
          setPosts(data.map(item => ({
            id: item.id,
            permalink: item.permalink || item.media_url,
            mediaUrl: item.media_url,
            mediaType: item.media_type,
            caption: 'InkedSouh Tattoo Art'
          })))
        } else {
          // Curated aesthetic fallback portfolio works
          setPosts([
            { id: '1', mediaUrl: 'https://images.unsplash.com/photo-1598371839696-5e8bb81c2018?q=80&w=800&auto=format&fit=crop', mediaType: 'IMAGE', caption: 'Realismo Sombras' },
            { id: '2', mediaUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?q=80&w=800&auto=format&fit=crop', mediaType: 'IMAGE', caption: 'Blackwork Sleeve' },
            { id: '3', mediaUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=800&auto=format&fit=crop', mediaType: 'IMAGE', caption: 'Fine Line & Floral' },
            { id: '4', mediaUrl: 'https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=800&auto=format&fit=crop', mediaType: 'IMAGE', caption: 'Lettering & Caligrafía' }
          ])
        }
      } catch (err) {
        console.error('Error loading gallery feed:', err)
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

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

  return (
    <section className={styles.section} id="galeria-preview">
      <div className={styles.inner}>
        
        {/* Encabezado Superior (Botones y Título) */}
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
              // Skeleton Loading
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
                <Link 
                  key={post.id} 
                  href="/galeria"
                  className={`${styles.card} bracket-borders scanlines interactive magnetic`}
                >
                  {post.mediaType === 'VIDEO' ? (
                    <video src={post.mediaUrl} autoPlay muted loop playsInline className={styles.igMedia} />
                  ) : (
                    <img src={post.mediaUrl} alt={post.caption || 'Galería de Tatuajes'} className={styles.igMedia} />
                  )}
                  
                  <div className={styles.cardFooter}>
                    <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <div className={styles.cardLine}></div>
                    <span className={styles.cardLabel}>
                      {post.mediaType === 'VIDEO' ? 'REEL' : 'TATUAJE'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
