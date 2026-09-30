'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Edit2, Trash2, X, Ban, CheckCircle, Image as ImageIcon, 
  BookOpen, Users, Video, Clock, Award, FileText, Check, 
  AlertTriangle, Search, Sparkles, RefreshCw
} from 'lucide-react'
import styles from './cursos.module.css'

export default function AdminCursosPage() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [activeTab, setActiveTab] = useState('cursos') // 'cursos' | 'alumnos'
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all')

  // Toast
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }
  
  // Modal state for Courses
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeModalTab, setActiveModalTab] = useState('info') // 'info' | 'syllabus'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    price: '',
    discount: 0,
    duration: '12 Horas de Video',
    level: 'Principiante a Avanzado',
    is_active: true,
    modules: []
  })

  // Modal state for Student Expiration
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [expiresAt, setExpiresAt] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (coursesData) setCourses(coursesData)

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*, courses(title)')
        .order('enrolled_at', { ascending: false })

      if (studentsData) setStudents(studentsData)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- COURSES CRUD ---
  const handleOpenModal = (course = null) => {
    setActiveModalTab('info')
    if (course) {
      setEditingId(course.id)
      
      let parsedModules = []
      if (Array.isArray(course.modules)) parsedModules = course.modules
      else if (typeof course.modules === 'string') {
        try { parsedModules = JSON.parse(course.modules) } catch { parsedModules = [] }
      }

      setFormData({
        title: course.title || '',
        description: course.description || '',
        image_url: course.image_url || '',
        price: course.price || '',
        discount: course.discount || 0,
        duration: course.duration || '12 Horas de Video',
        level: course.level || 'Principiante a Avanzado',
        is_active: course.is_active !== undefined ? course.is_active : true,
        modules: parsedModules.length > 0 ? parsedModules : [
          { title: 'Módulo 1: Fundamentos y Bioseguridad', lessons: [{ title: 'Introducción al equipo', video_url: '', duration: '15 min' }] }
        ]
      })
    } else {
      setEditingId(null)
      setFormData({ 
        title: '', 
        description: '', 
        image_url: '', 
        price: '45000', 
        discount: 0, 
        duration: '10 Horas de Video',
        level: 'Todos los niveles',
        is_active: true,
        modules: [
          { title: 'Módulo 1: Introducción y Materiales', lessons: [{ title: '1.1 Preparación de la mesa de trabajo', video_url: '', duration: '12 min' }] }
        ]
      })
    }
    setModalOpen(true)
  }

  // Modules & Lessons Builder
  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, { title: `Módulo ${prev.modules.length + 1}: Nuevo Módulo`, lessons: [] }]
    }))
  }

  const removeModule = (modIdx) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== modIdx)
    }))
  }

  const updateModuleTitle = (modIdx, title) => {
    setFormData(prev => {
      const updated = [...prev.modules]
      updated[modIdx].title = title
      return { ...prev, modules: updated }
    })
  }

  const addLesson = (modIdx) => {
    setFormData(prev => {
      const updated = [...prev.modules]
      updated[modIdx].lessons = [
        ...(updated[modIdx].lessons || []),
        { title: 'Nueva Lección', video_url: '', duration: '10 min' }
      ]
      return { ...prev, modules: updated }
    })
  }

  const updateLesson = (modIdx, lessonIdx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.modules]
      updated[modIdx].lessons[lessonIdx][field] = val
      return { ...prev, modules: updated }
    })
  }

  const removeLesson = (modIdx, lessonIdx) => {
    setFormData(prev => {
      const updated = [...prev.modules]
      updated[modIdx].lessons = updated[modIdx].lessons.filter((_, idx) => idx !== lessonIdx)
      return { ...prev, modules: updated }
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `course_${Date.now()}.${fileExt}`
    const filePath = `courses/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('admin_uploads')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      showToast('Error subiendo imagen: ' + uploadError.message, 'error')
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)
      
      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      showToast('Portada de curso subida con éxito')
    }
    setUploading(false)
  }

  const handleSubmitCourse = async (e) => {
    e.preventDefault()
    
    const payload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      image_url: formData.image_url || null,
      price: parseFloat(formData.price) || 0,
      discount: parseFloat(formData.discount) || 0,
      duration: formData.duration || 'A tu propio ritmo',
      level: formData.level || 'Todos los niveles',
      is_active: formData.is_active,
      modules: formData.modules || []
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editingId)
        if (error) throw error
        showToast('Curso actualizado con éxito')
      } else {
        const { error } = await supabase.from('courses').insert([payload])
        if (error) throw error
        showToast('Curso publicado con éxito')
      }

      setModalOpen(false)
      fetchData()
    } catch (err) {
      showToast('Error guardando curso: ' + err.message, 'error')
    }
  }

  const handleDeleteCourse = async (id) => {
    if (confirm('¿Eliminar este curso? Se cancelarán los accesos asociados.')) {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (!error) {
        showToast('Curso eliminado')
        fetchData()
      } else {
        showToast('Error al eliminar curso', 'error')
      }
    }
  }

  // --- STUDENTS ACTIONS ---
  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'activo' ? 'vetado' : 'activo'
    const { error } = await supabase.from('students').update({ status: newStatus }).eq('id', studentId)
    if (!error) {
      showToast(`Alumno ${newStatus === 'activo' ? 'reactivado' : 'vetado'}`)
      fetchData()
    }
  }

  const handleDeleteStudent = async (id) => {
    if (confirm('¿Eliminar definitivamente este alumno del sistema?')) {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (!error) {
        showToast('Registro de alumno eliminado')
        fetchData()
      }
    }
  }

  const handleOpenStudentModal = (student) => {
    setEditingStudentId(student.id)
    setExpiresAt(student.expires_at ? student.expires_at.split('T')[0] : '')
    setStudentModalOpen(true)
  }

  const handleSaveStudentExpiration = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('students')
      .update({ expires_at: expiresAt ? new Date(expiresAt).toISOString() : null })
      .eq('id', editingStudentId)
    
    if (!error) {
      showToast('Fecha de caducidad guardada')
      setStudentModalOpen(false)
      fetchData()
    }
  }

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) || 
                        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
    const matchCourse = selectedCourseFilter === 'all' || s.course_id === selectedCourseFilter
    return matchSearch && matchCourse
  })

  // Format CLP
  const formatCLP = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.academyBrand}>ACADEMIA & CURSOS</span>
            <span className={styles.versionBadge}>PORTAL EDUCATIVO PRO</span>
          </div>
          <h1 className={styles.title}>Gestor de Cursos y Alumnos</h1>
          <p className={styles.subtitle}>
            Crea módulos interactivos, sube material audiovisual y gestiona los accesos y certificaciones de tus estudiantes.
          </p>
        </div>

        {activeTab === 'cursos' && (
          <button onClick={() => handleOpenModal()} className={styles.btnAdd}>
            <Plus size={18} />
            <span>Nuevo Curso</span>
          </button>
        )}
      </div>

      {/* Metrics Bar */}
      <div className={styles.metricsBar}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Cursos Ofertados</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{courses.length}</span>
            <BookOpen size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Alumnos Inscritos</span>
          <div className={styles.metricValueWrap}>
            <span className={`${styles.metricValue} ${styles.textSuccess}`}>{students.length}</span>
            <Users size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Alumnos Activos</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>
              {students.filter(s => s.status === 'activo').length}
            </span>
            <CheckCircle size={18} className={styles.metricIcon} />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'cursos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('cursos')}
        >
          <BookOpen size={16} />
          <span>Cursos Ofertados ({courses.length})</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'alumnos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('alumnos')}
        >
          <Users size={16} />
          <span>Alumnos & Accesos ({students.length})</span>
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <RefreshCw size={26} className={styles.spin} />
          <p>Cargando información académica...</p>
        </div>
      ) : activeTab === 'cursos' ? (
        /* COURSES TAB */
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Portada</th>
                <th>Título del Curso</th>
                <th>Duración / Nivel</th>
                <th>Precio</th>
                <th>Módulos</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyStateTd}>
                    <BookOpen size={36} />
                    <p>Aún no has creado ningún curso.</p>
                  </td>
                </tr>
              ) : (
                courses.map(course => {
                  const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0
                  return (
                    <tr key={course.id}>
                      <td>
                        <div className={styles.thumbWrapper}>
                          {course.image_url ? (
                            <img src={course.image_url} alt={course.title} className={styles.courseThumb} />
                          ) : (
                            <div className={styles.thumbPlaceholder}><ImageIcon size={18} /></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.courseTitleCol}>
                          <span className={styles.courseTitle}>{course.title}</span>
                          <span className={styles.courseSub}>{course.description?.substring(0, 60)}...</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.metaBadge}>{course.duration || 'Online'}</span>
                      </td>
                      <td>
                        <div className={styles.priceColumn}>
                          <span className={styles.priceMain}>{formatCLP(course.price)}</span>
                          {course.discount > 0 && <span className={styles.discountTag}>-{course.discount}%</span>}
                        </div>
                      </td>
                      <td>
                        <span className={styles.moduleBadge}>{moduleCount} Módulos</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${course.is_active ? styles.statusActive : styles.statusInactive}`}>
                          {course.is_active ? 'Activo' : 'Pausado'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtonsRow}>
                          <button onClick={() => handleOpenModal(course)} className={styles.btnActionIcon} title="Editar Temario & Curso">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)} className={`${styles.btnActionIcon} ${styles.btnDeleteIcon}`} title="Eliminar Curso">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* STUDENTS TAB */
        <div>
          <div className={styles.studentToolbar}>
            <div className={styles.searchBar}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Buscar alumno por nombre o email..." 
                value={studentSearch} 
                onChange={(e) => setStudentSearch(e.target.value)} 
                className={styles.searchInput}
              />
            </div>

            <select 
              value={selectedCourseFilter} 
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">Filtrar por Todos los Cursos</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Email</th>
                  <th>Curso Asignado</th>
                  <th>Expiración de Acceso</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.emptyStateTd}>
                      <Users size={36} />
                      <p>No se encontraron alumnos registrados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{student.name}</strong>
                      </td>
                      <td style={{ color: '#8e8e9f' }}>{student.email}</td>
                      <td>
                        <span className={styles.courseTag}>{student.courses?.title || 'Curso General'}</span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleOpenStudentModal(student)} 
                          className={styles.expirationBtn}
                          title="Haz clic para modificar la fecha de caducidad"
                        >
                          <Clock size={13} />
                          <span>{student.expires_at ? new Date(student.expires_at).toLocaleDateString() : 'Acceso Vitalicio'}</span>
                        </button>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${student.status === 'activo' ? styles.statusActive : styles.statusVetado}`}>
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtonsRow}>
                          <button 
                            onClick={() => handleToggleStudentStatus(student.id, student.status)} 
                            className={`${styles.btnActionIcon} ${student.status === 'activo' ? styles.btnDeleteIcon : ''}`}
                            title={student.status === 'activo' ? 'Suspender Acceso (Vetar)' : 'Reactivar Alumno'}
                          >
                            {student.status === 'activo' ? <Ban size={15} /> : <CheckCircle size={15} />}
                          </button>
                          <button onClick={() => handleDeleteStudent(student.id)} className={`${styles.btnActionIcon} ${styles.btnDeleteIcon}`} title="Eliminar Registro">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COURSE EDITOR MODAL WITH SYLLABUS BUILDER */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalSub}>Editor de Cursos & Clases</span>
                <h2 className={styles.modalTitle}>{editingId ? 'Editar Curso' : 'Crear Nuevo Curso'}</h2>
              </div>
              <button className={styles.closeModal} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button 
                className={`${styles.modalTab} ${activeModalTab === 'info' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveModalTab('info')}
              >
                1. Información & Portada
              </button>
              <button 
                className={`${styles.modalTab} ${activeModalTab === 'syllabus' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveModalTab('syllabus')}
              >
                2. Temario & Clases en Video ({formData.modules?.length || 0})
              </button>
            </div>

            <form onSubmit={handleSubmitCourse} className={styles.modalForm}>
              {activeModalTab === 'info' ? (
                <div className={styles.tabContent}>
                  <div className={styles.formGroup}>
                    <label>Título del Curso *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Máster en Realismo Sombras y Texturas"
                      value={formData.title} 
                      onChange={e => setFormData({ ...formData, title: e.target.value })} 
                      className={styles.input} 
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descripción Completa</label>
                    <textarea 
                      rows="4" 
                      placeholder="Explica qué aprenderá el alumno, técnicas empleadas, requisitos..."
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      className={styles.textarea} 
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Precio (CLP) *</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="50000"
                        value={formData.price} 
                        onChange={e => setFormData({ ...formData, price: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Descuento % (Opcional)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={formData.discount} 
                        onChange={e => setFormData({ ...formData, discount: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Duración Estimada</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 14 Horas de Video"
                        value={formData.duration} 
                        onChange={e => setFormData({ ...formData, duration: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Portada del Curso</label>
                    <div className={styles.imageUploadRow}>
                      {formData.image_url && (
                        <img src={formData.image_url} alt="Preview" className={styles.imagePreview} />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={uploading} 
                      />
                      {uploading && <span style={{ color: '#ff2a3d', fontSize: '0.85rem' }}>Subiendo portada...</span>}
                    </div>
                  </div>

                  <div className={styles.checkboxItem}>
                    <input 
                      type="checkbox" 
                      id="course-active"
                      checked={formData.is_active} 
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                    />
                    <label htmlFor="course-active">Curso disponible para compra y acceso</label>
                  </div>
                </div>
              ) : (
                /* SYLLABUS BUILDER */
                <div className={styles.tabContent}>
                  <div className={styles.syllabusHeader}>
                    <div>
                      <h4>Estructura de Módulos y Clases</h4>
                      <p>Agrega los capítulos y enlaces de video (YouTube, Vimeo, MP4 privado).</p>
                    </div>
                    <button type="button" onClick={addModule} className={styles.btnSecondary}>
                      <Plus size={14} /> Añadir Módulo
                    </button>
                  </div>

                  <div className={styles.modulesList}>
                    {formData.modules.map((mod, modIdx) => (
                      <div key={modIdx} className={styles.moduleBox}>
                        <div className={styles.moduleBoxHeader}>
                          <input 
                            type="text" 
                            value={mod.title} 
                            onChange={(e) => updateModuleTitle(modIdx, e.target.value)} 
                            className={styles.moduleTitleInput}
                            placeholder="Nombre del Módulo..."
                          />
                          <div className={styles.moduleBoxActions}>
                            <button type="button" onClick={() => addLesson(modIdx)} className={styles.btnAddLesson}>
                              <Plus size={12} /> Lección
                            </button>
                            <button type="button" onClick={() => removeModule(modIdx)} className={styles.btnRemoveModule}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className={styles.lessonsList}>
                          {(mod.lessons || []).map((lesson, lessonIdx) => (
                            <div key={lessonIdx} className={styles.lessonRow}>
                              <Video size={16} className={styles.lessonIcon} />
                              <input 
                                type="text" 
                                placeholder="Título de la clase (ej: 1.1 Calibración)"
                                value={lesson.title} 
                                onChange={(e) => updateLesson(modIdx, lessonIdx, 'title', e.target.value)} 
                                className={styles.input}
                                style={{ flex: 2 }}
                              />
                              <input 
                                type="text" 
                                placeholder="URL del Video (YouTube / Vimeo / MP4)"
                                value={lesson.video_url} 
                                onChange={(e) => updateLesson(modIdx, lessonIdx, 'video_url', e.target.value)} 
                                className={styles.input}
                                style={{ flex: 3 }}
                              />
                              <input 
                                type="text" 
                                placeholder="Duración (15m)"
                                value={lesson.duration} 
                                onChange={(e) => updateLesson(modIdx, lessonIdx, 'duration', e.target.value)} 
                                className={styles.input}
                                style={{ width: '80px' }}
                              />
                              <button type="button" onClick={() => removeLesson(modIdx, lessonIdx)} className={styles.btnActionIcon}>
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnAdd} disabled={uploading}>
                  {editingId ? 'Guardar Curso' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT EXPIRATION MODAL */}
      {studentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setStudentModalOpen(false)}>
          <div className={styles.smallModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Configurar Caducidad de Acceso</h3>
              <button className={styles.closeModal} onClick={() => setStudentModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudentExpiration} style={{ padding: '20px' }}>
              <div className={styles.formGroup}>
                <label style={{ fontSize: '0.85rem', color: '#8e8e9f', marginBottom: '8px' }}>
                  El estudiante perderá el acceso a las clases en la fecha elegida. Si lo dejas vacío, tendrá <strong>Acceso Vitalicio</strong>.
                </label>
                <input 
                  type="date" 
                  value={expiresAt} 
                  onChange={e => setExpiresAt(e.target.value)} 
                  className={styles.input} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setStudentModalOpen(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnAdd}>
                  Guardar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
