'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { User } from 'lucide-react'
import SparklesBg from './SparklesBg'
import { useConfig } from '@/context/ConfigContext'
import styles from './Hero.module.css'

export default function Hero() {
  const { textos } = useConfig()
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })

  // Cinematic GPU-composited scroll transforms
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const opacityContent = useTransform(scrollYProgress, [0, 0.55, 0.95], [1, 0.5, 0])
  const scaleHero = useTransform(scrollYProgress, [0, 1], [1, 0.94])
  const darkOverlay = useTransform(scrollYProgress, [0, 0.35, 0.8, 1], [0, 0.35, 0.85, 1])

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  // Lightweight GPU-friendly animation variants (no heavy CSS filter blur on mount)
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const textLogoVars = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const currentPhoto = textos.artistPhoto || textos.artist_photo

  return (
    <section className={styles.hero} ref={ref}>
      {/* Background with Parallax & Particle Glow */}
      <motion.div style={{ y: yBg }} className={styles.bgParallax}>
        <SparklesBg count={30} />
      </motion.div>

      {/* Main Hero Container that scales and fades smoothly on scroll */}
      <motion.div
        className={styles.content}
        style={{ scale: scaleHero, opacity: opacityContent }}
      >
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
          >
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Artista InkedSouh"
                fetchPriority="high"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
            style={{ y: yText }}
          >
            <motion.div variants={textLogoVars} className={styles.logoContainer}>
              <h1 className={styles.heroTextLogo}>INKEDSOUH</h1>
            </motion.div>

            <motion.div variants={itemVars}>
              <div className={styles.redBadge}>
                {textos.heroBadge || textos.hero_badge || 'TATTOO STUDIO & TATTOO SUPPLIES'}
              </div>
            </motion.div>

            <motion.p variants={itemVars} className={styles.bio}>
              {textos.heroBio || textos.hero_bio || 'Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión. Con años de experiencia, fusiono creatividad y técnica para transformar tus ideas en arte permanente.'}
            </motion.p>

            <motion.div variants={itemVars}>
              <a
                href={textos.heroIgLink || textos.hero_ig_link || 'https://www.instagram.com/inked.tto/'}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.igLink} interactive magnetic`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                {textos.heroIg || textos.hero_ig || '@inked.tto'}
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Dynamic Scroll Darkening Overlay */}
      <motion.div
        className={styles.scrollDarkOverlay}
        style={{ opacity: darkOverlay }}
        aria-hidden="true"
      />

      {/* Bottom Gradient Transition to next section */}
      <div className={styles.bottomGradientTransition} />

      {/* Flecha de explorar */}
      <div
        className={`${styles.scrollArrow} interactive magnetic`}
        onClick={scrollToNext}
        role="button"
        tabIndex={0}
      >
        <span className={styles.scrollText}>EXPLORAR</span>
        <div className={styles.arrow} />
      </div>
    </section>
  )
}
