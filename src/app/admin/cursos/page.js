'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Ban, CheckCircle } from 'lucide-react'
import styles from './cursos.module.css'

export default function CursosPage() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [activeTab, setActiveTab] = useState('cursos')
  const [loading, setLoading] = useState(true)
  
  // Modal state for Courses
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    discount: 0,
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
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

    setLoading(false)
  }

  // --- COURSES CRUD ---
  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingId(course.id)
      setFormData({
        title: course.title,
        price: course.price,
        discount: course.discount,
        is_active: course.is_active
      })
    } else {
      setEditingId(null)
      setFormData({ title: '', price: '', discount: 0, is_active: true })
    }
    setModalOpen(true)
  }

  const handleSubmitCourse = async (e) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      discount: parseFloat(formData.discount)
    }

    if (editingId) {
      await supabase.from('courses').update(payload).eq('id', editingId)
    } else {
      await supabase.from('courses').insert([payload])
    }

    setModalOpen(false)
    fetchData()
  }

  const handleDeleteCourse = async (id) => {
    if (confirm('¿Eliminar este curso? Se eliminarán los alumnos asociados.')) {
      await supabase.from('courses').delete().eq('id', id)
      fetchData()
    }
  }

  // --- STUDENTS ACTIONS ---
  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'activo' ? 'vetado' : 'activo'
    await supabase.from('students').update({ status: newStatus }).eq('id', studentId)
    fetchData()
  }

  const handleDeleteStudent = async (id) => {
    if (confirm('¿Eliminar este alumno del sistema?')) {
      await supabase.from('students').delete().eq('id', id)
      fetchData()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestor de Cursos</h1>
          <p className={styles.subtitle}>Administra tus cursos y el acceso de tus alumnos</p>
        </div>
        {activeTab === 'cursos' && (
          <button onClick={() => handleOpenModal()} className={styles.btnAdd}>
            <Plus size={18} /> Nuevo Curso
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'cursos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('cursos')}
        >
          Cursos Ofertados
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'alumnos' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('alumnos')}
        >
          Alumnos Inscritos
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Cargando datos...</p>
      ) : activeTab === 'cursos' ? (
        // COURSES TAB
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título del Curso</th>
                <th>Precio</th>
                <th>Descuento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan="5" className={styles.emptyState}>No hay cursos registrados</td></tr>
              ) : (
                courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>${course.price}</td>
                    <td>{course.discount}%</td>
                    <td>
                      <span className={`${styles.statusTag} ${course.is_active ? styles.status_activo : styles.status_inactivo}`}>
                        {course.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => handleOpenModal(course)} className={styles.btnEdit}><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteCourse(course.id)} className={styles.btnDelete}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // STUDENTS TAB
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Email</th>
                <th>Curso</th>
                <th>Fecha Inscripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="6" className={styles.emptyState}>No hay alumnos registrados</td></tr>
              ) : (
                students.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.courses?.title || 'Curso Eliminado'}</td>
                    <td>{new Date(student.enrolled_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.statusTag} ${student.status === 'activo' ? styles.status_activo : styles.status_vetado}`}>
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => handleToggleStudentStatus(student.id, student.status)} 
                          className={student.status === 'activo' ? styles.btnDelete : styles.btnEdit}
                          title={student.status === 'activo' ? 'Vetar Alumno' : 'Activar Alumno'}
                        >
                          {student.status === 'activo' ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => handleDeleteStudent(student.id)} className={styles.btnDelete} title="Eliminar Registro">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COURSE MODAL */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeModal} onClick={() => setModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>{editingId ? 'Editar Curso' : 'Nuevo Curso'}</h2>
            
            <form onSubmit={handleSubmitCourse}>
              <div className={styles.formGroup}>
                <label>Título del Curso</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={styles.input} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Precio Base</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={styles.input} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Descuento %</label>
                  <input type="number" min="0" max="100" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className={styles.input} />
                </div>
              </div>
              
              <div className={styles.formGroupCheckbox}>
                <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                <label htmlFor="isActive">Curso Activo (Visible para compra)</label>
              </div>

              <button type="submit" className={styles.submitBtn}>
                {editingId ? 'Guardar Cambios' : 'Crear Curso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
