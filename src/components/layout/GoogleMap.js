'use client'
// Sección de Google Maps con carga diferida e información de contacto - Dark Tech Style
import { useState, useEffect, useRef } from 'react'
import { MapPin, Clock, Phone, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import { SITE_LOCATION } from '@/lib/constants'
import styles from './GoogleMap.module.css'

export default function GoogleMap() {
  const [loadMap, setLoadMap] = useState(false)
  const mapSectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadMap(true)
          observer.disconnect()
        }
      },
      { rootMargin: '250px' }
    )

    if (mapSectionRef.current) {
      observer.observe(mapSectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  }

  const cardVars = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  }

  const slideLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  }

  const slideRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  }

  return (
    <section className={styles.section} id="ubicacion" ref={mapSectionRef}>
      <div className={styles.inner}>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={slideLeft}
        >
          <SectionTitle number="02" subtitle="VISÍTANOS">UBICACIÓN</SectionTitle>
        </motion.div>

        <div className={styles.content}>
          {/* Lado Izquierdo: Información */}
          <motion.div 
            className={styles.infoCol}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVars}
          >
            
            {/* Tarjetas de info */}
            <motion.div className={styles.infoCard} variants={cardVars}>
              <MapPin className={styles.icon} size={20} />
              <div className={styles.textData}>
                <span className={styles.label}>DIRECCIÓN</span>
                <span className={styles.value}>{SITE_LOCATION}</span>
              </div>
            </motion.div>

            <motion.div className={styles.infoCard} variants={cardVars}>
              <Clock className={styles.icon} size={20} />
              <div className={styles.textData}>
                <span className={styles.label}>HORARIO</span>
                <span className={styles.value}>Lun — Vie: 10:00 — 19:00</span>
                <span className={styles.value}>Sáb: 10:00 — 15:00</span>
              </div>
            </motion.div>

            <motion.div className={styles.infoCard} variants={cardVars}>
              <Phone className={styles.icon} size={20} />
              <div className={styles.textData}>
                <span className={styles.label}>TELÉFONO</span>
                <span className={styles.value}>+56 9 3025 4425</span>
              </div>
            </motion.div>

            {/* Botón Cómo Llegar con Bracket Borders */}
            <motion.a 
              href="https://www.google.com/maps?ll=-34.172422,-70.738208&z=16&t=m&hl=es-ES&gl=US&mapclient=embed&q=Almarza+552+2820000+Rancagua+O%27Higgins" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${styles.directionsBtn} bracket-borders interactive magnetic`}
              variants={cardVars}
            >
              CÓMO LLEGAR <ArrowUpRight size={16} />
            </motion.a>

          </motion.div>

          {/* Lado Derecho: Mapa enmarcado con carga diferida */}
          <motion.div 
            className={styles.mapCol}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideRight}
          >
            <div className={`${styles.mapContainer} bracket-borders`}>
              {loadMap ? (
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.5!2d-70.7394!3d-34.1701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x966318c8e5a1f1f1%3A0x1!2sAlmarza%20552%2C%20Rancagua%2C%20Chile!5e0!3m2!1ses!2scl!4v1"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación INKEDSOUH"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d12', color: '#555' }}>
                  <span>Cargando mapa interactivo...</span>
                </div>
              )}
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}
