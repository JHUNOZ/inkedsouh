'use client'
import { useRef, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import BubbleButton from '@/components/ui/BubbleButton'
import { useConfig } from '@/context/ConfigContext'
import styles from './BookingCTA.module.css'

export default function BookingCTA() {
  const { textos } = useConfig()
  const videoRef = useRef(null)

  const mediaUrl = textos.cta_media_url || textos.ctaMedia || textos.cta_image
  const isVideo = !mediaUrl || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.includes('video')
  const videoSrc = mediaUrl && isVideo ? mediaUrl : '/images/videoprom.mp4'

  // Only play promo video when visible in viewport to save GPU/CPU & mobile battery
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [videoSrc])

  const slideLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const slideRight = {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <section className={styles.section}>
      {/* Partículas Geométricas de Tatuaje de fondo */}
      <div className={styles.geometricParticles}>
        <div className={`${styles.geoShape} ${styles.diamond}`} />
        <div className={`${styles.geoShape} ${styles.circle}`} />
        <div className={`${styles.geoShape} ${styles.triangle}`} />
        <div className={`${styles.geoShape} ${styles.dots}`} />
        <div className={`${styles.geoShape} ${styles.cross}`} />
      </div>

      <div className={styles.inner}>
        {/* Lado Izquierdo: Video / Imagen */}
        <motion.div
          className={`${styles.videoBox} interactive`}
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={videoSrc}
              loop
              muted
              playsInline
              preload="metadata"
              className={styles.promoVideo}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Agendar Cita INKEDSOUH"
              loading="lazy"
              decoding="async"
              className={styles.promoVideo}
              style={{ objectFit: 'cover' }}
            />
          )}
          <div className={styles.cornerTopLeft} />
          <div className={styles.cornerBottomRight} />
        </motion.div>

        {/* Lado Derecho: Contenido y CTA */}
        <motion.div
          className={styles.content}
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <h2 className={styles.title}>
            {textos.cta_title || textos.ctaTitle || 'AGENDAR TU CITA'}
          </h2>

          <div className={styles.divider}>
            <span className={styles.dot} />
            <span className={styles.line} />
            <span className={styles.dot} />
          </div>

          <p className={styles.text}>
            {textos.cta_subtitle || textos.cta_text || textos.ctaText || 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.'}
          </p>

          <BubbleButton href="/reservar" size="large" className={styles.ctaButton}>
            {textos.cta_button_text || textos.cta_button || textos.ctaButton || 'RESERVAR AHORA'} <ArrowRight size={18} />
          </BubbleButton>
        </motion.div>
      </div>
    </section>
  )
}
