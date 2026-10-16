'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useConfig } from '@/context/ConfigContext'
import { 
  Save, RefreshCw, Check, AlertCircle, 
  User, MessageSquare, FileText,
  UploadCloud, ExternalLink, Calendar, X, Eye, Video
} from 'lucide-react'
import styles from './configuracion.module.css'

const DEFAULT_CONFIGS = {
  // Artista & Estudio / Hero (Foto 1)
  artist_photo: '',
  hero_bio: 'Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión. Con años de experiencia, fusiono creatividad y técnica para transformar tus ideas en arte permanente.',
  hero_badge: 'TATTOO STUDIO & TATTOO SUPPLIES',
  hero_title: 'INKEDSOUH',
  contact_instagram_handle: '@inked.tto',
  contact_instagram_url: 'https://www.instagram.com/inked.tto/',
  contact_address: 'Almarza 552, Rancagua, Región de O\'Higgins, Chile',

  // Sección Agendar Cita (Foto 2)
  cta_title: 'AGENDAR TU CITA',
  cta_subtitle: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.',
  cta_button_text: 'RESERVAR AHORA',
  cta_media_url: '',

  // Contacto & Redes
  contact_whatsapp: '+56 9 3025 4425',

  // Footer & Legal
  footer_description: 'Estudio profesional de tatuajes y academia de formación artística en Rancagua. Calidad premium y bioseguridad certificada.',
  footer_copyright: '© 2026 INKEDSOUH TATTOO STUDIO. Todos los derechos reservados.',
  terms_url: ''
}

export default function ConfiguracionPage() {
  const { refreshConfig } = useConfig()
  const [formData, setFormData] = useState(DEFAULT_CONFIGS)
  const [originalData, setOriginalData] = useState(DEFAULT_CONFIGS)
  const [activeTab, setActiveTab] = useState('artista') // 'artista' | 'agendar' | 'contacto' | 'legal'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCtaMedia, setUploadingCtaMedia] = useState(false)
  const [uploadingTerms, setUploadingTerms] = useState(false)
  const [toast, setToast] = useState(null)

  const photoInputRef = useRef(null)
  const ctaMediaInputRef = useRef(null)
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
            if (item.key_name === 'cta_text' && (!loaded.cta_subtitle || loaded.cta_subtitle === DEFAULT_CONFIGS.cta_subtitle)) {
              loaded.cta_subtitle = item.value
            }
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
    setFormData(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'cta_subtitle') {
        next.cta_text = value
      }
      return next
    })
  }

  // Guardar todo y sincronizar en tiempo real
  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const rows = Object.keys(formData).map(key => {
        let section = 'General'
        if (['hero_bio', 'artist_photo', 'hero_badge', 'hero_title', 'contact_address'].includes(key)) section = 'Artista & Estudio'
        if (['cta_title', 'cta_subtitle', 'cta_button_text', 'cta_media_url'].includes(key)) section = 'Agendar Cita'
        if (['contact_whatsapp', 'contact_instagram_handle', 'contact_instagram_url'].includes(key)) section = 'Contacto & Redes'
        if (['footer_description', 'footer_copyright', 'terms_url'].includes(key)) section = 'Footer & Legal'

        return {
          section,
          key_name: key,
          value: formData[key] ?? '',
          updated_at: now
        }
      })

      // Also ensure cta_text is persisted with cta_subtitle
      rows.push({
        section: 'Agendar Cita',
        key_name: 'cta_text',
        value: formData.cta_subtitle ?? '',
        updated_at: now
      })

      const { error } = await supabase
        .from('site_config')
        .upsert(rows, { onConflict: 'key_name' })

      if (error) throw error

      setOriginalData({ ...formData })
      if (typeof refreshConfig === 'function') {
        await refreshConfig()
      }
      showToast('Configuraciones guardadas y sincronizadas en tiempo real con la web')
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
      showToast('Foto del artista cargada. Recuerda guardar cambios para sincronizar.')
    } catch (err) {
      showToast('Error al subir foto: ' + err.message, 'error')
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  // Subir media para la sección Agendar Cita
  const handleUploadCtaMedia = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCtaMedia(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `agendar_${Date.now()}.${fileExt}`
      const filePath = `agendar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      handleChange('cta_media_url', publicUrl)
      showToast('Contenido multimedia para Agendar cargado. Guarda cambios para sincronizar.')
    } catch (err) {
      showToast('Error al subir archivo: ' + err.message, 'error')
    } finally {
      setUploadingCtaMedia(false)
      if (ctaMediaInputRef.current) ctaMediaInputRef.current.value = ''
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
            Edita de forma simple y rápida la foto, descripción del artista, datos del hero, agendamiento y redes. Sincronización automática con la página web.
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

      {/* Tabs Selector: 1. Artista & Estudio / Hero, 2. Agendar Cita (Reemplaza Textos de Inicio), 3. Contacto & Redes, 4. Footer & Legal */}
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
          className={`${styles.tabBtn} ${activeTab === 'agendar' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('agendar')}
        >
          <Calendar size={16} />
          <span>Agendar Cita</span>
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
          className={`${styles.tabBtn} ${activeTab === 'legal' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('legal')}
        >
          <FileText size={16} />
          <span>Footer & Legal</span>
        </button>
      </div>

      {/* TAB 1: ARTISTA & ESTUDIO (FOTO 1: Foto del artista, descripción, badge superior, título e Instagram) */}
      {activeTab === 'artista' && (
        <div className={styles.card} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* FOTOGRAFÍA OFICIAL DEL ARTISTA */}
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Fotografía Oficial del Artista (Hero Inicio)
            </label>
            <div className={styles.photoControlGroup}>
              {formData.artist_photo ? (
                <div className={styles.photoPreviewThumb} style={{ width: '100px', height: '100px', borderRadius: '16px' }}>
                  <img src={formData.artist_photo} alt="Foto del artista" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div className={styles.photoPreviewThumb} style={{ width: '100px', height: '100px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <User size={36} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <input 
                  type="text" 
                  className={styles.input}
                  value={formData.artist_photo}
                  onChange={(e) => handleChange('artist_photo', e.target.value)}
                  placeholder="URL de la imagen (o presiona Subir Nueva Foto)"
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
            <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
              Esta imagen se muestra en el contenedor orgánico izquierdo del inicio (Hero).
            </span>
          </div>

          {/* DESCRIPCIÓN OFICIAL DEL ARTISTA (LO MARCADO EN FOTO 1) */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Descripción Oficial del Artista (Hero Inicio)
              </label>
              <span className={styles.charCount}>{formData.hero_bio?.length || 0} caracteres</span>
            </div>
            <textarea 
              rows={4}
              className={styles.textarea}
              value={formData.hero_bio}
              onChange={(e) => handleChange('hero_bio', e.target.value)}
              placeholder="Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión..."
            />
            <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
              Párrafo principal visible al lado de la foto del artista en el inicio de la web.
            </span>
          </div>

          {/* BADGE SUPERIOR DEL HERO & TÍTULO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Badge Superior del Hero (Artista y Estudio)
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.hero_badge}
                onChange={(e) => handleChange('hero_badge', e.target.value)}
                placeholder="TATTOO STUDIO & TATTOO SUPPLIES"
              />
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Insignia superior roja ubicada sobre la descripción del artista.
              </span>
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
                placeholder="INKEDSOUH"
              />
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Nombre principal o tipografía artística del encabezado.
              </span>
            </div>
          </div>

          {/* INSTAGRAM & DIRECCIÓN DEL ESTUDIO */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Usuario de Instagram (Hero)
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.contact_instagram_handle}
                onChange={(e) => handleChange('contact_instagram_handle', e.target.value)}
                placeholder="@inked.tto"
              />
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Botón magnético de Instagram que acompaña la descripción.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Ubicación / Dirección del Estudio
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.contact_address}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                placeholder="Almarza 552, Rancagua, Región de O'Higgins, Chile"
              />
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                Estudio base para citas, envíos prioritarios y pie de página.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGENDAR CITA (FOTO 2: Reemplaza Textos de Inicio) */}
      {activeTab === 'agendar' && (
        <div className={styles.card} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={20} style={{ color: '#E11D48', flexShrink: 0 }} />
            <div style={{ fontSize: '0.88rem', color: '#881337' }}>
              <strong>Sección Agendar Cita (Inicio):</strong> Modifica aquí el título destacado, la descripción, el botón de reserva y el contenido multimedia que los clientes ven antes de reservar su sesión de tatuaje.
            </div>
          </div>

          {/* TÍTULO DE AGENDAMIENTO & TEXTO BOTÓN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Título Principal de la Sección (Foto 2)
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.cta_title}
                onChange={(e) => handleChange('cta_title', e.target.value)}
                placeholder="AGENDAR TU CITA"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
                Texto del Botón de Reserva (Foto 2)
              </label>
              <input 
                type="text" 
                className={styles.input}
                value={formData.cta_button_text}
                onChange={(e) => handleChange('cta_button_text', e.target.value)}
                placeholder="RESERVAR AHORA"
              />
            </div>
          </div>

          {/* DESCRIPCIÓN DE AGENDAMIENTO */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                Descripción de la Cita (Foto 2)
              </label>
              <span className={styles.charCount}>{formData.cta_subtitle?.length || 0} caracteres</span>
            </div>
            <textarea 
              rows={3}
              className={styles.textarea}
              value={formData.cta_subtitle}
              onChange={(e) => handleChange('cta_subtitle', e.target.value)}
              placeholder="Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel."
            />
          </div>

          {/* FOTO O VIDEO DE AGENDAMIENTO */}
          <div className={styles.formGroup}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'block' }}>
              Imagen o Video de la Sección Agendar (Marco Orgánico)
            </label>
            <div className={styles.photoControlGroup}>
              {formData.cta_media_url ? (
                <div className={styles.photoPreviewThumb} style={{ width: '100px', height: '100px', borderRadius: '16px', overflow: 'hidden' }}>
                  {formData.cta_media_url.endsWith('.mp4') || formData.cta_media_url.endsWith('.webm') ? (
                    <video src={formData.cta_media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted playsInline />
                  ) : (
                    <img src={formData.cta_media_url} alt="Media agendar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ) : (
                <div className={styles.photoPreviewThumb} style={{ width: '100px', height: '100px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <Video size={36} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <input 
                  type="text" 
                  className={styles.input}
                  value={formData.cta_media_url}
                  onChange={(e) => handleChange('cta_media_url', e.target.value)}
                  placeholder="URL de imagen o video mp4 (o deja vacío para usar el video por defecto)"
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    ref={ctaMediaInputRef}
                    type="file" 
                    accept="image/*,video/mp4,video/webm" 
                    style={{ display: 'none' }}
                    onChange={handleUploadCtaMedia}
                  />
                  <button 
                    type="button" 
                    className={styles.btnUploadPhoto}
                    onClick={() => ctaMediaInputRef.current?.click()}
                    disabled={uploadingCtaMedia}
                  >
                    <UploadCloud size={16} />
                    <span>{uploadingCtaMedia ? 'Subiendo...' : 'Subir Imagen o Video'}</span>
                  </button>

                  {formData.cta_media_url && (
                    <button 
                      type="button" 
                      className={styles.btnSecondary}
                      onClick={() => handleChange('cta_media_url', '')}
                    >
                      <X size={15} />
                      <span>Restablecer Video Por Defecto</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
              Si no especificas un archivo personalizado, la web mostrará el video cinemático oficial de tatuaje.
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: CONTACTO & REDES */}
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
              Se utiliza para el botón flotante de WhatsApp, confirmación de pedidos y contacto directo.
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
