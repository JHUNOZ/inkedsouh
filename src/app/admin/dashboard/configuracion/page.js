'use client'
// Panel de Configuración: Horarios, Fechas, Textos, Mantenimiento y Accesos
import { useState } from 'react'
import { Save, Shield, Type, Power, Plus, Trash2, Clock, CalendarX, CheckCircle } from 'lucide-react'
import BubbleButton from '@/components/ui/BubbleButton'
import { useConfig } from '@/context/ConfigContext'
import mainStyles from '../main.module.css'
import localStyles from '../reservas/reservas.module.css'

export default function ConfiguracionAdmin() {
  const { 
    maintenance, setMaintenance, 
    textos, setTextos,
    horarios, setHorarios,
    blockedDates, setBlockedDates 
  } = useConfig()

  const [activeTab, setActiveTab] = useState('textos')
  const [saved, setSaved] = useState(false)

  // Fechas Bloqueadas (Rango Local)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')

  // Accesos Locales (Mocked)
  const [accesos, setAccesos] = useState([
    { id: 1, name: 'INKEDSOUH', email: 'inked@ejemplo.com', role: 'Super Admin' },
    { id: 2, name: 'Asistente', email: 'asistente@ejemplo.com', role: 'Moderador' }
  ])

  const handleSave = () => { 
    setSaved(true)
    setTimeout(() => setSaved(false), 2000) 
  }

  const handleBlockDate = () => {
    if(!blockStart) return
    const newBlock = blockEnd ? `${blockStart} al ${blockEnd}` : blockStart
    if (!blockedDates.includes(newBlock)) {
      setBlockedDates([...blockedDates, newBlock])
    }
    setBlockStart('')
    setBlockEnd('')
  }

  const toggleDay = (index) => {
    const newH = [...horarios]
    newH[index].active = !newH[index].active
    setHorarios(newH)
  }

  const updateTime = (index, field, value) => {
    const newH = [...horarios]
    newH[index][field] = value
    setHorarios(newH)
  }

  const inp = { 
    width: '100%', padding: '12px', background: '#141414', border: '1px solid #2A2A2A', 
    borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border 0.3s ease'
  }

  return (
    <div style={{ maxWidth: '900px', animation: 'fadeIn 0.5s ease' }}>
      <h1 className={mainStyles.title}>Configuración</h1>
      <p className={mainStyles.subtitle}>Edita el contenido público, horarios, accesos y estado global en tiempo real</p>

      {/* Navegación Tabs fluida */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #2A2A2A', paddingBottom: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('textos')}
          style={{
            padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'textos' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'textos' ? '#C41E1E' : 'transparent',
            color: activeTab === 'textos' ? '#fff' : '#888',
            transition: 'all 0.3s ease'
          }}
        >
          <Type size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Secciones Públicas
        </button>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'general' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'general' ? '#C41E1E' : 'transparent',
            color: activeTab === 'general' ? '#fff' : '#888',
            transition: 'all 0.3s ease'
          }}
        >
          <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Horarios y Mantenimiento
        </button>
        <button
          onClick={() => setActiveTab('accesos')}
          style={{
            padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
            border: `1px solid ${activeTab === 'accesos' ? '#C41E1E' : '#2A2A2A'}`,
            background: activeTab === 'accesos' ? '#C41E1E' : 'transparent',
            color: activeTab === 'accesos' ? '#fff' : '#888',
            transition: 'all 0.3s ease'
          }}
        >
          <Shield size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Accesos Web
        </button>
      </div>

      <div className={mainStyles.section} style={{ background: 'transparent', padding: 0, border: 'none' }}>
        
        {/* TAB TEXTOS - RELACIÓN DIRECTA */}
        {activeTab === 'textos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'scaleIn 0.3s ease' }}>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>
              Los cambios que realices aquí se verán reflejados <strong style={{ color: '#fff' }}>inmediatamente</strong> en la web pública.
            </p>
            
            {/* SECCIÓN 1: HERO */}
            <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid #2A2A2A', paddingBottom: '10px', color: '#C41E1E' }}>
                Sección 1: Hero Principal (Inicio)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>TEXTO DESTACADO (Badge Rojo)</label>
                  <input style={inp} value={textos.heroBadge} onChange={(e) => setTextos({ ...textos, heroBadge: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>BIOGRAFÍA / PRESENTACIÓN</label>
                  <textarea style={{ ...inp, minHeight: '120px', resize: 'vertical' }} value={textos.heroBio} onChange={(e) => setTextos({ ...textos, heroBio: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>NOMBRE USUARIO INSTAGRAM</label>
                    <input style={inp} value={textos.heroIg} onChange={(e) => setTextos({ ...textos, heroIg: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>ENLACE DE INSTAGRAM</label>
                    <input style={inp} value={textos.heroIgLink} onChange={(e) => setTextos({ ...textos, heroIgLink: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: BOOKING CTA */}
            <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid #2A2A2A', paddingBottom: '10px', color: '#C41E1E' }}>
                Sección 2: Llamado a Reservar (Video CTA)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>TÍTULO DE LA SECCIÓN</label>
                  <input style={inp} value={textos.ctaTitle} onChange={(e) => setTextos({ ...textos, ctaTitle: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>TEXTO DE MOTIVACIÓN</label>
                  <textarea style={{ ...inp, minHeight: '90px', resize: 'vertical' }} value={textos.ctaText} onChange={(e) => setTextos({ ...textos, ctaText: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>TEXTO DEL BOTÓN</label>
                  <input style={inp} value={textos.ctaButton} onChange={(e) => setTextos({ ...textos, ctaButton: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ position: 'sticky', bottom: '20px', zIndex: 10 }}>
              <BubbleButton onClick={handleSave} style={{ background: saved ? '#22c55e' : '#C41E1E', transition: 'all 0.3s ease' }}>
                {saved ? <><CheckCircle size={18} /> Cambios Aplicados en Vivo</> : <><Save size={18} /> Aplicar Cambios en la Web</>}
              </BubbleButton>
            </div>
          </div>
        )}

        {/* TAB GENERAL Y HORARIOS */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'scaleIn 0.3s ease' }}>
            
            {/* Mantenimiento */}
            <div style={{ 
              background: maintenance ? 'rgba(239, 68, 68, 0.05)' : '#141414', 
              border: `1px solid ${maintenance ? '#ef4444' : '#2A2A2A'}`, 
              borderRadius: '12px', padding: '24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px', color: maintenance ? '#ef4444' : '#fff' }}>
                  Modo Mantenimiento de la Web
                </h3>
                <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: '400px' }}>
                  Oculta la página pública a los visitantes bajo una pantalla de "En mantenimiento".
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ 
                  width: '50px', height: '26px', background: maintenance ? '#ef4444' : '#333', 
                  borderRadius: '30px', position: 'relative', transition: 'all 0.3s ease' 
                }}>
                  <div style={{
                    width: '20px', height: '20px', background: '#fff', borderRadius: '50%',
                    position: 'absolute', top: '3px', left: maintenance ? '27px' : '3px',
                    transition: 'all 0.3s ease', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Horarios de Atención */}
            <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#C41E1E" /> Horarios de Atención
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {horarios.map((h, i) => (
                  <div key={h.day} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '120px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={h.active} onChange={() => toggleDay(i)} style={{ accentColor: '#C41E1E' }} />
                      <span style={{ color: h.active ? '#fff' : '#555' }}>{h.day}</span>
                    </label>
                    <input type="time" style={{ ...inp, width: '130px', opacity: h.active ? 1 : 0.4 }} value={h.start} onChange={e => updateTime(i, 'start', e.target.value)} disabled={!h.active} />
                    <span style={{ color: '#555' }}>—</span>
                    <input type="time" style={{ ...inp, width: '130px', opacity: h.active ? 1 : 0.4 }} value={h.end} onChange={e => updateTime(i, 'end', e.target.value)} disabled={!h.active} />
                  </div>
                ))}
              </div>
            </div>

            {/* Fechas Bloqueadas */}
            <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarX size={18} color="#ef4444" /> Fechas Bloqueadas
              </h3>
              <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '15px' }}>Bloquea un día específico o un rango de días para que los clientes no puedan agendar.</p>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>DESDE (Día a bloquear)</label>
                  <input type="date" style={{ ...inp, width: '200px' }} value={blockStart} onChange={e => setBlockStart(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: '6px' }}>HASTA (Opcional - para rangos)</label>
                  <input type="date" style={{ ...inp, width: '200px' }} value={blockEnd} onChange={e => setBlockEnd(e.target.value)} min={blockStart} />
                </div>
                <BubbleButton onClick={handleBlockDate} disabled={!blockStart}>Bloquear Fechas</BubbleButton>
              </div>

              {blockedDates.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {blockedDates.map((date, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A1A1A', padding: '10px 15px', borderRadius: '6px', border: '1px solid #2A2A2A' }}>
                      <span style={{ fontSize: '0.9rem' }}>{date}</span>
                      <button onClick={() => setBlockedDates(blockedDates.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '10px' }}>
              <BubbleButton onClick={handleSave}>
                {saved ? <><CheckCircle size={16} /> ¡Configuración Guardada!</> : <><Save size={16} /> Guardar Configuración</>}
              </BubbleButton>
            </div>
          </div>
        )}

        {/* TAB ACCESOS */}
        {activeTab === 'accesos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'scaleIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                Administra quién tiene acceso al Panel de Control.
              </p>
              <BubbleButton size="small" variant="outline"><Plus size={16} /> Añadir Acceso</BubbleButton>
            </div>

            <div className={mainStyles.table} style={{ marginTop: '10px' }}>
              <div className={mainStyles.tableHeader} style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                <span>Nombre</span>
                <span>Rol</span>
                <span>Acciones</span>
              </div>
              {accesos.map(acc => (
                <div key={acc.id} className={mainStyles.tableRow} style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                  <div className={mainStyles.clientCell}>
                    <span className={mainStyles.clientName}>{acc.name}</span>
                    <span className={mainStyles.clientEmail}>{acc.email}</span>
                  </div>
                  <span style={{ color: '#C41E1E', fontSize: '0.85rem', fontWeight: '500' }}>{acc.role}</span>
                  <div>
                    {acc.id !== 1 && (
                      <button 
                        className={`${localStyles.actionBtn} ${localStyles.btnCancel}`} 
                        onClick={() => setAccesos(accesos.filter(a => a.id !== acc.id))}
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
