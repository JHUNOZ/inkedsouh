'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, XCircle, Clock, X, Lock, Plus, Trash2, ExternalLink, ShieldCheck, FileText } from 'lucide-react'
import styles from './reservas.module.css'

export default function ReservasPage() {
  const [activeTab, setActiveTab] = useState('bookings') // 'bookings' | 'blocks'
  const [bookings, setBookings] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, bookingId: null, date: '', reason: '' })
  const [blockModal, setBlockModal] = useState({ open: false, date: '', startTime: '', endTime: '', reason: '' })
  const [consentModal, setConsentModal] = useState({ open: false, data: null })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const hydrateBookingRow = (row) => {
    if (!row || typeof row.tattoo_details !== 'string') return row
    const match = row.tattoo_details.match(/<!--BOOKING_META:([\s\S]*?):END_META-->/)
    if (!match) return row
    try {
      const meta = JSON.parse(match[1])
      const cleanDetails = row.tattoo_details.replace(/<!--BOOKING_META:[\s\S]*?:END_META-->/, '').trim()
      return {
        ...row,
        tattoo_details: cleanDetails,
        requested_time: row.requested_time || meta.requested_time || null,
        service_type: row.service_type || meta.service_type || null,
        reference_url: row.reference_url || meta.reference_url || null,
        consent_data: row.consent_data || meta.consent_data || null
      }
    } catch {
      return row
    }
  }

  const fetchData = async () => {
    setLoading(true)
    const { data: bData } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    let combined = (bData || []).map(hydrateBookingRow)

    // Also fetch booking records stored in orders table
    const { data: oData } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_method', 'cita_directa')
      .order('created_at', { ascending: false })

    if (oData && oData.length > 0) {
      const orderBookings = oData.map(o => {
        const meta = o.metadata || {}
        return {
          id: o.id,
          order_number: o.order_number,
          client_name: o.customer_name,
          client_email: o.customer_email,
          client_phone: o.customer_phone,
          requested_date: meta.appointment_date || o.created_at?.split('T')[0],
          requested_time: meta.appointment_time || 'Por coordinar',
          service_type: meta.service_type || 'Reserva Directa',
          tattoo_details: meta.notes || 'Reserva web',
          reference_url: meta.reference_url || null,
          consent_data: meta.consent_data || null,
          status: o.status === 'aprobado' ? 'accepted' : (o.status === 'rechazado' ? 'rejected' : 'pending'),
          is_from_orders: true
        }
      })

      // Merge avoiding duplicate emails on same date
      const existingKeys = new Set(combined.map(b => `${b.client_email}_${b.requested_date}`))
      for (const ob of orderBookings) {
        if (!existingKeys.has(`${ob.client_email}_${ob.requested_date}`)) {
          combined.push(ob)
        }
      }
    }

    setBookings(combined)

    const { data: mData } = await supabase
      .from('manual_blocks')
      .select('*')
      .order('block_date', { ascending: true })

    if (mData) setBlocks(mData)

    setLoading(false)
  }

  const updateBookingStatus = async (id, status, extraData = {}) => {
    const booking = bookings.find(b => b.id === id)
    let error = null

    if (booking?.is_from_orders) {
      const orderStatusMap = {
        accepted: 'aprobado',
        rejected: 'rechazado',
        rescheduled: 'reprogramado',
        pending: 'pendiente'
      }
      const orderRes = await supabase
        .from('orders')
        .update({
          status: orderStatusMap[status] || status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      error = orderRes.error
    } else {
      const bRes = await supabase
        .from('bookings')
        .update({ status, ...extraData })
        .eq('id', id)
      error = bRes.error

      if (error && extraData.reschedule_reason) {
        const fallbackUpdate = { status }
        if (extraData.requested_date) fallbackUpdate.requested_date = extraData.requested_date
        const retry = await supabase.from('bookings').update(fallbackUpdate).eq('id', id)
        error = retry.error
      }
    }

    if (!error) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: status,
          booking: { ...booking, ...extraData }
        })
      }).catch(() => {})

      fetchData()
    } else {
      alert('Error actualizando reserva: ' + (error?.message || 'Error desconocido'))
    }
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    await updateBookingStatus(rescheduleModal.bookingId, 'rescheduled', {
      reschedule_reason: rescheduleModal.reason,
      requested_date: rescheduleModal.date
    })
    setRescheduleModal({ open: false, bookingId: null, date: '', reason: '' })
  }

  const handleAddBlockSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/manual-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        block_date: blockModal.date,
        start_time: blockModal.startTime,
        end_time: blockModal.endTime,
        reason: blockModal.reason
      })
    })

    if (res.ok) {
      setBlockModal({ open: false, date: '', startTime: '', endTime: '', reason: '' })
      fetchData()
    } else {
      alert('Error al crear el bloqueo de agenda')
    }
  }

  const handleDeleteBlock = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este bloqueo?')) return
    const res = await fetch(`/api/manual-blocks?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchData()
    } else {
      alert('Error al eliminar bloqueo')
    }
  }

  if (loading) {
    return <div className={styles.loading}>Cargando reservas y agenda...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Citas y Agenda (InkedSouh)</h1>
          <p className={styles.subtitle}>Administra tus solicitudes de reservas y bloqueos de disponibilidad</p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={styles.submitBtn}
            style={{ 
              background: activeTab === 'bookings' ? '#E11D48' : '#F1F5F9', 
              color: activeTab === 'bookings' ? '#FFFFFF' : '#334155',
              borderColor: activeTab === 'bookings' ? '#E11D48' : '#E2E8F0',
              boxShadow: activeTab === 'bookings' ? '0 4px 14px rgba(225, 29, 72, 0.25)' : 'none',
              padding: '10px 20px' 
            }}
          >
            Reservas ({bookings.length})
          </button>
          <button 
            onClick={() => setActiveTab('blocks')}
            className={styles.submitBtn}
            style={{ 
              background: activeTab === 'blocks' ? '#E11D48' : '#F1F5F9', 
              color: activeTab === 'blocks' ? '#FFFFFF' : '#334155',
              borderColor: activeTab === 'blocks' ? '#E11D48' : '#E2E8F0',
              boxShadow: activeTab === 'blocks' ? '0 4px 14px rgba(225, 29, 72, 0.25)' : 'none',
              padding: '10px 20px' 
            }}
          >
            Bloqueos de Agenda ({blocks.length})
          </button>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha y Hora</th>
                <th>Servicio / Notas</th>
                <th>Referencia & Consentimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.empty}>No hay reservas registradas</td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <div className={styles.clientInfo}>
                        <span className={styles.clientName}>{booking.client_name}</span>
                        <span className={styles.clientContact}>{booking.client_email}</span>
                        <span className={styles.clientContact}>{booking.client_phone}</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0F172A' }}>{new Date(booking.requested_date).toLocaleDateString()}</strong>
                      {booking.requested_time && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{booking.requested_time} hrs</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>{booking.service_type}</div>
                      <p className={styles.details}>{booking.tattoo_details}</p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {booking.reference_url ? (
                          <a href={booking.reference_url} target="_blank" rel="noopener noreferrer" style={{ color: '#E11D48', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={14} /> Ver Referencia
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Sin referencia</span>
                        )}

                        {booking.consent_data ? (
                          <button 
                            onClick={() => setConsentModal({ open: true, data: booking.consent_data })}
                            style={{ background: 'none', border: 'none', color: '#15803D', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                          >
                            <ShieldCheck size={14} /> Ver Firma / Ficha
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Sin firma</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
                        {booking.status === 'pending' ? 'Pendiente' : 
                         booking.status === 'accepted' ? 'Aceptada' : 
                         booking.status === 'rejected' ? 'Rechazada' : 'Reprogramada'}
                      </span>
                    </td>
                    <td>
                      {booking.status === 'pending' && (
                        <div className={styles.actions}>
                          <button onClick={() => updateBookingStatus(booking.id, 'accepted')} className={styles.btnAccept} title="Aceptar">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => updateBookingStatus(booking.id, 'rejected')} className={styles.btnReject} title="Rechazar">
                            <XCircle size={18} />
                          </button>
                          <button 
                            onClick={() => setRescheduleModal({ open: true, bookingId: booking.id, date: booking.requested_date, reason: '' })} 
                            className={styles.btnReschedule} title="Reprogramar"
                          >
                            <Clock size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* VISTA DE BLOQUEOS MANUALES (Feature Vice) */
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className={styles.submitBtn} 
              onClick={() => setBlockModal({ open: true, date: '', startTime: '', endTime: '', reason: '' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Bloquear Fecha / Horario
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha Bloqueada</th>
                  <th>Horario</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {blocks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.empty}>No hay fechas bloqueadas manualmente</td>
                  </tr>
                ) : (
                  blocks.map(block => (
                    <tr key={block.id}>
                      <td><strong style={{ color: '#0F172A' }}>{new Date(block.block_date).toLocaleDateString()}</strong></td>
                      <td>
                        {block.start_time ? `${block.start_time} - ${block.end_time}` : <span style={{ color: '#E11D48', fontWeight: 600 }}>Día entero bloqueado</span>}
                      </td>
                      <td>{block.reason}</td>
                      <td>
                        <button onClick={() => handleDeleteBlock(block.id)} className={styles.btnReject} title="Eliminar Bloqueo">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeModal} onClick={() => setRescheduleModal({ open: false, bookingId: null, date: '', reason: '' })}>
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>Reprogramar Reserva</h2>
            <form onSubmit={handleRescheduleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nueva Fecha Sugerida</label>
                <input 
                  type="date" 
                  value={rescheduleModal.date}
                  onChange={e => setRescheduleModal({...rescheduleModal, date: e.target.value})}
                  required 
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Motivo de la Reprogramación (Se enviará al cliente)</label>
                <textarea 
                  value={rescheduleModal.reason}
                  onChange={e => setRescheduleModal({...rescheduleModal, reason: e.target.value})}
                  required 
                  placeholder="Ej: Lo siento, ese día estaré fuera de la ciudad..."
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              <button type="submit" className={styles.submitBtn}>Enviar y Reprogramar</button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Block Modal */}
      {blockModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeModal} onClick={() => setBlockModal({ open: false, date: '', startTime: '', endTime: '', reason: '' })}>
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>Bloquear Agenda (Día u Horario)</h2>
            <form onSubmit={handleAddBlockSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Fecha a Bloquear</label>
                <input 
                  type="date" 
                  value={blockModal.date}
                  onChange={e => setBlockModal({...blockModal, date: e.target.value})}
                  required 
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hora Inicio (Opcional: Dejar vacío si bloqueas el día completo)</label>
                <input 
                  type="time" 
                  value={blockModal.startTime}
                  onChange={e => setBlockModal({...blockModal, startTime: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hora Fin (Opcional)</label>
                <input 
                  type="time" 
                  value={blockModal.endTime}
                  onChange={e => setBlockModal({...blockModal, endTime: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Motivo / Nota Interna</label>
                <input 
                  type="text"
                  value={blockModal.reason}
                  onChange={e => setBlockModal({...blockModal, reason: e.target.value})}
                  placeholder="Ej: Día libre, sesión privada..."
                  className={styles.input}
                />
              </div>
              <button type="submit" className={styles.submitBtn}>Guardar Bloqueo</button>
            </form>
          </div>
        </div>
      )}

      {/* Consent Details Modal */}
      {consentModal.open && consentModal.data && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px' }}>
            <button className={styles.closeModal} onClick={() => setConsentModal({ open: false, data: null })}>
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>Consentimiento y Firma Digital</h2>
            
            <div style={{ color: '#334155', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><strong style={{ color: '#0F172A' }}>Nombre:</strong> {consentModal.data.fullName}</div>
              <div><strong style={{ color: '#0F172A' }}>RUT/ID:</strong> {consentModal.data.rut} | <strong style={{ color: '#0F172A' }}>Edad:</strong> {consentModal.data.age}</div>
              <div><strong style={{ color: '#0F172A' }}>Teléfono:</strong> {consentModal.data.phone}</div>
              
              <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <strong style={{ color: '#E11D48' }}>Condiciones Médicas Seleccionadas:</strong>
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginTop: '6px' }}>
                  {Object.entries(consentModal.data.medicalConditions || {}).filter(([_, v]) => v).map(([k]) => (
                    <li key={k}>{k}</li>
                  ))}
                  {Object.values(consentModal.data.medicalConditions || {}).every(v => !v) && (
                    <li>Ninguna condición declarada</li>
                  )}
                </ul>
              </div>

              {consentModal.data.signature && (
                <div style={{ marginTop: '16px' }}>
                  <strong style={{ color: '#0F172A' }}>Firma Digital:</strong>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', marginTop: '6px' }}>
                    <img src={consentModal.data.signature} alt="Firma Digital" style={{ maxWidth: '100%', height: 'auto' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
