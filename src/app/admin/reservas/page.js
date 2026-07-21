'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, XCircle, Clock, X } from 'lucide-react'
import styles from './reservas.module.css'

export default function ReservasPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, bookingId: null, date: '', reason: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setBookings(data)
    }
    setLoading(false)
  }

  const updateBookingStatus = async (id, status, extraData = {}) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status, ...extraData })
      .eq('id', id)

    if (!error) {
      // Send email notification via our API route
      const booking = bookings.find(b => b.id === id)
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: status, // 'accepted', 'rejected', 'rescheduled'
          booking: { ...booking, ...extraData }
        })
      })

      fetchBookings()
    } else {
      alert('Error actualizando reserva')
    }
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    await updateBookingStatus(rescheduleModal.bookingId, 'rescheduled', {
      reschedule_reason: rescheduleModal.reason,
      requested_date: rescheduleModal.date // Updating the date to the new one
    })
    setRescheduleModal({ open: false, bookingId: null, date: '', reason: '' })
  }

  if (loading) {
    return <div className={styles.loading}>Cargando reservas...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Reservas</h1>
        <p className={styles.subtitle}>Administra tus solicitudes de citas</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Fecha Solicitada</th>
              <th>Detalles</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="5" className={styles.empty}>No hay reservas registradas</td>
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
                  <td>{new Date(booking.requested_date).toLocaleDateString()}</td>
                  <td><p className={styles.details}>{booking.tattoo_details}</p></td>
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
    </div>
  )
}
