'use client'
import { useRef, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, useScroll, useTransform } from 'framer-motion'
import { User } from 'lucide-react'
import SparklesBg from './SparklesBg'
import { useConfig } from '@/context/ConfigContext'
import styles from './Hero.module.css'

export default function Hero() {
  const { textos } = useConfig()
  const ref = useRef(null)
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    async function fetchPhoto() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('site_config')
          .select('value')
          .eq('key_name', 'artist_photo')
          .maybeSingle()
        
        if (data && data.value) {
          try {
            const parsed = JSON.parse(data.value)
            setPhotoUrl(parsed.url || data.value)
          } catch {
            setPhotoUrl(data.value)
          }
        }
      } catch (err) {
        console.error('Error fetching photo from site_config', err)
      }
    }
    fetchPhoto()
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
  }

  const textLogoVars = {
    hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      scale: 1, 
      filter: 'blur(0px)',
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  }

  const currentPhoto = textos.artistPhoto || textos.artist_photo || photoUrl

  return (
    <section className={styles.hero} ref={ref}>
      <motion.div style={{ y: yBg }} className={styles.bgParallax}>
        <SparklesBg count={45} />
      </motion.div>

      <div className={styles.content}>
        <motion.div 
          className={styles.inner}
          variants={containerVars}
          initial="hidden"
          animate="visible"
        >
          {/* Foto del artista */}
          <motion.div 
            className={`${styles.imageWrap} interactive`}
            variants={textLogoVars}
            whileHover={{ scale: 1.02 }}
          >
            {currentPhoto ? (
              <img src={currentPhoto} alt="Artista InkedSouh" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className={styles.placeholder}>
                <User size={64} />
                <span>Foto del Artista</span>
              </div>
            )}
            <div className={styles.lightSweep} />
          </motion.div>

          {/* Información con Parallax y Stagger */}
          <motion.div 
            className={styles.info}
            style={{ y: yText, opacity: opacityText }}
          >
            <motion.div variants={textLogoVars} className={styles.logoContainer}>
              <h1 className={styles.heroTextLogo}>INKEDSOUH</h1>
            </motion.div>

            <motion.div variants={itemVars}>
              <div className={styles.redBadge}>
                {textos.heroBadge || textos.hero_badge || "ESPECIALISTA EN BLACKWORK"}
              </div>
            </motion.div>
            
            <motion.p variants={itemVars} className={styles.bio}>
              {textos.heroBio || textos.hero_bio || "Creando arte permanente en la piel. Cada diseño es único y personalizado a la medida de tu historia."}
            </motion.p>

            <motion.div variants={itemVars}>
              <a
                href={textos.heroIgLink || textos.hero_ig_link || "https://www.instagram.com/inked.tto/"}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.igLink} interactive magnetic`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                {textos.heroIg || textos.hero_ig || "@inked.tto"}
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Flecha de explorar */}
      <motion.div 
        className={`${styles.scrollArrow} interactive magnetic`} 
        onClick={scrollToNext}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        whileHover={{ y: 5 }}
      >
        <span className={styles.scrollText}>EXPLORAR</span>
        <div className={styles.arrow}></div>
      </motion.div>
    </section>
  )
}
