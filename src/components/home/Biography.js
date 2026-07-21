'use client'
// Sección de biografía del tatuador con animaciones de entrada
import { useEffect, useRef } from 'react'
import { User } from 'lucide-react'
import styles from './Biography.module.css'

export default function Biography() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    const items = sectionRef.current?.querySelectorAll('.reveal-left, .reveal-right, .reveal')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="biografia" ref={sectionRef}>
      <div className={styles.inner}>
        {/* Foto — entra desde la izquierda */}
        <div className={`${styles.imageWrap} reveal-left`}>
          <div className={styles.placeholder}>
            <User size={48} />
            <span>Foto del Artista</span>
          </div>
        </div>

        {/* Info — entra desde la derecha */}
        <div className={`${styles.info} reveal-right`}>
          <span className={styles.label}>Biografía</span>
          <h2 className={styles.name}>INKEDSOUH</h2>
          <p className={styles.bio}>
            Artista del tatuaje especializado en crear obras únicas sobre la piel. 
            Cada diseño es una expresión personal de arte y pasión. Con años de experiencia, 
            fusiono creatividad y técnica para transformar tus ideas en arte permanente.
          </p>

          {/* Tags de especialidades */}
          <div className={styles.tags}>
            {['Blackwork', 'Lettering', 'Realismo', 'Neotradicional'].map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>

          {/* Link a Instagram */}
          <a
            href="https://www.instagram.com/inked.tto/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.igLink}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            @inked.tto
          </a>
        </div>
      </div>
    </section>
  )
}
