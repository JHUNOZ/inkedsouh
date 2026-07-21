'use client'
// Preview de cursos — Próximamente
import { useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import styles from './CoursesPreview.module.css'

export default function CoursesPreview() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    const items = sectionRef.current?.querySelectorAll('.reveal, .reveal-scale')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="cursos-preview" ref={sectionRef}>
      <div className={styles.inner}>
        <div className="reveal">
          <SectionTitle subtitle="Aprende el arte del tatuaje">CURSOS</SectionTitle>
        </div>

        {/* Banner Próximamente */}
        <div className={`${styles.comingSoon} reveal-scale`}>
          <div className={styles.comingIcon}>
            <Clock size={48} strokeWidth={1.2} />
          </div>
          <h3 className={styles.comingTitle}>Próximamente</h3>
          <p className={styles.comingText}>
            Estamos preparando cursos increíbles para que aprendas el arte del tatuaje
            de la mano de profesionales. ¡Mantente atento!
          </p>
          <div className={styles.comingLine} />
        </div>
      </div>
    </section>
  )
}
