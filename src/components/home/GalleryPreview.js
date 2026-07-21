'use client'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink, ArrowLeft, ArrowRight } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import styles from './GalleryPreview.module.css'

export default function GalleryPreview() {
  const sectionRef = useRef(null)
  const carouselRef = useRef(null)

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

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    const items = sectionRef.current?.querySelectorAll('.reveal, .reveal-left')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
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

  return (
    <section className={styles.section} id="galeria-preview" ref={sectionRef}>
      <div className={styles.inner}>
        
        {/* Encabezado Superior (Botones y Título) */}
        <div className={styles.header}>
          <div className="reveal-left">
            <SectionTitle number="01" subtitle="PORTFOLIO">GALERÍA</SectionTitle>
          </div>
        </div>

        {/* Controles del Carrusel y Link a IG */}
        <div className={`${styles.controlsRow} reveal`}>
          <div className={styles.navButtons}>
            <button className={styles.navBtn} onClick={scrollLeft} aria-label="Anterior">
              <ArrowLeft size={18} />
            </button>
            <button className={styles.navBtn} onClick={scrollRight} aria-label="Siguiente">
              <ArrowRight size={18} />
            </button>
            <span className={styles.counter}>{posts.length > 0 ? `01 / ${String(posts.length).padStart(2, '0')}` : '...'}</span>
          </div>

          <a
            href="https://www.instagram.com/inked.tto/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.igLink}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span>+ INSTAGRAM</span>
          </a>
        </div>

        <div className={`${styles.carousel} reveal`} ref={carouselRef}>
          {loading ? (
            // Skeleton Loading
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${styles.card} bracket-borders scanlines`}>
                <div className={styles.placeholder} />
                <div className={styles.cardFooter}>
                  <span className={styles.cardNumber}>--</span>
                  <div className={styles.cardLine}></div>
                  <span className={styles.cardLabel}>LOADING...</span>
                </div>
              </div>
            ))
          ) : (
            posts.map((post, index) => (
              <a 
                key={post.id} 
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.card} bracket-borders scanlines`}
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
              </a>
            ))
          )}
        </div>

      </div>
    </section>
  )
}
