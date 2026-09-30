'use client'
import { useEffect, useState, useRef } from 'react'
import { Clock, BookOpen, Play, Award, ArrowRight } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import styles from './CoursesPreview.module.css'

export default function CoursesPreview() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef(null)

  useEffect(() => {
    async function loadCourses() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .limit(3)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setCourses(data)
        }
      } catch (err) {
        console.error('Error fetching courses preview:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

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
  }, [courses])

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0)

  return (
    <section className={styles.section} id="cursos-preview" ref={sectionRef}>
      <div className={styles.inner}>
        <div className="reveal">
          <SectionTitle subtitle="Aprende el arte del tatuaje profesional">
            FORMACIÓN & MASTERCLASSES
          </SectionTitle>
        </div>

        {courses.length > 0 ? (
          <div className={styles.coursesGrid}>
            {courses.map((course) => (
              <div key={course.id} className={`${styles.courseCard} reveal-scale`}>
                <div className={styles.courseCardImage}>
                  <img 
                    src={course.image_url || 'https://images.unsplash.com/photo-1598371839696-5e8bb81c2018?q=80&w=800&auto=format&fit=crop'} 
                    alt={course.title} 
                    loading="lazy"
                  />
                  <div className={styles.playBadge}>
                    <Play size={18} fill="#fff" />
                  </div>
                </div>

                <div className={styles.courseCardBody}>
                  <div className={styles.courseMeta}>
                    <span><Clock size={12} /> {course.duration || 'Online'}</span>
                    <span><Award size={12} /> Certificado</span>
                  </div>

                  <h3 className={styles.courseCardTitle}>{course.title}</h3>
                  <p className={styles.courseCardDesc}>
                    {course.description || 'Domina técnicas avanzadas con explicaciones paso a paso.'}
                  </p>

                  <div className={styles.courseCardFooter}>
                    <span className={styles.coursePrice}>{formatPrice(course.price)}</span>
                    <Link href={`/cursos`} className={styles.btnCourseDetail}>
                      <span>Ver Temario</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Banner Próximamente si no hay cursos creados aún */
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
        )}

        {courses.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <BubbleButton href="/cursos" variant="outline">
              Explorar Todos los Cursos
            </BubbleButton>
          </div>
        )}
      </div>
    </section>
  )
}
