'use client'
import { useState, useEffect } from 'react'
import { 
  Sparkles, Plus, Edit2, Trash2, Save, RefreshCw, 
  Truck, MapPin, Clock, DollarSign, Check, AlertCircle, X,
  Layers, ChevronRight, ShieldCheck
} from 'lucide-react'
import styles from './servicios.module.css'

export default function AdminServiciosPage() {
  const [categories, setCategories] = useState([])
  const [expressShippingCost, setExpressShippingCost] = useState(3990)
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('24h hábiles en Rancagua y Machalí • 24 a 48h en RM • 2 a 4 días a Regiones')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Service Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null) // null for new, object for edit
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

  const fetchServicesData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/services')
      const data = await res.json()
      if (data.success) {
        setCategories(data.services || [])
        if (data.expressShippingCost) {
          setExpressShippingCost(data.expressShippingCost)
        }
        if (data.deliveryTimeframe) {
          setDeliveryTimeframe(data.deliveryTimeframe)
        }
      }
    } catch (err) {
      console.error('Error fetching services:', err)
      showToast('Error al cargar servicios y tarifas', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicesData()
  }, [])

  const handleSaveAll = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: categories,
          expressShippingCost: parseInt(expressShippingCost, 10) || 3990,
          deliveryTimeframe
        })
      })

      const result = await res.json()
      if (res.ok && result.success) {
        showToast('Servicios, abonos y tarifa de despacho guardados correctamente')
      } else {
        throw new Error(result.error || 'Error al guardar')
      }
    } catch (err) {
      console.error('Error saving services:', err)
      showToast(err.message || 'Error al guardar los cambios', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Open Modal to Add
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

  // Open Modal to Edit
  const handleOpenEdit = (catId, service) => {
    setEditingService(service)
    setTargetCategory(catId)
    setServiceFormData({
      id: service.id,
      title: service.title,
      desc: service.desc || '',
      time: service.time || 1,
      timeStr: service.timeStr || `${service.time || 1} h`,
      priceStr: service.priceStr || '',
      deposit: service.deposit || 20000
    })
    setModalOpen(true)
  }

  // Save Service from Modal
  const handleSaveModalService = (e) => {
    e.preventDefault()
    if (!serviceFormData.title.trim()) {
      alert('Por favor ingresa el título del servicio')
      return
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id !== targetCategory) return cat

      let newServices = [...(cat.services || [])]
      if (editingService) {
        newServices = newServices.map(s => s.id === editingService.id ? { ...serviceFormData } : s)
      } else {
        newServices.push({ ...serviceFormData })
      }
      return { ...cat, services: newServices }
    })

    setCategories(updatedCategories)
    setModalOpen(false)
    showToast(editingService ? 'Servicio actualizado' : 'Servicio agregado')
  }

  // Delete Service
  const handleDeleteService = (catId, serviceId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return

    const updatedCategories = categories.map(cat => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        services: (cat.services || []).filter(s => s.id !== serviceId)
      }
    })

    setCategories(updatedCategories)
    showToast('Servicio eliminado')
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
            <span className={styles.badgePill}>INKEDSOUH STUDIO</span>
            <span className={styles.locationBadge}>
              <MapPin size={13} style={{ color: '#E11D48' }} /> Rancagua, Chile
            </span>
          </div>
          <h1 className={styles.title}>Servicios, Tarifas y Despacho</h1>
          <p className={styles.subtitle}>
            Administra los tipos de tatuajes y servicios que ofreces, sus tiempos y abonos de reserva, y define el precio fijo de despacho express desde Rancagua.
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
            <span>{saving ? 'Guardando...' : 'Guardar Todo'}</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: TARIFA FIJA DE ENVÍO EXPRESS & ORIGEN RANCAGUA */}
      <div className={styles.shippingCard}>
        <div className={styles.shippingCardHeader}>
          <h2 className={styles.shippingCardTitle}>
            <Truck size={22} style={{ color: '#E11D48' }} />
            <span>Tarifa de Despacho Express & Origen</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            Aplicable en la tienda online de insumos y productos
          </span>
        </div>

        <div className={styles.shippingInfoBanner}>
          <MapPin size={20} style={{ color: '#E11D48', flexShrink: 0 }} />
          <div>
            <strong>Estudio Base en Rancagua (Almarza 552):</strong> Los envíos dentro de Rancagua y Machalí se procesan de forma inmediata con entrega prioritaria en 24 horas hábiles. Para la Región Metropolitana el plazo es de 24 a 48 horas. A otras regiones se envía por pagar vía Starken o Chilexpress.
          </div>
        </div>

        <div className={styles.shippingFormRow}>
          <div className={styles.formField}>
            <label>Precio Fijo Envío Express (CLP)</label>
            <input 
              type="number" 
              value={expressShippingCost}
              onChange={(e) => setExpressShippingCost(e.target.value)}
              placeholder="3990"
              min="0"
              step="100"
            />
            <span className={styles.fieldHelper}>
              Monto exacto que se sumará al total de la compra si el cliente selecciona Envío Express.
            </span>
          </div>

          <div className={styles.formField}>
            <label>Texto Informativo de Plazos de Entrega</label>
            <input 
              type="text" 
              value={deliveryTimeframe}
              onChange={(e) => setDeliveryTimeframe(e.target.value)}
              placeholder="24h Rancagua / Machalí • 24-48h RM • 2 a 4 días Regiones"
            />
            <span className={styles.fieldHelper}>
              Se mostrará a los clientes durante el proceso de compra y en el resumen de entrega.
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CATÁLOGO DE SERVICIOS & RESERVAS */}
      <div className={styles.categoriesContainer}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryGroup}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryTitle}>
                <Sparkles size={20} style={{ color: '#E11D48' }} />
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
                <Plus size={16} />
                <span>Agregar a {category.title}</span>
              </button>
            </div>

            <div className={styles.servicesGrid}>
              {(category.services || []).map((service) => (
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
                        {service.priceStr && (
                          <span className={styles.priceBadge}>
                            Tarifa: ${service.priceStr}
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
              ))}
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
                      placeholder="Ej: 70.000 a 120.000"
                    />
                    <span className={styles.fieldHelper}>Visible al cliente en la selección</span>
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
                  <span>Guardar en Lista</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
