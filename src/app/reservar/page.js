'use client'
// Página de reservas con lógica de disponibilidad y categorías
import { useState, useMemo } from 'react'
import { Calendar, Clock, User, Mail, Phone, FileText, Upload, ChevronLeft, ChevronRight, Check, ArrowLeft, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { SERVICE_CATEGORIES, SERVICE_TYPES } from '@/lib/constants'
import styles from './reservar.module.css'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

// --- MOCK DATA PARA PROBAR BLOQUEOS ---
const MOCK_BOOKINGS = [
  { date: '2026-05-18', startTime: 12, duration: 3 },
  { date: '2026-05-19', startTime: 10, duration: 5 },
]

export default function ReservarPage() {
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [form, setForm] = useState({
    serviceId: '',
    date: null,
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    referenceType: 'none', // 'none', 'link', 'file'
    referenceLink: '',
    referenceFile: null
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [submitted, setSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [linkError, setLinkError] = useState('')

  const selectedService = useMemo(() => SERVICE_TYPES.find(s => s.id === form.serviceId), [form.serviceId])

  // Lógica de Calendario
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    return days
  }

  const isDateAvailable = (day) => {
    if (!day) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) return false
    if (date.getDay() === 0) return false // Domingo

    if (selectedService && selectedService.time === 10 && date.getDay() === 6) {
      return false
    }

    return true
  }

  const selectDate = (day) => {
    if (!isDateAvailable(day)) return
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setForm({ ...form, date, time: '' })
  }

  // Generación de Horarios Disponibles
  const availableTimeSlots = useMemo(() => {
    if (!form.date || !selectedService) return []

    const dayOfWeek = form.date.getDay()
    const openHour = 10
    let closeHour = dayOfWeek === 6 ? 15 : 19 

    const duration = selectedService.time
    const slots = []

    if (duration === 10) {
      closeHour = 20
    }

    const dateStr = `${form.date.getFullYear()}-${String(form.date.getMonth() + 1).padStart(2, '0')}-${String(form.date.getDate()).padStart(2, '0')}`
    const todaysBookings = MOCK_BOOKINGS.filter(b => b.date === dateStr)

    for (let currentHour = openHour; currentHour <= closeHour - duration; currentHour += 0.5) {
      const hasConflict = todaysBookings.some(booking => {
        const bookingEnd = booking.startTime + booking.duration
        const currentEnd = currentHour + duration
        return currentHour < bookingEnd && currentEnd > booking.startTime
      })

      if (!hasConflict) {
        const h = Math.floor(currentHour)
        const m = currentHour % 1 === 0 ? '00' : '30'
        slots.push(`${h.toString().padStart(2, '0')}:${m}`)
      }
    }

    return slots
  }, [form.date, selectedService])

  const getEndTime = (startTimeStr, durationHours) => {
    if (!startTimeStr) return ''
    const [h, m] = startTimeStr.split(':').map(Number)
    let totalMinutes = h * 60 + m + (durationHours * 60)
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
  }

  const validateLink = (url) => {
    if (!url) {
      setLinkError('')
      return true
    }
    try {
      const parsedUrl = new URL(url)
      const allowedDomains = ['instagram.com', 'pinterest.com', 'pinterest.cl', 'google.com', 'drive.google.com']
      const isAllowed = allowedDomains.some(domain => parsedUrl.hostname.includes(domain))
      if (!isAllowed) {
        setLinkError('Solo se permiten enlaces de Instagram, Pinterest o Google Drive.')
        return false
      }
      setLinkError('')
      return true
    } catch (e) {
      setLinkError('Por favor ingresa una URL válida (ej. https://instagram.com/...)')
      return false
    }
  }

  const handleLinkChange = (e) => {
    const val = e.target.value
    updateForm('referenceLink', val)
    if (val) validateLink(val)
    else setLinkError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      updateForm('referenceFile', file)
    }
  }

  const handleSubmit = async () => {
    if (form.referenceType === 'link' && !validateLink(form.referenceLink)) {
      return
    }
    
    setIsUploading(true)
    let finalReferenceUrl = ''

    try {
      if (form.referenceType === 'file' && form.referenceFile) {
        // TODO: Supabase Storage Upload
        // Cuando configures Supabase, aquí subirías el archivo usando:
        // const fileExt = form.referenceFile.name.split('.').pop()
        // const fileName = `${Date.now()}.${fileExt}`
        // const { data, error } = await supabase.storage.from('references').upload(fileName, form.referenceFile)
        // finalReferenceUrl = supabase.storage.from('references').getPublicUrl(fileName).data.publicUrl
        
        // Simulación temporal de subida
        await new Promise(resolve => setTimeout(resolve, 1500))
        finalReferenceUrl = `https://mock-storage.com/references/${form.referenceFile.name}`
      } else if (form.referenceType === 'link') {
        finalReferenceUrl = form.referenceLink
      }

      const payload = {
        client_name: form.name,
        client_email: form.email,
        client_phone: form.phone,
        appointment_date: form.date.toISOString().split('T')[0],
        appointment_time: form.time,
        service_type: form.serviceId,
        notes: form.notes,
        reference_url: finalReferenceUrl
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Error al enviar la reserva')
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Hubo un problema al procesar la reserva. Intenta de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const updateForm = (field, value) => setForm({ ...form, [field]: value })

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <Check size={48} />
            </div>
            <h2 className={styles.successTitle}>¡Cita Reservada!</h2>
            <p className={styles.successText}>
              Te hemos enviado un correo a <strong>{form.email}</strong>. 
            </p>
            <BubbleButton href="/" variant="outline">Volver al Inicio</BubbleButton>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const currentCategoryObj = SERVICE_CATEGORIES.find(c => c.id === selectedCategory)

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.bgGeometry}>
          <div className={`${styles.shape} ${styles.circle}`}></div>
          <div className={`${styles.shape} ${styles.triangle}`}></div>
          <img src="/images/snake.png" alt="Snake decoration" className={`${styles.snakeImg} ${styles.snakeLeft}`} />
          <img src="/images/snake.png" alt="Snake decoration" className={`${styles.snakeImg} ${styles.snakeRight}`} />
        </div>

        <div className={styles.container}>
          <SectionTitle subtitle="Reserva tu sesión" red>AGENDAR CITA</SectionTitle>

          <div className={styles.steps}>
            {['Servicio', 'Fecha', 'Hora', 'Datos'].map((label, i) => (
              <div key={label} className={`${styles.step} ${step >= i + 1 ? styles.stepActive : ''}`}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <span className={styles.stepLabel}>{label}</span>
              </div>
            ))}
          </div>

          {/* Paso 1: Servicios (Categorizados) */}
          {step === 1 && (
            <div className={styles.stepContent}>
              {!selectedCategory ? (
                <>
                  <h3 className={styles.stepTitle}>Selecciona una categoría</h3>
                  <div className={styles.categoryGrid}>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button 
                        key={cat.id} 
                        className={styles.categoryCard}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <span className={styles.categoryTitle}>{cat.title}</span>
                        <span className={styles.categoryCount}>{cat.services.length} servicios</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.categoryHeader}>
                    <button className={styles.backBtn} onClick={() => setSelectedCategory(null)}>
                      <ArrowLeft size={16} /> Volver a categorías
                    </button>
                    <h3 className={styles.stepTitle}>{currentCategoryObj?.title}</h3>
                  </div>
                  
                  <div className={styles.serviceGrid}>
                    {currentCategoryObj?.services.map((svc) => (
                      <div key={svc.id} className={`${styles.serviceCard} ${form.serviceId === svc.id ? styles.serviceActive : ''}`}>
                        <div className={styles.serviceInfo}>
                          <h4 className={styles.serviceTitle}>{svc.title}</h4>
                          {svc.desc && <p className={styles.serviceDesc}>{svc.desc}</p>}
                        </div>
                        <div className={styles.serviceFooter}>
                          <div className={styles.serviceMeta}>
                            <span>{svc.timeStr} |</span>
                            <span className={styles.servicePrice}>{svc.priceStr}</span>
                          </div>
                          <button 
                            className={styles.selectBtn}
                            onClick={() => {
                              updateForm('serviceId', svc.id)
                              if (svc.time === 10) {
                                updateForm('time', '10:00')
                              }
                              setStep(2)
                            }}
                          >
                            SELECCIONAR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Paso 2: Fecha */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Selecciona la fecha</h3>
              <p className={styles.stepDesc}>Servicio seleccionado: <strong>{selectedService?.title} ({selectedService?.timeStr})</strong></p>
              
              <div className={styles.calendarContainer}>
                <div className={styles.calendar}>
                  <div className={styles.calendarHeader}>
                    <button className={styles.calendarNav} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                      <ChevronLeft size={20} />
                    </button>
                    <span className={styles.calendarMonth}>
                      {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button className={styles.calendarNav} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className={styles.calendarDays}>
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                      <span key={d} className={styles.dayLabel}>{d}</span>
                    ))}
                    {getDaysInMonth(currentMonth).map((day, i) => (
                      <button
                        key={i}
                        className={`${styles.dayBtn} ${!day ? styles.dayEmpty : ''} ${day && !isDateAvailable(day) ? styles.dayDisabled : ''} ${form.date && day === form.date.getDate() && currentMonth.getMonth() === form.date.getMonth() ? styles.daySelected : ''}`}
                        onClick={() => selectDate(day)}
                        disabled={!day || !isDateAvailable(day)}
                      >
                        {day || ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.stepActions}>
                <BubbleButton variant="ghost" onClick={() => setStep(1)}>Atrás</BubbleButton>
                <BubbleButton onClick={() => setStep(3)} disabled={!form.date}>Siguiente</BubbleButton>
              </div>
            </div>
          )}

          {/* Paso 3: Hora */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Selecciona la hora</h3>
              <p className={styles.dateSelected}>
                <Calendar size={16} />
                {form.date?.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              
              {availableTimeSlots.length === 0 ? (
                <div className={styles.noSlots}>
                  No hay bloques de {selectedService?.timeStr} seguidos disponibles en esta fecha.
                </div>
              ) : (
                <div className={styles.timeGrid}>
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      className={`${styles.timeBtn} ${form.time === time ? styles.timeActive : ''}`}
                      onClick={() => updateForm('time', time)}
                    >
                      <Clock size={14} />
                      {time}
                    </button>
                  ))}
                </div>
              )}

              {form.time && selectedService && (
                <div className={styles.timePreviewBlock}>
                  Horario bloqueado: <span>{form.time} a {getEndTime(form.time, selectedService.time)}</span> ({selectedService.timeStr})
                </div>
              )}

              <div className={styles.stepActions}>
                <BubbleButton variant="ghost" onClick={() => setStep(2)}>Atrás</BubbleButton>
                <BubbleButton onClick={() => setStep(4)} disabled={!form.time}>Siguiente</BubbleButton>
              </div>
            </div>
          )}

          {/* Paso 4: Datos */}
          {step === 4 && (
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>Tus datos</h3>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <User size={18} className={styles.inputIcon} />
                  <input type="text" placeholder="Nombre completo" className={styles.input} value={form.name} onChange={(e) => updateForm('name', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input type="email" placeholder="Correo electrónico" className={styles.input} value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input type="tel" placeholder="Teléfono" className={styles.input} value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <FileText size={18} className={styles.inputIcon} />
                  <textarea placeholder="Describe tu idea..." className={styles.textarea} value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={3} />
                </div>
              </div>

              <div className={styles.referenceSection}>
                <h4 className={styles.referenceTitle}>¿Tienes una idea en mente? (Opcional)</h4>
                <div className={styles.referenceTabs}>
                  <button 
                    className={`${styles.refTab} ${form.referenceType === 'none' ? styles.refTabActive : ''}`}
                    onClick={() => updateForm('referenceType', 'none')}
                  >
                    No, gracias
                  </button>
                  <button 
                    className={`${styles.refTab} ${form.referenceType === 'link' ? styles.refTabActive : ''}`}
                    onClick={() => updateForm('referenceType', 'link')}
                  >
                    <LinkIcon size={16} /> Link
                  </button>
                  <button 
                    className={`${styles.refTab} ${form.referenceType === 'file' ? styles.refTabActive : ''}`}
                    onClick={() => updateForm('referenceType', 'file')}
                  >
                    <Upload size={16} /> Imagen
                  </button>
                </div>

                {form.referenceType === 'link' && (
                  <div className={styles.referenceContent}>
                    <div className={styles.inputGroup}>
                      <LinkIcon size={18} className={styles.inputIcon} />
                      <input 
                        type="url" 
                        placeholder="https://pinterest.com/..." 
                        className={styles.input} 
                        value={form.referenceLink} 
                        onChange={handleLinkChange} 
                      />
                    </div>
                    {linkError && <p className={styles.errorText}>{linkError}</p>}
                    <p className={styles.hintText}>Soportamos links de Pinterest, Instagram y Google Drive.</p>
                  </div>
                )}

                {form.referenceType === 'file' && (
                  <div className={styles.referenceContent}>
                    <label className={styles.fileUploadArea}>
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        className={styles.fileInput} 
                        onChange={handleFileChange}
                      />
                      {form.referenceFile ? (
                        <div className={styles.fileSelected}>
                          <ImageIcon size={24} className={styles.fileIcon} />
                          <span>{form.referenceFile.name}</span>
                        </div>
                      ) : (
                        <div className={styles.filePlaceholder}>
                          <Upload size={24} className={styles.fileIcon} />
                          <span>Haz clic para subir una imagen</span>
                          <small>JPG, PNG o WEBP (Max 5MB)</small>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className={styles.summary}>
                <h4>Resumen</h4>
                <div className={styles.summaryRow}>
                  <span>Servicio:</span>
                  <strong>{selectedService?.title} ({selectedService?.timeStr})</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Fecha:</span>
                  <strong>{form.date?.toLocaleDateString('es-CL')}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Hora:</span>
                  <strong>{form.time} hrs</strong>
                </div>
              </div>

              <div className={styles.stepActions}>
                <BubbleButton variant="ghost" onClick={() => setStep(3)}>Atrás</BubbleButton>
                <BubbleButton 
                  onClick={handleSubmit} 
                  disabled={!form.name || !form.email || !form.phone || isUploading || (form.referenceType === 'link' && linkError)}
                >
                  {isUploading ? 'Procesando...' : 'Confirmar Reserva'}
                </BubbleButton>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
