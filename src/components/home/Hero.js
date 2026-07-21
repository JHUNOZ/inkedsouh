'use client'
// Hero Section — Integrado con Biografía (Nuevo Start) y Contexto Global
import { User } from 'lucide-react'
import SparklesBg from './SparklesBg'
import { useConfig } from '@/context/ConfigContext'
import styles from './Hero.module.css'

export default function Hero() {
  const { textos } = useConfig()

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <section className={styles.hero}>
      {/* Fondo estético sutil */}
      <SparklesBg count={35} />
      <div className={styles.content}>
        <div className={styles.inner}>
          {/* Foto del artista con Dark Tech Style */}
          <div className={`${styles.imageWrap} reveal-scale bracket-borders scanlines`}>
            <div className={styles.placeholder}>
              <User size={64} />
              <span>Foto del Artista</span>
            </div>
            <div className={styles.lightSweep} />
          </div>

          {/* Información */}
          <div className={styles.info}>
            <div className={`${styles.logoContainer} reveal`}>
              <h1 className={styles.heroTextLogo}>INKEDSOUH</h1>
            </div>

            <div className="reveal">
              <div className={styles.redBadge}>
                {textos.heroBadge}
              </div>
            </div>
            
            <p className={`${styles.bio} reveal`}>
              {textos.heroBio}
            </p>

            {/* Link a Instagram */}
            <div className="reveal">
              <a
                href={textos.heroIgLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.igLink}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                {textos.heroIg}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Flecha de explorar */}
      <div className={styles.scrollArrow} onClick={scrollToNext}>
        <span className={styles.scrollText}>EXPLORAR</span>
        <div className={styles.arrow}></div>
      </div>
    </section>
  )
}
