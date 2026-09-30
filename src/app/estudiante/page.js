'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  BookOpen, Play, CheckCircle, Clock, Award, 
  Sparkles, ArrowRight, ShieldCheck, Flame 
} from 'lucide-react'
import styles from './estudiante.module.css'

export default function EstudianteDashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUserProfile(user)
          // 1. Try to get enrollments from database
          const { data: enrollments } = await supabase
            .from('students')
            .select(`
              id,
              status,
              expires_at,
              progress,
              courses (
                id,
                title,
                description,
                image_url,
                duration,
                level,
                modules
              )
            `)
            .eq('user_id', user.id)
            .eq('status', 'activo')

          if (enrollments && enrollments.length > 0) {
            const validCourses = enrollments.filter(en => {
              if (!en.expires_at) return true
              return new Date(en.expires_at) > new Date()
            })
            setCourses(validCourses)
          } else {
            // Fallback: If no direct student enrollment is linked to this user_id yet,
            // also check active public courses so the student can preview or explore their assigned material
            const { data: allCourses } = await supabase
              .from('courses')
              .select('*')
              .eq('is_active', true)
              .limit(3)
            
            if (allCourses && allCourses.length > 0) {
              setCourses(allCourses.map(c => ({
                id: `enr-${c.id}`,
                status: 'activo',
                expires_at: null,
                courses: c
              })))
            }
          }
        }
      } catch (err) {
        console.error('Error loading student courses:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <div className={styles.welcomeHero}>
        <div className={styles.welcomeInfo}>
          <div className={styles.tagline}>
            <Sparkles size={14} className={styles.tagIcon} />
            <span>PORTAL DE APRENDIZAJE PRO</span>
          </div>
          <h1 className={styles.title}>
            Bienvenido, <span className={styles.nameHighlight}>{userProfile?.email?.split('@')[0] || 'Tatuador'}</span>
          </h1>
          <p className={styles.subtitle}>
            Continúa perfeccionando tu técnica. Domina el arte de las agujas, sombras y líneas con formación de clase mundial.
          </p>
        </div>

        <div className={styles.statsOverview}>
          <div className={styles.statPill}>
            <Flame size={18} className={styles.statPillIcon} />
            <div>
              <strong>{courses.length}</strong>
              <span>Cursos Disponibles</span>
            </div>
          </div>
          <div className={styles.statPill}>
            <ShieldCheck size={18} style={{ color: '#4ade80' }} />
            <div>
              <strong>Activo</strong>
              <span>Membresía Verificada</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Tus Cursos y Clases</h2>
          <p className={styles.sectionDesc}>Accede a las videoclases, temarios interactivos y recursos descargables.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Cargando tu aula virtual...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>Aún no tienes cursos asignados</h3>
          <p>Cuando adquieras un curso en la tienda o seas matriculado por el estudio, aparecerá aquí inmediatamente.</p>
          <Link href="/cursos" className={styles.btnExplore}>
            Explorar Catálogo de Cursos
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {courses.map((enrollment) => {
            const course = enrollment.courses
            if (!course) return null

            let moduleCount = 0
            if (Array.isArray(course.modules)) moduleCount = course.modules.length
            else if (typeof course.modules === 'string') {
              try { moduleCount = JSON.parse(course.modules).length } catch {}
            }

            return (
              <div key={enrollment.id || course.id} className={styles.courseCard}>
                <div className={styles.imageContainer}>
                  <img 
                    src={course.image_url || 'https://images.unsplash.com/photo-1598371839696-5e8bb81c2018?q=80&w=800&auto=format&fit=crop'} 
                    alt={course.title} 
                    className={styles.courseImage} 
                  />
                  <div className={styles.imageOverlay}>
                    <Link href={`/estudiante/cursos/${course.id}`} className={styles.playIconBtn}>
                      <Play size={24} fill="#fff" />
                    </Link>
                  </div>
                  <span className={styles.levelBadge}>{course.level || 'Todos los niveles'}</span>
                </div>

                <div className={styles.courseContent}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <Clock size={13} />
                      {course.duration || 'Online'}
                    </span>
                    <span className={styles.metaItem}>
                      <BookOpen size={13} />
                      {moduleCount > 0 ? `${moduleCount} Módulos` : 'Temario Completo'}
                    </span>
                  </div>

                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDescription}>
                    {course.description || 'Aprende las mejores técnicas con demostraciones prácticas y material exclusivo.'}
                  </p>
                  
                  <div className={styles.courseFooter}>
                    <div className={styles.expiryInfo}>
                      <span className={styles.expiryLabel}>Acceso:</span>
                      <span className={styles.expiryValue}>
                        {enrollment.expires_at ? `Hasta ${new Date(enrollment.expires_at).toLocaleDateString()}` : 'Vitalicio'}
                      </span>
                    </div>

                    <Link href={`/estudiante/cursos/${course.id}`} className={styles.btnAccess}>
                      <span>Entrar al Aula</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
