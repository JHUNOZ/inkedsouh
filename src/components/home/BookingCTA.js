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
        {/* Lado Izquierdo: Placeholder Video Elegante */}
        <motion.div 
          className={`${styles.videoBox} interactive magnetic`}
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          whileHover={{ scale: 1.02, rotateY: 5 }}
          style={{ perspective: 1000 }}
        >
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
        </motion.div>

        {/* Lado Derecho: Contenido y CTA */}
        <motion.div 
          className={styles.content}
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
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
        </motion.div>
      </div>
    </section>
  )
}
