'use client'
import { useState, useEffect } from 'react'
import { BookOpen, Play, Clock, Award } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import styles from './cursos.module.css'

export default function CursosPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      
    if (data) {
      setCourses(data)
    }
    setLoading(false)
  }

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionTitle subtitle="Aprende el arte del tatuaje profesional">CURSOS DISPONIBLES</SectionTitle>

          <div className={styles.coursesWrapper}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Cargando cursos...</div>
            ) : courses.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                Aún no hay cursos activos. ¡Vuelve pronto!
              </div>
            ) : (
              <div className={styles.grid}>
                {courses.map((course) => (
                  <div key={course.id} className={styles.card}>
                    <div className={styles.cardImage}>
                      {course.image_url ? (
                        <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <BookOpen size={44} />
                      )}
                      <div className={styles.playOverlay}>
                        <Play size={32} />
                      </div>
                    </div>
                    
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{course.title}</h3>
                      <p className={styles.cardDesc}>{course.description || 'Sin descripción detallada.'}</p>

                      <div className={styles.meta}>
                        <div className={styles.metaItem}>
                          <Clock size={14} />
                          <span>Online</span>
                        </div>
                        <div className={styles.metaItem}>
                          <BookOpen size={14} />
                          <span>A tu ritmo</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Award size={14} />
                          <span>Certificado</span>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <span className={styles.price}>{formatPrice(course.price)}</span>
                        <Link href={`/checkout/${course.id}`} className={styles.btnComprar}>
                          Comprar Curso
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
