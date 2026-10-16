'use client'
import { useState, useEffect } from 'react'
import { 
  Layers, Plus, Edit2, Trash2, Save, RefreshCw, 
  MapPin, Clock, DollarSign, Check, AlertCircle, X,
  ShieldCheck
} from 'lucide-react'
import styles from './servicios.module.css'

export default function AdminServiciosPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Service Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [targetCategory, setTargetCategory] = useState('')
  const [serviceFormData, setServiceFormData] = useState({
    id: '',
    title: '',
    desc: '',
    time: 1,
    timeStr: '1 h',
    priceStr: '35.000',
    deposit: 20000
  })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Cargar servicios desde la API
  const fetchServicesData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/services', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.services) {
        // Sanitize any existing priceStr from double dollar signs
        const cleaned = data.services.map(cat => ({
          ...cat,
          services: (cat.services || []).map(s => ({
            ...s,
            priceStr: s.priceStr ? String(s.priceStr).replace(/^\$+/, '') : ''
          }))
        }))
        setCategories(cleaned)
      }
    } catch (err) {
      console.error('Error fetching services:', err)
      showToast('Error al cargar servicios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicesData()
  }, [])

  // Sincronización persistente en tiempo real con la web
  const persistChanges = async (newCats) => {
    try {
      setSaving(true)
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: newCats
        })
      })

      const result = await res.json()
      if (res.ok && result.success) {
        showToast('Servicios sincronizados exitosamente con la web')
      } else {
        throw new Error(result.error || 'Error al guardar')
      }
    } catch (err) {
      console.error('Error saving services:', err)
      showToast(err.message || 'Error al guardar cambios', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Guardar todo manualmente
  const handleSaveAll = async () => {
    await persistChanges(categories)
  }

  // Abrir Modal para Crear
  const handleOpenAdd = (catId) => {
    setEditingService(null)
    setTargetCategory(catId)
    setServiceFormData({
      id: `svc_${Date.now()}`,
      title: '',
      desc: '',
      time: 2,
      timeStr: '2 h',
      priceStr: '50.000',
      deposit: 20000
    })
    setModalOpen(true)
  }

  // Abrir Modal para Editar
  const handleOpenEdit = (catId, service) => {
    setEditingService(service)
    setTargetCategory(catId)
    setServiceFormData({
      id: service.id,
      title: service.title,
      desc: service.desc || '',
      time: service.time || 1,
      timeStr: service.timeStr || `${service.time || 1} h`,
      priceStr: String(service.priceStr || '').replace(/^\$+/, ''),
      deposit: service.deposit || 20000
    })
    setModalOpen(true)
  }

  // Guardar servicio desde el Modal (sincroniza en tiempo real)
  const handleSaveModalService = async (e) => {
    e.preventDefault()
    if (!serviceFormData.title.trim()) {
      alert('Por favor ingresa el título del servicio')
      return
    }

    const cleanedFormData = {
      ...serviceFormData,
      priceStr: String(serviceFormData.priceStr || '').replace(/^\$+/, '')
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id !== targetCategory) return cat

      let newServices = [...(cat.services || [])]
      if (editingService) {
        newServices = newServices.map(s => s.id === editingService.id ? { ...cleanedFormData } : s)
      } else {
        newServices.push({ ...cleanedFormData })
      }
      return { ...cat, services: newServices }
    })

    setCategories(updatedCategories)
    setModalOpen(false)
    await persistChanges(updatedCategories)
  }

  // Eliminar Servicio (sincroniza en tiempo real)
  const handleDeleteService = async (catId, serviceId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return

    const updatedCategories = categories.map(cat => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        services: (cat.services || []).filter(s => s.id !== serviceId)
      }
    })

    setCategories(updatedCategories)
    await persistChanges(updatedCategories)
  }

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.badgeRow}>
            <span className={styles.badgePill}>GESTIÓN DE SERVICIOS</span>
          </div>
          <h1 className={styles.title}>Servicios y Tarifas de Tatuaje</h1>
          <p className={styles.subtitle}>
            Administra los tipos de tatuajes, tiempos estimados y valores de abono para la agenda de reservas. Los cambios se sincronizan en vivo.
          </p>
        </div>

        <div className={styles.topActions}>
          <button 
            type="button" 
            className={styles.btnSecondary}
            onClick={fetchServicesData}
            disabled={loading || saving}
          >
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
            <span>Recargar</span>
          </button>

          <button 
            type="button" 
            className={styles.btnPrimary}
            onClick={handleSaveAll}
            disabled={loading || saving}
          >
            <Save size={16} />
            <span>{saving ? 'Sincronizando...' : 'Guardar Servicios'}</span>
          </button>
        </div>
      </div>

      {/* CATÁLOGO DE SERVICIOS & RESERVAS */}
      <div className={styles.categoriesContainer}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryGroup}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryTitle}>
                <Layers size={18} style={{ color: '#E11D48' }} />
                <span>{category.title}</span>
                <span className={styles.categoryCountBadge}>
                  {category.services?.length || 0} servicios
                </span>
              </div>

              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={() => handleOpenAdd(category.id)}
              >
                <Plus size={15} />
                <span>Agregar a {category.title}</span>
              </button>
            </div>

            <div className={styles.servicesGrid}>
              {(category.services || []).map((service) => {
                // Ensure no double dollar sign
                const cleanPrice = String(service.priceStr || '').replace(/^\$+/, '')
                return (
                  <div key={service.id} className={styles.serviceCard}>
                    <div className={styles.serviceTop}>
                      <div>
                        <h3 className={styles.serviceTitleText}>{service.title}</h3>
                        {service.desc ? (
                          <p className={styles.serviceDescText}>{service.desc}</p>
                        ) : (
                          <p className={styles.serviceDescText} style={{ fontStyle: 'italic', color: '#94A3B8' }}>
                            Sin descripción adicional.
                          </p>
                        )}

                        <div className={styles.serviceBadgesRow}>
                          <span className={styles.timeBadge}>
                            <Clock size={12} />
                            {service.timeStr || `${service.time} h`}
                          </span>
                          {cleanPrice && (
                            <span className={styles.priceBadge}>
                              Tarifa: ${cleanPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Abono / Valor de Reserva */}
                    <div className={styles.depositBox}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} style={{ color: '#E11D48' }} />
                        <span className={styles.depositLabel}>Abono / Reserva:</span>
                      </div>
                      <span className={styles.depositAmount}>
                        ${(service.deposit || 20000).toLocaleString('es-CL')} CLP
                      </span>
                    </div>

                    <div className={styles.serviceCardActions}>
                      <button 
                        type="button" 
                        className={styles.btnActionEdit}
                        onClick={() => handleOpenEdit(category.id, service)}
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>
                      <button 
                        type="button" 
                        className={styles.btnActionDelete}
                        onClick={() => handleDeleteService(category.id, service.id)}
                      >
                        <Trash2 size={13} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para Crear / Editar Servicio */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalHeaderTitle}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Tatuaje'}
              </h3>
              <button 
                type="button" 
                className={styles.modalCloseBtn}
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModalService}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Título del Servicio *</label>
                  <input 
                    type="text" 
                    value={serviceFormData.title}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, title: e.target.value })}
                    placeholder="Ej: Tatuaje Mediano (10 a 18 cm)"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Descripción del Servicio</label>
                  <textarea 
                    rows={3}
                    value={serviceFormData.desc}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, desc: e.target.value })}
                    placeholder="Detalles sobre zona, colores, técnicas aplicables..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={styles.formField}>
                    <label>Duración Estimada (Horas)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="12"
                      value={serviceFormData.time}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1
                        setServiceFormData({ 
                          ...serviceFormData, 
                          time: val, 
                          timeStr: `${val} h` 
                        })
                      }}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Texto de Duración</label>
                    <input 
                      type="text" 
                      value={serviceFormData.timeStr}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, timeStr: e.target.value })}
                      placeholder="Ej: 2 h"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={styles.formField}>
                    <label>Rango de Precio Referencial</label>
                    <input 
                      type="text" 
                      value={serviceFormData.priceStr}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, priceStr: e.target.value })}
                      placeholder="Ej: 70.000 a 120.000 (sin signo $)"
                    />
                    <span className={styles.fieldHelper}>Visible al cliente en la selección de reserva</span>
                  </div>

                  <div className={styles.formField}>
                    <label>Abono de Reserva (CLP)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="5000"
                      value={serviceFormData.deposit}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, deposit: parseInt(e.target.value, 10) || 0 })}
                      placeholder="20000"
                    />
                    <span className={styles.fieldHelper}>Monto fijado para reservar fecha</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.btnSecondary}
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                >
                  <Save size={16} />
                  <span>Guardar y Sincronizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
