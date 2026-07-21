'use client'
// Sección CTA Agendar — Split Layout con Video Placeholder y Geometría
import { useEffect, useRef } from 'react'
import { ArrowRight, Video } from 'lucide-react'
import BubbleButton from '@/components/ui/BubbleButton'
import { useConfig } from '@/context/ConfigContext'
import styles from './BookingCTA.module.css'

export default function BookingCTA() {
  const sectionRef = useRef(null)
  const { textos } = useConfig()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.2 }
    )
    const items = sectionRef.current?.querySelectorAll('.reveal-left, .reveal-right')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} ref={sectionRef}>
      {/* Partículas Geométricas de Tatuaje de fondo */}
      <div className={styles.geometricParticles}>
        <div className={`${styles.geoShape} ${styles.diamond}`} />
        <div className={`${styles.geoShape} ${styles.circle}`} />
        <div className={`${styles.geoShape} ${styles.triangle}`} />
        <div className={`${styles.geoShape} ${styles.dots}`} />
        <div className={`${styles.geoShape} ${styles.cross}`} />
      </div>

      <div className={styles.inner}>
        {/* Lado Izquierdo: Placeholder Video Elegante */}
        <div className={`${styles.videoBox} reveal-left`}>
          <video 
            src="/images/videoprom.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className={styles.promoVideo}
          />
          {/* Esquinas decorativas */}
          <div className={styles.cornerTopLeft} />
          <div className={styles.cornerBottomRight} />
        </div>

        {/* Lado Derecho: Contenido y CTA */}
        <div className={`${styles.content} reveal-right`}>
          <h2 className={styles.title}>{textos.ctaTitle}</h2>
          
          <div className={styles.divider}>
            <span className={styles.dot}></span>
            <span className={styles.line}></span>
            <span className={styles.dot}></span>
          </div>

          <p className={styles.text}>
            {textos.ctaText}
          </p>

          <BubbleButton href="/reservar" size="large" className={styles.ctaButton}>
            {textos.ctaButton} <ArrowRight size={18} />
          </BubbleButton>
        </div>
      </div>
    </section>
  )
}
