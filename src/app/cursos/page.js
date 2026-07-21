'use client'
// Página de cursos — Con soporte para overlay 'Próximamente'
import { useState, useEffect } from 'react'
import { BookOpen, Play, Clock, Award } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { COURSE_LEVELS } from '@/lib/constants'
import styles from './cursos.module.css'

export default function CursosPage() {
  const [isComingSoon, setIsComingSoon] = useState(true) // Por defecto true para evitar flickr
  const [loadingConfig, setLoadingConfig] = useState(true)

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setIsComingSoon(data.coursesComingSoon !== false)
        setLoadingConfig(false)
      })
      .catch(() => {
        setIsComingSoon(true)
        setLoadingConfig(false)
      })
  }, [])

  // Cursos placeholder
  const courses = [
    {
      id: 1,
      title: 'Introducción al Tatuaje',
      description: 'Aprende los fundamentos del arte del tatuaje: higiene, materiales, técnicas básicas y tu primer trazo. Este curso te dará las bases necesarias para comenzar tu camino como tatuador.',
      price: 49990,
      level: 'principiante',
      duration: '8 horas',
      lessons: 12
    },
    {
      id: 2,
      title: 'Lettering Avanzado',
      description: 'Domina el arte del lettering en tatuaje. Tipografías, estilos caligráficos y composición. Aprenderás a crear piezas de texto únicas y profesionales.',
      price: 79990,
      level: 'avanzado',
      duration: '12 horas',
      lessons: 18
    },
    {
      id: 3,
      title: 'Blackwork & Dotwork',
      description: 'Técnicas de relleno negro sólido y puntillismo para crear piezas impactantes. Desde patrones geométricos hasta composiciones orgánicas.',
      price: 69990,
      level: 'intermedio',
      duration: '10 horas',
      lessons: 15
    }
  ]

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionTitle subtitle="Aprende el arte del tatuaje profesional">CURSOS</SectionTitle>

          <div className={styles.coursesWrapper}>
            {/* Overlay Próximamente */}
            {!loadingConfig && isComingSoon && (
              <div className={styles.comingSoonOverlay}>
                <div className={styles.comingSoonBox}>
                  <Clock size={48} className={styles.comingSoonIcon} />
                  <h2>Próximamente</h2>
                  <p>Nuestros cursos están en preparación. Muy pronto podrás acceder a este contenido exclusivo.</p>
                  <div className={styles.comingSoonLine} />
                </div>
              </div>
            )}

            {/* Grid de Cursos (se difumina si isComingSoon es true) */}
            <div className={`${styles.grid} ${isComingSoon ? styles.gridBlurred : ''}`}>
              {courses.map((course) => (
                <div key={course.id} className={styles.card}>
                  <div className={styles.cardImage}>
                    <BookOpen size={44} />
                    <div className={styles.playOverlay}>
                      <Play size={32} />
                    </div>
                    <span
                      className={styles.levelBadge}
                      style={{ background: COURSE_LEVELS[course.level]?.color }}
                    >
                      {COURSE_LEVELS[course.level]?.label}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{course.title}</h3>
                    <p className={styles.cardDesc}>{course.description}</p>

                    <div className={styles.meta}>
                      <div className={styles.metaItem}>
                        <Clock size={14} />
                        <span>{course.duration}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <BookOpen size={14} />
                        <span>{course.lessons} lecciones</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Award size={14} />
                        <span>Certificado</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.price}>{formatPrice(course.price)}</span>
                      <BubbleButton size="small" disabled={isComingSoon}>
                        Comprar Curso
                      </BubbleButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
