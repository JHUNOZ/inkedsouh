'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Save, RefreshCw, Check, AlertCircle, 
  User, MessageSquare, Sparkles, FileText,
  UploadCloud, ExternalLink, MapPin, X
} from 'lucide-react'
import styles from './configuracion.module.css'

const DEFAULT_CONFIGS = {
  // Artista & Estudio
  hero_bio: 'Artista del tatuaje especializado en Blackwork y Lettering en Rancagua. Con años de experiencia transformando tus ideas en obras maestras permanentes y personalizadas.',
  artist_photo: '',
  contact_address: 'Almarza 552, Rancagua, Región de O\'Higgins, Chile',

  // Contacto & Redes
  contact_whatsapp: '+56 9 3025 4425',
  contact_instagram_handle: '@inked.tto',
  contact_instagram_url: 'https://www.instagram.com/inked.tto/',

  // Inicio & Citas
  hero_badge: 'TATTOO STUDIO & TATTOO SUPPLIES',
  hero_title: 'ARTE EN TU PIEL',
  hero_subtitle: 'Cada tatuaje es una historia única, creada con pasión, higiene y precisión quirúrgica.',
  cta_title: 'AGENDA TU CITA EXCLUSIVA',
  cta_subtitle: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el estilo, elige la fecha en nuestro calendario y prepárate para llevar arte único en tu piel.',
  cta_button_text: 'RESERVAR SESIÓN AHORA',

  // Footer & Legal
  footer_description: 'Estudio profesional de tatuajes y academia de formación artística en Rancagua. Calidad premium y bioseguridad certificada.',
  footer_copyright: '© 2026 INKEDSOUH TATTOO STUDIO. Todos los derechos reservados.',
  terms_url: ''
}

export default function ConfiguracionPage() {
  const [formData, setFormData] = useState(DEFAULT_CONFIGS)
  const [originalData, setOriginalData] = useState(DEFAULT_CONFIGS)
  const [activeTab, setActiveTab] = useState('artista') // 'artista' | 'contacto' | 'inicio' | 'legal'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingTerms, setUploadingTerms] = useState(false)
  const [toast, setToast] = useState(null)

  const photoInputRef = useRef(null)
  const termsInputRef = useRef(null)
  const supabase = createClient()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Cargar configuraciones desde Supabase
  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('site_config').select('*')
      if (!error && data && data.length > 0) {
        const loaded = { ...DEFAULT_CONFIGS }
        data.forEach(item => {
          if (item.key_name && item.value !== undefined && item.value !== null) {
            loaded[item.key_name] = item.value
          }
        })
        setFormData(loaded)
        setOriginalData(loaded)
      } else {
        setFormData(DEFAULT_CONFIGS)
        setOriginalData(DEFAULT_CONFIGS)
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err)
      showToast('Error al cargar la configuración', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Comprobar si hay cambios sin guardar
  const hasChanges = Object.keys(formData).some(key => formData[key] !== originalData[key])

  // Modificar campo localmente
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  // Guardar todo
  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const rows = Object.keys(formData).map(key => {
        let section = 'General'
        if (['hero_bio', 'artist_photo', 'contact_address'].includes(key)) section = 'Biografía & Artista'
        if (['contact_whatsapp', 'contact_instagram_handle', 'contact_instagram_url'].includes(key)) section = 'Contacto & Redes'
        if (['hero_badge', 'hero_title', 'hero_subtitle', 'cta_title', 'cta_subtitle', 'cta_button_text'].includes(key)) section = 'Inicio & Hero'
        if (['footer_description', 'footer_copyright', 'terms_url'].includes(key)) section = 'Footer & Legal'

        return {
          section,
          key_name: key,
          value: formData[key],
          updated_at: new Date().toISOString()
        }
      })

      const { error } = await supabase
        .from('site_config')
        .upsert(rows, { onConflict: 'key_name' })

      if (error) throw error

      setOriginalData({ ...formData })
      showToast('Configuraciones guardadas y sincronizadas exitosamente')
    } catch (err) {
      console.error('Error al guardar configuración:', err)
      showToast('Error al guardar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Subir foto oficial del artista
  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `artist_${Date.now()}.${fileExt}`
      const filePath = `profile/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      handleChange('artist_photo', publicUrl)
      showToast('Foto del artista cargada correctamente')
    } catch (err) {
      showToast('Error al subir foto: ' + err.message, 'error')
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  // Subir Términos y Condiciones
  const handleUploadTerms = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingTerms(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `terminos_${Date.now()}.${fileExt}`
      const filePath = `legal/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      handleChange('terms_url', publicUrl)
      showToast('Documento de Términos subido exitosamente')
    } catch (err) {
      showToast('Error al subir documento: ' + err.message, 'error')
    } finally {
      setUploadingTerms(false)
      if (termsInputRef.current) termsInputRef.current.value = ''
    }
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
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.brandBadge}>INKEDSOUH WEB</span>
            <span className={styles.versionBadge}>Panel de Ajustes</span>
          </div>
          <h1 className={styles.title}>Configuración del Sitio Web</h1>
          <p className={styles.subtitle}>
            Edita de forma simple y rápida la biografía del artista, datos de contacto, enlaces y textos de la página.
          </p>
        </div>

        <div className={styles.topActions}>
          <button 
            type="button" 
            className={styles.btnSecondary} 
            onClick={fetchConfigs}
            disabled={loading || saving}
          >
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
            <span>Recargar</span>
          </button>

          <button 
            type="button" 
            className={styles.btnAdd}
            onClick={handleSaveAll}
            disabled={loading || saving || !hasChanges}
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className={styles.sectionTabs}>
        <button 
          type="button" 
          className={`${styles.tabBtn} ${activeTab === 'artista' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('artista')}
        >
          <User size={16} />
          <span>Artista & Estudio</span>
        </button>

        <button 
          type="button" 
          className={`${styles.tabBtn} ${activeTab === 'contacto' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('contacto')}
        >
          <MessageSquare size={16} />
          <span>Contacto & Redes</span>
        </button>

        <button 
          type="button" 
          className={`${styles.tabBtn} ${activeTab === 'inicio' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('inicio')}
        >
          <Sparkles size={16} />
          <span>Textos de Inicio</span>
        </button>

        <button 
          type="button" 
          className={`${styles.tabBtn} ${activeTab === 'legal' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('legal')}
        >
          <FileText size={16} />
          <span>Footer & Legal</span>
        </button>
      </div>

      {/* TAB 1: ARTISTA & ESTUDIO */}
      {activeTab === 'artista' && (
        <div className={styles.card} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label>Biografía Oficial del Artista</label>
              <span className={styles.charCount}>{formData.hero_bio?.length || 0} caracteres</span>
            </div>
            <textarea 
              rows={4}
              className={styles.textarea}
              value={formData.hero_bio}
              onChange={(e) => handleChange('hero_bio', e.target.value)}
              placeholder="Describe tu trayectoria, estilos principales y propuesta artística..."
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Fotografía Oficial del Artista
            </label>
            <div className={styles.photoControlGroup}>
              {formData.artist_photo ? (
                <div className={styles.photoPreviewThumb} style={{ width: '90px', height: '90px' }}>
                  <img src={formData.artist_photo} alt="Foto del artista" />
                </div>
              ) : (
                <div className={styles.photoPreviewThumb} style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <User size={32} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <input 
                  type="text" 
                  className={styles.input}
                  value={formData.artist_photo}
                  onChange={(e) => handleChange('artist_photo', e.target.value)}
                  placeholder="URL de la imagen (o sube un archivo directamente)"
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    ref={photoInputRef}
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={handleUploadPhoto}
                  />
                  <button 
                    type="button" 
                    className={styles.btnUploadPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <UploadCloud size={16} />
                    <span>{uploadingPhoto ? 'Subiendo...' : 'Subir Nueva Foto'}</span>
                  </button>

                  {formData.artist_photo && (
                    <button 
                      type="button" 
                      className={styles.btnSecondary}
                      onClick={() => handleChange('artist_photo', '')}
                    >
                      <X size={15} />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Dirección o Ubicación del Estudio
            </label>
            <input 
              type="text" 
              className={styles.input}
              value={formData.contact_address}
              onChange={(e) => handleChange('contact_address', e.target.value)}
              placeholder="Almarza 552, Rancagua, Chile"
            />
            <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
              Se muestra en el pie de página, detalles de despacho y mapa de contacto.
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTO & REDES */}
      {activeTab === 'contacto' && (
        <div className={styles.card} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Número de WhatsApp Oficial
            </label>
            <input 
              type="text" 
              className={styles.input}
              value={formData.contact_whatsapp}
              onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
              placeholder="+56 9 3025 4425"
            />
            <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
              Se utiliza para el botón flotante de WhatsApp y confirmación de pedidos.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Usuario de Instagram
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.contact_instagram_handle}
                onChange={(e) => handleChange('contact_instagram_handle', e.target.value)}
                placeholder="@inked.tto"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Enlace Directo a Instagram
              </label>
              <input 
                type="url" 
                className={styles.input}
                value={formData.contact_instagram_url}
                onChange={(e) => handleChange('contact_instagram_url', e.target.value)}
                placeholder="https://www.instagram.com/inked.tto/"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEXTOS DE INICIO & CITAS */}
      {activeTab === 'inicio' && (
        <div className={styles.card} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Insignia / Badge Superior del Hero
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.hero_badge}
                onChange={(e) => handleChange('hero_badge', e.target.value)}
                placeholder="TATTOO STUDIO & TATTOO SUPPLIES"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Título Principal del Hero
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.hero_title}
                onChange={(e) => handleChange('hero_title', e.target.value)}
                placeholder="ARTE EN TU PIEL"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Subtítulo del Hero
            </label>
            <input 
              type="text" 
              className={styles.input}
              value={formData.hero_subtitle}
              onChange={(e) => handleChange('hero_subtitle', e.target.value)}
              placeholder="Cada tatuaje es una historia única..."
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '6px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Título del Banner de Agendamiento
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.cta_title}
                onChange={(e) => handleChange('cta_title', e.target.value)}
                placeholder="AGENDA TU CITA EXCLUSIVA"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Texto del Botón de Reserva
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.cta_button_text}
                onChange={(e) => handleChange('cta_button_text', e.target.value)}
                placeholder="RESERVAR SESIÓN AHORA"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Subtítulo del Banner de Agendamiento
            </label>
            <textarea 
              rows={3}
              className={styles.textarea}
              value={formData.cta_subtitle}
              onChange={(e) => handleChange('cta_subtitle', e.target.value)}
              placeholder="Reserva tu sesión de forma rápida y sencilla..."
            />
          </div>
        </div>
      )}

      {/* TAB 4: FOOTER & LEGAL */}
      {activeTab === 'legal' && (
        <div className={styles.card} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Descripción del Pie de Página (Footer)
            </label>
            <textarea 
              rows={3}
              className={styles.textarea}
              value={formData.footer_description}
              onChange={(e) => handleChange('footer_description', e.target.value)}
              placeholder="Estudio profesional de tatuajes y academia de formación artística..."
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Texto de Derechos Reservados (Copyright)
            </label>
            <input 
              type="text" 
              className={styles.input}
              value={formData.footer_copyright}
              onChange={(e) => handleChange('footer_copyright', e.target.value)}
              placeholder="© 2026 INKEDSOUH TATTOO STUDIO. Todos los derechos reservados."
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Documento de Términos y Condiciones (PDF o Enlace)
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                className={styles.input}
                value={formData.terms_url}
                onChange={(e) => handleChange('terms_url', e.target.value)}
                placeholder="https://... o sube un documento PDF"
                style={{ flex: 1 }}
              />
              <input 
                ref={termsInputRef}
                type="file" 
                accept=".pdf,.doc,.docx" 
                style={{ display: 'none' }}
                onChange={handleUploadTerms}
              />
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={() => termsInputRef.current?.click()}
                disabled={uploadingTerms}
              >
                <UploadCloud size={16} />
                <span>{uploadingTerms ? 'Subiendo...' : 'Subir PDF'}</span>
              </button>

              {formData.terms_url && (
                <a 
                  href={formData.terms_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                  title="Abrir documento"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bar if there are unsaved changes */}
      {hasChanges && (
        <div className={styles.changesStickyBar}>
          <div className={styles.changesInfo}>
            <div className={styles.changesIcon}>
              <AlertCircle size={20} />
            </div>
            <span>Tienes cambios pendientes en la configuración web.</span>
          </div>

          <div className={styles.changesActions}>
            <button 
              type="button" 
              className={styles.btnSecondary}
              onClick={() => setFormData({ ...originalData })}
              disabled={saving}
            >
              Descartar
            </button>
            <button 
              type="button" 
              className={styles.btnSaveAll}
              onClick={handleSaveAll}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
