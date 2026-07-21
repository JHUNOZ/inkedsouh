'use client'
// Gestión de reservas del admin
import { useState } from 'react'
import { Check, X, Eye } from 'lucide-react'
import { MOCK_RESERVAS } from '@/lib/mockData'
import mainStyles from '../main.module.css'
import localStyles from './reservas.module.css'

export default function ReservasAdmin() {
  const [filterStatus, setFilterStatus] = useState('todos')
  const [reservas, setReservas] = useState(MOCK_RESERVAS)
  
  // Modals state
  const [selectedReserva, setSelectedReserva] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const filtered = filterStatus === 'todos'
    ? reservas
    : reservas.filter(a => a.status === filterStatus)

  const handleConfirm = (id) => {
    // Aquí iría la llamada a Supabase + Resend
    setReservas(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmada' } : r))
    alert('Reserva confirmada. (Se enviará email al cliente)')
  }

  const openCancelModal = (reserva) => {
    setSelectedReserva(reserva)
    setShowCancelModal(true)
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      alert('Debes ingresar un motivo de cancelación.')
      return
    }
    // Aquí iría la llamada a Supabase + Resend
    setReservas(prev => prev.map(r => 
      r.id === selectedReserva.id 
        ? { ...r, status: 'cancelada', cancel_reason: cancelReason } 
        : r
    ))
    setShowCancelModal(false)
    setCancelReason('')
    setSelectedReserva(null)
    alert('Reserva cancelada. (Se enviará email al cliente con el motivo)')
  }

  const closeModals = () => {
    setSelectedReserva(null)
    setShowCancelModal(false)
    setCancelReason('')
  }

  return (
    <div>
      <h1 className={mainStyles.title}>Gestor de Reservas</h1>
      <p className={mainStyles.subtitle}>Administra, confirma y cancela las citas de tus clientes</p>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['todos', 'pendiente', 'confirmada', 'cancelada'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: `1px solid ${filterStatus === status ? '#C41E1E' : '#2A2A2A'}`,
              background: filterStatus === status ? '#C41E1E' : 'transparent',
              color: filterStatus === status ? '#fff' : '#888',
              fontSize: '0.82rem',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className={mainStyles.section} style={{ padding: 0, overflow: 'hidden' }}>
        <div className={mainStyles.table}>
          <div className={mainStyles.tableHeader} style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 0.8fr 1fr' }}>
            <span>Cliente</span>
            <span>Servicio</span>
            <span>Fecha y Hora</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {filtered.map((apt) => (
            <div key={apt.id} className={mainStyles.tableRow} style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 0.8fr 1fr' }}>
              <div className={mainStyles.clientCell}>
                <span className={mainStyles.clientName}>{apt.client}</span>
                <span className={mainStyles.clientEmail}>{apt.email}</span>
              </div>
              <span>{apt.service}</span>
              <span>{apt.date} | {apt.time}</span>
              <span className={`${mainStyles.status} ${mainStyles[`status_${apt.status}`]}`}>
                {apt.status}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  title="Ver Detalles" 
                  className={`${localStyles.actionBtn} ${localStyles.btnView}`}
                  onClick={() => setSelectedReserva(apt)}
                >
                  <Eye size={16} />
                </button>
                {apt.status === 'pendiente' && (
                  <button 
                    title="Confirmar" 
                    className={`${localStyles.actionBtn} ${localStyles.btnConfirm}`}
                    onClick={() => handleConfirm(apt.id)}
                  >
                    <Check size={16} />
                  </button>
                )}
                {apt.status !== 'cancelada' && (
                  <button 
                    title="Cancelar" 
                    className={`${localStyles.actionBtn} ${localStyles.btnCancel}`}
                    onClick={() => openCancelModal(apt)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
              No hay reservas con estado: {filterStatus}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      {selectedReserva && !showCancelModal && (
        <div className={localStyles.modalOverlay} onClick={closeModals}>
          <div className={localStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={localStyles.modalHeader}>
              <h3 className={localStyles.modalTitle}>Detalles de Reserva</h3>
              <button className={localStyles.closeBtn} onClick={closeModals}><X size={20} /></button>
            </div>
            <div className={localStyles.modalBody}>
              <div className={localStyles.detailRow}>
                <span>Cliente</span>
                <span>{selectedReserva.client} ({selectedReserva.email})</span>
              </div>
              <div className={localStyles.detailRow}>
                <span>Servicio</span>
                <span>{selectedReserva.service}</span>
              </div>
              <div className={localStyles.detailRow}>
                <span>Fecha y Hora</span>
                <span>{selectedReserva.date} a las {selectedReserva.time}</span>
              </div>
              <div className={localStyles.detailRow}>
                <span>Estado</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedReserva.status}</span>
              </div>
              {selectedReserva.cancel_reason && (
                <div className={localStyles.detailRow}>
                  <span style={{ color: '#ef4444' }}>Motivo de Cancelación</span>
                  <span>{selectedReserva.cancel_reason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelación */}
      {showCancelModal && selectedReserva && (
        <div className={localStyles.modalOverlay} onClick={closeModals}>
          <div className={localStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={localStyles.modalHeader}>
              <h3 className={localStyles.modalTitle}>Cancelar Reserva</h3>
              <button className={localStyles.closeBtn} onClick={closeModals}><X size={20} /></button>
            </div>
            <div className={localStyles.modalBody}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
                Vas a cancelar la reserva de <strong>{selectedReserva.client}</strong>. 
                Por favor, ingresa el motivo. Este será enviado al cliente por correo.
              </p>
              <div className={localStyles.detailRow}>
                <span>Motivo de cancelación (Requerido)</span>
                <textarea 
                  className={localStyles.input} 
                  rows="4"
                  placeholder="Ej: Problemas de disponibilidad, reagendamiento..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className={localStyles.modalFooter}>
              <button className={`${localStyles.btn} ${localStyles.btnGhost}`} onClick={closeModals}>Volver</button>
              <button className={`${localStyles.btn} ${localStyles.btnDanger}`} onClick={handleCancel}>Confirmar Cancelación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
