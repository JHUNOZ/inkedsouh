'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, Play, CheckCircle2, Circle, Clock, 
  FileText, Download, Award, ChevronRight, Share2, 
  BookOpen, Sparkles, Check, ExternalLink
} from 'lucide-react'
import styles from './classroom.module.css'

export default function CourseClassroomPage({ params }) {
  // Unwrap params using React.use() if it's a promise, or safely access
  const unwrappedParams = typeof params?.then === 'function' ? use(params) : params
  const courseId = unwrappedParams?.id

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeModuleIdx, setActiveModuleIdx] = useState(0)
  const [activeLessonIdx, setActiveLessonIdx] = useState(0)
  const [completedLessons, setCompletedLessons] = useState({})
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'resources' | 'certificate'
  const [studentName, setStudentName] = useState('Estudiante InkedSouh')
  const [showCertModal, setShowCertModal] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadClassroom() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setStudentName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Estudiante')
        }

        // Load course details
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        if (data) {
          // Parse modules if needed
          let mods = data.modules
          if (typeof mods === 'string') {
            try { mods = JSON.parse(mods) } catch { mods = [] }
          }
          if (!mods || mods.length === 0) {
            // Provide engaging default modules if course has none yet
            mods = [
              {
                title: 'Módulo 1: Fundamentos y Bioseguridad',
                lessons: [
                  { 
                    title: '1.1 Asepsia, barreras y preparación de mesa quirúrgica', 
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                    duration: '18 min',
                    notes: 'En esta clase abordamos los protocolos de esterilización, film osmótico y manejo de desechos biológicos.'
                  },
                  { 
                    title: '1.2 Calibración de máquinas rotativas y pen', 
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                    duration: '22 min',
                    notes: 'Aprende a ajustar el stroke, voltaje y profundidad de aguja para evitar daño dérmico.'
                  }
                ]
              },
              {
                title: 'Módulo 2: Técnicas de Trazado y Saturación',
                lessons: [
                  { 
                    title: '2.1 Dominio de líneas sólidas y fineline sin blowout', 
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                    duration: '30 min',
                    notes: 'Velocidad de mano vs. voltaje de la fuente de poder. Técnica del anclaje de muñeca.'
                  },
                  { 
                    title: '2.2 Degradados Whip Shading y Greywash en piel sintética', 
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                    duration: '45 min',
                    notes: 'Dilución de pigmentos negros en 4 pasos (100%, 50%, 25%, 10%) para lograr transiciones suaves.'
                  }
                ]
              },
              {
                title: 'Módulo 3: Proyecto Final & Cicatrización',
                lessons: [
                  { 
                    title: '3.1 Demostración en piel real paso a paso', 
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                    duration: '50 min',
                    notes: 'Sesión completa comentada en tiempo real. Manejo de sangrado y estiramiento de piel.'
                  },
                  { 
                    title: '3.2 Protocolo de Aftercare y Curación con Segunda Piel', 
                    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
                    duration: '15 min',
                    notes: 'Cómo instruir al cliente para garantizar que el arte cicatrice con el 100% del brillo original.'
                  }
                ]
              }
            ]
          }
          setCourse({ ...data, modules: mods })
        }

        // Load saved progress from localStorage
        const saved = localStorage.getItem(`progress_${courseId}`)
        if (saved) {
          try { setCompletedLessons(JSON.parse(saved)) } catch {}
        }
      } catch (err) {
        console.error('Error loading classroom:', err)
      } finally {
        setLoading(false)
      }
    }
    loadClassroom()
  }, [courseId])

  // Current active lesson
  const currentModule = course?.modules?.[activeModuleIdx]
  const currentLesson = currentModule?.lessons?.[activeLessonIdx] || course?.modules?.[0]?.lessons?.[0]

  // Calculate total lessons and completed count
  const allLessons = (course?.modules || []).flatMap((m, mIdx) => 
    (m.lessons || []).map((l, lIdx) => ({ ...l, key: `${mIdx}-${lIdx}` }))
  )
  const totalLessonsCount = allLessons.length
  const completedCount = Object.values(completedLessons).filter(Boolean).length
  const progressPercent = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0

  const toggleLessonComplete = (key) => {
    const updated = { ...completedLessons, [key]: !completedLessons[key] }
    setCompletedLessons(updated)
    localStorage.setItem(`progress_${courseId}`, JSON.stringify(updated))
  }

  const currentLessonKey = `${activeModuleIdx}-${activeLessonIdx}`
  const isCurrentCompleted = !!completedLessons[currentLessonKey]

  const goToNextLesson = () => {
    if (!course) return
    const currentModLessons = course.modules[activeModuleIdx]?.lessons || []
    if (activeLessonIdx + 1 < currentModLessons.length) {
      setActiveLessonIdx(activeLessonIdx + 1)
    } else if (activeModuleIdx + 1 < course.modules.length) {
      setActiveModuleIdx(activeModuleIdx + 1)
      setActiveLessonIdx(0)
    }
  }

  const goToPrevLesson = () => {
    if (!course) return
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(activeLessonIdx - 1)
    } else if (activeModuleIdx > 0) {
      const prevModLessons = course.modules[activeModuleIdx - 1]?.lessons || []
      setActiveModuleIdx(activeModuleIdx - 1)
      setActiveLessonIdx(Math.max(0, prevModLessons.length - 1))
    }
  }

  // Format video url to embeddable
  const getEmbedUrl = (url) => {
    if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/')
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'www.youtube.com/embed/')
    }
    return url
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Preparando tu aula de aprendizaje...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className={styles.errorContainer}>
        <h2>Curso no encontrado</h2>
        <Link href="/estudiante" className={styles.btnBack}>
          <ArrowLeft size={16} /> Volver a Mis Cursos
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.classroomPage}>
      {/* Top Navbar */}
      <header className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <Link href="/estudiante" className={styles.btnBackIcon} title="Volver al Portal">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className={styles.topCourseTag}>CURSO ONLINE</span>
            <h1 className={styles.topCourseTitle}>{course.title}</h1>
          </div>
        </div>

        <div className={styles.topNavRight}>
          <div className={styles.progressBarWrap}>
            <div className={styles.progressInfo}>
              <span>Progreso del Curso</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <button 
            onClick={() => setShowCertModal(true)} 
            className={`${styles.btnCert} ${progressPercent === 100 ? styles.btnCertReady : ''}`}
          >
            <Award size={16} />
            <span>{progressPercent === 100 ? 'Descargar Certificado' : 'Ver Certificado'}</span>
          </button>
        </div>
      </header>

      {/* Main Classroom Workspace */}
      <div className={styles.workspace}>
        {/* Left Video Area */}
        <div className={styles.videoSection}>
          <div className={styles.videoPlayerContainer}>
            <iframe 
              src={getEmbedUrl(currentLesson?.video_url)} 
              title={currentLesson?.title || 'Video Clase'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className={styles.videoIframe}
            />
          </div>

          {/* Lesson Details & Controls Bar */}
          <div className={styles.lessonControlBar}>
            <div>
              <div className={styles.currentModuleLabel}>
                {currentModule?.title || 'Módulo'}
              </div>
              <h2 className={styles.currentLessonTitle}>
                {currentLesson?.title || 'Selecciona una lección'}
              </h2>
            </div>

            <div className={styles.lessonActionButtons}>
              <button 
                onClick={() => toggleLessonComplete(currentLessonKey)} 
                className={`${styles.btnToggleComplete} ${isCurrentCompleted ? styles.btnCompleted : ''}`}
              >
                {isCurrentCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span>{isCurrentCompleted ? 'Completada' : 'Marcar como Completada'}</span>
              </button>

              <div className={styles.navArrows}>
                <button onClick={goToPrevLesson} className={styles.btnNavArrow} title="Lección Anterior">
                  <ArrowLeft size={16} />
                </button>
                <button onClick={goToNextLesson} className={styles.btnNavArrow} title="Siguiente Lección">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Under-Video Tabs */}
          <div className={styles.lessonTabsContainer}>
            <div className={styles.tabsHeader}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <FileText size={16} />
                <span>Apuntes & Resumen</span>
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'resources' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('resources')}
              >
                <Download size={16} />
                <span>Recursos Descargables (3)</span>
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'certificate' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('certificate')}
              >
                <Award size={16} />
                <span>Acreditación</span>
              </button>
            </div>

            <div className={styles.tabContentArea}>
              {activeTab === 'notes' && (
                <div className={styles.notesPanel}>
                  <h3>Recomendaciones del Tatuador</h3>
                  <p>
                    {currentLesson?.notes || 'Practica este ejercicio en piel sintética de grosor mínimo 3mm antes de aplicarlo en clientes reales. Asegúrate de estirar la piel con tres puntos de apoyo para líneas perfectas.'}
                  </p>
                  <div className={styles.tipBox}>
                    <Sparkles size={18} className={styles.tipIcon} />
                    <div>
                      <strong>Tip Profesional:</strong>
                      <p>Mantén un ángulo de inserción entre 60° y 75° para garantizar que la tinta permanezca en la dermis papilar sin dispersarse.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className={styles.resourcesList}>
                  <div className={styles.resourceCard}>
                    <FileText size={24} className={styles.resIcon} />
                    <div className={styles.resInfo}>
                      <strong>Guía de Agujas y Calibres (PDF)</strong>
                      <span>2.4 MB • Tabla de referencia rápida</span>
                    </div>
                    <a href="#" onClick={e => e.preventDefault()} className={styles.btnDownloadRes}>
                      <Download size={16} /> Descargar
                    </a>
                  </div>

                  <div className={styles.resourceCard}>
                    <FileText size={24} className={styles.resIcon} />
                    <div className={styles.resInfo}>
                      <strong>Plantilla de Consentimiento Informado (DOCX)</strong>
                      <span>1.1 MB • Listo para imprimir en tu estudio</span>
                    </div>
                    <a href="#" onClick={e => e.preventDefault()} className={styles.btnDownloadRes}>
                      <Download size={16} /> Descargar
                    </a>
                  </div>

                  <div className={styles.resourceCard}>
                    <FileText size={24} className={styles.resIcon} />
                    <div className={styles.resInfo}>
                      <strong>Pack de Stencils Blackwork & Lettering (ZIP)</strong>
                      <span>18.5 MB • 25 diseños listos para transfer</span>
                    </div>
                    <a href="#" onClick={e => e.preventDefault()} className={styles.btnDownloadRes}>
                      <Download size={16} /> Descargar
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'certificate' && (
                <div className={styles.certPanel}>
                  <Award size={48} className={styles.certBigIcon} />
                  <h3>Certificado de Finalización Oficial</h3>
                  <p>
                    Completa el 100% de las lecciones ({completedCount}/{totalLessonsCount} completadas) para desbloquear tu certificado firmado por INKEDSOUH Tattoo Studio.
                  </p>
                  <button 
                    onClick={() => setShowCertModal(true)} 
                    className={styles.btnOpenCert}
                  >
                    Abrir Vista de Certificado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Playlist */}
        <aside className={styles.playlistSection}>
          <div className={styles.playlistHeader}>
            <h3>Temario del Curso</h3>
            <span>{completedCount} de {totalLessonsCount} lecciones</span>
          </div>

          <div className={styles.modulesAccordion}>
            {(course.modules || []).map((module, modIdx) => (
              <div key={modIdx} className={styles.moduleItem}>
                <div className={styles.moduleItemTitle}>
                  <span>{module.title}</span>
                </div>

                <div className={styles.lessonListContainer}>
                  {(module.lessons || []).map((lesson, lessonIdx) => {
                    const key = `${modIdx}-${lessonIdx}`
                    const isCompleted = !!completedLessons[key]
                    const isActive = activeModuleIdx === modIdx && activeLessonIdx === lessonIdx

                    return (
                      <div 
                        key={lessonIdx} 
                        className={`${styles.lessonItem} ${isActive ? styles.lessonItemActive : ''}`}
                        onClick={() => {
                          setActiveModuleIdx(modIdx)
                          setActiveLessonIdx(lessonIdx)
                        }}
                      >
                        <button 
                          className={styles.lessonCheckBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLessonComplete(key)
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={16} className={styles.checkDone} />
                          ) : (
                            <Circle size={16} className={styles.checkPending} />
                          )}
                        </button>

                        <div className={styles.lessonTextInfo}>
                          <span className={styles.lessonName}>{lesson.title}</span>
                          <span className={styles.lessonDuration}>
                            <Clock size={11} /> {lesson.duration || '15m'}
                          </span>
                        </div>

                        {isActive && <Play size={14} fill="currentColor" className={styles.activePlayIcon} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Certificate Modal */}
      {showCertModal && (
        <div className={styles.certModalOverlay} onClick={() => setShowCertModal(false)}>
          <div className={styles.certModal} onClick={e => e.stopPropagation()}>
            <div className={styles.certFrame}>
              <div className={styles.certLogo}>INKEDSOUH ACADEMY</div>
              <div className={styles.certSubtitle}>CERTIFICADO DE ACREDITACIÓN PROFESIONAL</div>
              <div className={styles.certText}>Este certificado acredita que</div>
              <div className={styles.certStudentName}>{studentName}</div>
              <div className={styles.certBody}>
                Ha completado satisfactoriamente los módulos teóricos y prácticos de la formación en:
              </div>
              <div className={styles.certCourseName}>{course.title}</div>
              
              <div className={styles.certFooter}>
                <div className={styles.certSignature}>
                  <div className={styles.certLine}></div>
                  <span>INKEDSOUH Master Artist</span>
                  <small>Director Académico</small>
                </div>

                <div className={styles.certSeal}>
                  <ShieldCheck size={32} />
                  <span>VERIFICADO</span>
                </div>
              </div>
            </div>

            <div className={styles.certModalActions}>
              <button onClick={() => setShowCertModal(false)} className={styles.btnSecondary}>
                Cerrar
              </button>
              <button onClick={() => window.print()} className={styles.btnDownloadRes}>
                <Download size={16} /> Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
