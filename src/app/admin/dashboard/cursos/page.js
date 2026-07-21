'use client'
import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Ban, CheckCircle, Clock } from 'lucide-react'
import BubbleButton from '@/components/ui/BubbleButton'
import { MOCK_CURSOS, MOCK_ALUMNOS } from '@/lib/mockData'
import mainStyles from '../main.module.css'
import localStyles from '../reservas/reservas.module.css' // Reusing modal styles

export default function CursosAdmin() {
  const [courses, setCourses] = useState(MOCK_CURSOS)
  const [alumnos, setAlumnos] = useState(MOCK_ALUMNOS)
  const [activeTab, setActiveTab] = useState('cursos') // 'cursos' | 'alumnos'

  // Modal para Cursos
  const [modalCurso, setModalCurso] = useState(false)
  const [editCurso, setEditCurso] = useState(null)
  const [formCurso, setFormCurso] = useState({ title: '', price: '', discount: 0, isActive: true })

  const handleBanAlumno = (id) => {
    if(confirm('¿Estás seguro de que deseas vetar a este alumno? Perderá el acceso.')) {
      setAlumnos(prev => prev.map(a => a.id === id ? { ...a, status: 'vetado' } : a))
    }
  }

  const handleReactivateAlumno = (id) => {
    setAlumnos(prev => prev.map(a => a.id === id ? { ...a, status: 'activo' } : a))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className={mainStyles.title}>Gestor de Cursos</h1>
          <p className={mainStyles.subtitle}>Administra tus cursos y el acceso de tus alumnos</p>
        </div>
        {activeTab === 'cursos' && (
          <BubbleButton size="small" onClick={() => { setEditCurso(null); setFormCurso({ title: '', price: '', discount: 0, isActive: true }); setModalCurso(true) }}>
            <Plus size={16} /> Nuevo Curso
          </BubbleButton>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('cursos')}
          style={{
            padding: '7px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'cursos' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'cursos' ? '#C41E1E' : 'transparent',
            color: activeTab === 'cursos' ? '#fff' : '#888',
          }}
        >
          Cursos Ofertados
        </button>
        <button
          onClick={() => setActiveTab('alumnos')}
          style={{
            padding: '7px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'alumnos' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'alumnos' ? '#C41E1E' : 'transparent',
            color: activeTab === 'alumnos' ? '#fff' : '#888',
          }}
        >
          Alumnos y Suscripciones
        </button>
      </div>

      {/* Tab: Cursos */}
      {activeTab === 'cursos' && (
        <div className={mainStyles.section} style={{ padding: 0, overflow: 'hidden' }}>
          <div className={mainStyles.table}>
            <div className={mainStyles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
              <span>Curso</span>
              <span>Precio Base</span>
              <span>Descuento</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {courses.map((c) => (
              <div key={c.id} className={mainStyles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                <div className={mainStyles.clientCell}>
                  <span className={mainStyles.clientName}>{c.title}</span>
                  <span className={mainStyles.clientEmail}>{c.studentsCount} alumnos inscritos</span>
                </div>
                <span>{c.price}</span>
                <span style={{ color: c.discount > 0 ? '#22c55e' : '#888' }}>{c.discount}%</span>
                <span className={`${mainStyles.status} ${c.isActive ? mainStyles.status_activo : mainStyles.status_expirado}`}>
                  {c.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => { setEditCurso(c); setFormCurso({ title: c.title, price: c.price, discount: c.discount, isActive: c.isActive }); setModalCurso(true) }} 
                    className={`${localStyles.actionBtn} ${localStyles.btnView}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setCourses(courses.filter(x => x.id !== c.id))} 
                    className={`${localStyles.actionBtn} ${localStyles.btnCancel}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Alumnos */}
      {activeTab === 'alumnos' && (
        <div className={mainStyles.section} style={{ padding: 0, overflow: 'hidden' }}>
          <div className={mainStyles.table}>
            <div className={mainStyles.tableHeader} style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr' }}>
              <span>Alumno</span>
              <span>Curso</span>
              <span>Inscripción</span>
              <span>Expiración</span>
              <span>Acceso</span>
            </div>
            {alumnos.map((a) => {
              const cursoAsociado = courses.find(c => c.id === a.courseId)?.title || 'Curso Eliminado'
              return (
                <div key={a.id} className={mainStyles.tableRow} style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr' }}>
                  <div className={mainStyles.clientCell}>
                    <span className={mainStyles.clientName}>{a.name}</span>
                    <span className={mainStyles.clientEmail}>{a.email}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>{cursoAsociado}</span>
                  <span>{a.enrolledAt}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#888" /> {a.expiresAt}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`${mainStyles.status} ${mainStyles[`status_${a.status}`]}`}>
                      {a.status}
                    </span>
                    {a.status === 'activo' ? (
                      <button 
                        title="Vetar Alumno"
                        onClick={() => handleBanAlumno(a.id)}
                        className={`${localStyles.actionBtn} ${localStyles.btnCancel}`}
                      >
                        <Ban size={14} />
                      </button>
                    ) : (
                      <button 
                        title="Reactivar Alumno"
                        onClick={() => handleReactivateAlumno(a.id)}
                        className={`${localStyles.actionBtn} ${localStyles.btnConfirm}`}
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Edición de Cursos */}
      {modalCurso && (
        <div className={localStyles.modalOverlay} onClick={() => setModalCurso(false)}>
          <div className={localStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={localStyles.modalHeader}>
              <h3 className={localStyles.modalTitle}>{editCurso ? 'Editar Curso' : 'Nuevo Curso'}</h3>
              <button className={localStyles.closeBtn} onClick={() => setModalCurso(false)}><X size={20} /></button>
            </div>
            <div className={localStyles.modalBody}>
              <div className={localStyles.detailRow}>
                <span>Título del Curso</span>
                <input className={localStyles.input} value={formCurso.title} onChange={e => setFormCurso({...formCurso, title: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className={localStyles.detailRow}>
                  <span>Precio Base (ej. $100.000)</span>
                  <input className={localStyles.input} value={formCurso.price} onChange={e => setFormCurso({...formCurso, price: e.target.value})} />
                </div>
                <div className={localStyles.detailRow}>
                  <span>Descuento %</span>
                  <input className={localStyles.input} type="number" min="0" max="100" value={formCurso.discount} onChange={e => setFormCurso({...formCurso, discount: e.target.value})} />
                </div>
              </div>
              <div className={localStyles.detailRow} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={formCurso.isActive} onChange={e => setFormCurso({...formCurso, isActive: e.target.checked})} />
                <span>Curso Activo y Visible en la Web</span>
              </div>
            </div>
            <div className={localStyles.modalFooter}>
              <button className={`${localStyles.btn} ${localStyles.btnGhost}`} onClick={() => setModalCurso(false)}>Cancelar</button>
              <button className={`${localStyles.btn} ${localStyles.btnPrimary}`} onClick={() => {
                if (editCurso) {
                  setCourses(courses.map(c => c.id === editCurso.id ? { ...c, ...formCurso } : c))
                } else {
                  setCourses([...courses, { id: Date.now().toString(), studentsCount: 0, ...formCurso }])
                }
                setModalCurso(false)
              }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
