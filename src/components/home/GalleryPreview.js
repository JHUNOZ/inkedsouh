'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import styles from './GalleryPreview.module.css'

export default function GalleryPreview() {
  const sectionRef = useRef(null)
  const carouselRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" })

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch Instagram Feed via Behold
  useEffect(() => {
    async function loadInstagram() {
      try {
        const res = await fetch('https://feeds.behold.so/OUKfskH2X1qKx0Z1aVhr')
        const data = await res.json()
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts.slice(0, 8)) // Últimas 8 fotos
        } else if (Array.isArray(data)) {
          setPosts(data.slice(0, 8))
        }
      } catch (err) {
        console.error('Error loading IG feed:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInstagram()
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
    <section className={styles.section} id="galeria-preview" ref={sectionRef}>
      <div className={styles.inner}>
        
        {/* Encabezado Superior (Botones y Título) */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle number="01" subtitle="PORTFOLIO">GALERÍA</SectionTitle>
        </motion.div>

        {/* Controles del Carrusel y Link a IG */}
        <motion.div 
          className={styles.controlsRow}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
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

          <a
            href="https://www.instagram.com/inked.tto/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.igLink} interactive magnetic`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span>+ INSTAGRAM</span>
          </a>
        </motion.div>

        <motion.div 
          className={styles.carouselWrap}
          variants={containerVars}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
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
                    <span className={styles.cardLabel}>LOADING...</span>
                  </div>
                </motion.div>
              ))
            ) : (
              posts.map((post, index) => (
                <motion.a 
                  key={post.id} 
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.card} bracket-borders scanlines interactive magnetic`}
                  variants={itemVars}
                  whileHover={{ scale: 0.98 }}
                >
                  {post.mediaType === 'VIDEO' ? (
                    <video src={post.mediaUrl} autoPlay muted loop playsInline className={styles.igMedia} />
                  ) : (
                    <img src={post.mediaUrl} alt={post.caption || 'Instagram Post'} className={styles.igMedia} />
                  )}
                  
                  <div className={styles.cardFooter}>
                    <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <div className={styles.cardLine}></div>
                    <span className={styles.cardLabel}>
                      {post.mediaType === 'VIDEO' ? 'REEL' : 'PORTFOLIO'}
                    </span>
                  </div>
                </motion.a>
              ))
            )}
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
