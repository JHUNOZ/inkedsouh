'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import styles from './estudiante.module.css'

export default function EstudianteDashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get all active student records for this user
      const { data: enrollments } = await supabase
        .from('students')
        .select(`
          status,
          expires_at,
          courses (
            id,
            title,
            description,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'activo') // Only active

      if (enrollments) {
        // Filter out expired courses
        const validCourses = enrollments.filter(en => {
          if (!en.expires_at) return true
          return new Date(en.expires_at) > new Date()
        })
        setCourses(validCourses)
      }
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Cursos</h1>
        <p className={styles.subtitle}>Aquí encontrarás todo el material que has adquirido</p>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Cargando tus cursos...</p>
      ) : courses.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} style={{ opacity: 0.5, marginBottom: '20px' }} />
          <h3>Aún no tienes cursos activos</h3>
          <p>Cuando adquieras un curso, aparecerá aquí automáticamente.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {courses.map((enrollment, idx) => (
            <div key={idx} className={styles.courseCard}>
              <img 
                src={enrollment.courses.image_url || 'https://images.unsplash.com/photo-1598371839696-5e8bb81c2018?q=80&w=600&auto=format&fit=crop'} 
                alt={enrollment.courses.title} 
                className={styles.courseImage} 
              />
              <div className={styles.courseContent}>
                <h3 className={styles.courseTitle}>{enrollment.courses.title}</h3>
                <p className={styles.courseDescription}>
                  {enrollment.courses.description || 'Sin descripción disponible.'}
                </p>
                
                <div className={styles.courseFooter}>
                  <div className={styles.expiryDate}>
                    {enrollment.expires_at ? `Expira: ${new Date(enrollment.expires_at).toLocaleDateString()}` : 'Acceso de por vida'}
                  </div>
                  {/* Aquí iría el enlace real al contenido del curso */}
                  <Link href={`/estudiante/cursos/${enrollment.courses.id}`} className={styles.btnAccess}>
                    Entrar al Curso
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
