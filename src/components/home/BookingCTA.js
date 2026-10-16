'use client'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import BubbleButton from '@/components/ui/BubbleButton'
import { useConfig } from '@/context/ConfigContext'
import styles from './BookingCTA.module.css'

export default function BookingCTA() {
  const { textos } = useConfig()

  const slideLeft = {
    hidden: { opacity: 0, x: -50, rotateY: 10 },
    visible: { 
      opacity: 1, 
      x: 0, 
      rotateY: 0, 
      transition: { duration: 0.8, type: 'spring', stiffness: 100 } 
    }
  }

  const slideRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 } 
    }
  }

  const mediaUrl = textos.cta_media_url || textos.ctaMedia || textos.cta_image

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
        {/* Lado Izquierdo: Placeholder Video / Imagen Elegante */}
        <motion.div 
          className={`${styles.videoBox} interactive magnetic`}
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          whileHover={{ scale: 1.02, rotateY: 5 }}
          style={{ perspective: 1000 }}
        >
          {mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.includes('video')) ? (
            <video 
              src={mediaUrl} 
              autoPlay 
              loop 
              muted 
              playsInline
              className={styles.promoVideo}
            />
          ) : mediaUrl ? (
            <img 
              src={mediaUrl} 
              alt="Agendar Cita INKEDSOUH"
              className={styles.promoVideo}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <video 
              src="/images/videoprom.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className={styles.promoVideo}
            />
          )}
          {/* Esquinas decorativas */}
          <div className={styles.cornerTopLeft} />
          <div className={styles.cornerBottomRight} />
        </motion.div>

        {/* Lado Derecho: Contenido y CTA */}
        <motion.div 
          className={styles.content}
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className={styles.title}>
            {textos.cta_title || textos.ctaTitle || 'AGENDAR TU CITA'}
          </h2>
          
          <div className={styles.divider}>
            <span className={styles.dot}></span>
            <span className={styles.line}></span>
            <span className={styles.dot}></span>
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
