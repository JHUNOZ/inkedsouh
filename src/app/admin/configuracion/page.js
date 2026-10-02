'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Save, RefreshCw, Plus, Search, Check, AlertCircle, 
  Trash2, RotateCcw, Sliders, Globe, Sparkles, Layout, 
  MessageSquare, Share2, UploadCloud, Layers,
  CheckCheck, User, Calendar, FileText, ExternalLink, Truck
} from 'lucide-react'
import styles from './configuracion.module.css'

// Standard essential site configurations
const ESSENTIAL_CONFIGS = [
  { 
    section: 'Biografía & Artista', 
    key_name: 'hero_bio', 
    value: 'Artista del tatuaje especializado en Blackwork y Lettering en Rancagua. Con años de experiencia transformando tus ideas en obras maestras permanentes y personalizadas.',
    friendly_label: 'Biografía y Descripción del Artista'
  },
  { 
    section: 'Biografía & Artista', 
    key_name: 'artist_photo', 
    value: '',
    friendly_label: 'Fotografía Oficial del Artista (URL o subida)'
  },
  { 
    section: 'Tienda & Envíos', 
    key_name: 'delivery_timeframe', 
    value: '24 a 48 horas hábiles en Santiago / 2 a 4 días hábiles a Regiones',
    friendly_label: 'Plazo Estimado de Entrega y Envíos'
  },
  { 
    section: 'Agendar Cita', 
    key_name: 'cta_title', 
    value: 'AGENDA TU CITA EXCLUSIVA',
    friendly_label: 'Título Principal del Banner de Agendamiento'
  },
  { 
    section: 'Agendar Cita', 
    key_name: 'cta_subtitle', 
    value: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el estilo, elige la fecha en nuestro calendario y prepárate para llevar arte único en tu piel.',
    friendly_label: 'Subtítulo / Texto Explicativo de Agendar Cita'
  },
  { 
    section: 'Agendar Cita', 
    key_name: 'cta_button_text', 
    value: 'RESERVAR SESIÓN AHORA',
    friendly_label: 'Texto del Botón de Reserva'
  },
  { 
    section: 'Inicio & Hero', 
    key_name: 'hero_badge', 
    value: 'TATTOO STUDIO & TATTOO SUPPLIES',
    friendly_label: 'Insignia / Badge Superior del Hero'
  },
  { 
    section: 'Inicio & Hero', 
    key_name: 'hero_title', 
    value: 'ARTE EN TU PIEL',
    friendly_label: 'Título Principal del Hero'
  },
  { 
    section: 'Inicio & Hero', 
    key_name: 'hero_subtitle', 
    value: 'Cada tatuaje es una historia única, creada con pasión, higiene y precisión quirúrgica.',
    friendly_label: 'Subtítulo del Hero'
  },
  { 
    section: 'Contacto & Redes', 
    key_name: 'contact_instagram_handle', 
    value: '@inked.tto',
    friendly_label: 'Usuario de Instagram'
  },
  { 
    section: 'Contacto & Redes', 
    key_name: 'contact_instagram_url', 
    value: 'https://www.instagram.com/inked.tto/',
    friendly_label: 'Enlace Directo a Instagram'
  },
  { 
    section: 'Contacto & Redes', 
    key_name: 'contact_whatsapp', 
    value: '+56 9 3025 4425',
    friendly_label: 'Número de WhatsApp Oficial'
  },
  { 
    section: 'Contacto & Redes', 
    key_name: 'contact_address', 
    value: 'Rancagua, Región de O\'Higgins, Chile',
    friendly_label: 'Dirección o Ubicación del Estudio'
  },
  { 
    section: 'Footer & Legal', 
    key_name: 'terms_url', 
    value: '',
    friendly_label: 'Documento de Términos y Condiciones (PDF o Enlace)'
  },
  { 
    section: 'Footer & Legal', 
    key_name: 'footer_description', 
    value: 'Estudio profesional de tatuajes y academia de formación artística en Rancagua. Calidad premium y bioseguridad certificada.',
    friendly_label: 'Descripción del Pie de Página (Footer)'
  },
  { 
    section: 'Footer & Legal', 
    key_name: 'footer_copyright', 
    value: '© 2026 INKEDSOUH TATTOO STUDIO. Todos los derechos reservados.',
    friendly_label: 'Texto de Derechos Reservados (Copyright)'
  }
]

// Friendly label resolver
const getFriendlyKeyLabel = (keyName) => {
  const found = ESSENTIAL_CONFIGS.find(c => c.key_name === keyName)
  if (found && found.friendly_label) return found.friendly_label
  return keyName.replace(/_/g, ' ').toUpperCase()
}

export default function ConfiguracionPage() {
  const [configs, setConfigs] = useState([])
  const [originalConfigs, setOriginalConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [savingAll, setSavingAll] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingTerms, setUploadingTerms] = useState(false)
  
  // Search & Filter
  const [search, setSearch] = useState('')
  const [selectedSection, setSelectedSection] = useState('all')

  // New config modal
  const [modalOpen, setModalOpen] = useState(false)
  const [newSection, setNewSection] = useState('Biografía & Artista')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  // Toast
  const [toast, setToast] = useState(null)
  const searchInputRef = useRef(null)
  const photoInputRef = useRef(null)
  const termsInputRef = useRef(null)
  const supabase = createClient()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Keyboard shortcut (Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveAll()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [configs, originalConfigs])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .order('section', { ascending: true })
      
      let merged = []
      if (!error && data) {
        // Start with fetched data
        merged = [...data]
        
        // Ensure all essential configs exist in the state
        ESSENTIAL_CONFIGS.forEach(essential => {
          const exists = merged.find(m => m.key_name === essential.key_name)
          if (!exists) {
            merged.push({
              id: `temp-${essential.key_name}`,
              section: essential.section,
              key_name: essential.key_name,
              value: essential.value
            })
          }
        })
      } else {
        merged = ESSENTIAL_CONFIGS.map((e, idx) => ({
          id: `temp-${e.key_name}-${idx}`,
          section: e.section,
          key_name: e.key_name,
          value: e.value
        }))
      }

      setConfigs(merged)
      setOriginalConfigs(JSON.parse(JSON.stringify(merged)))
    } catch (err) {
      console.error('Fetch exception:', err)
      setConfigs(ESSENTIAL_CONFIGS.map((e, idx) => ({
        id: `temp-${e.key_name}-${idx}`,
        section: e.section,
        key_name: e.key_name,
        value: e.value
      })))
    } finally {
      setLoading(false)
    }
  }

  // Check which configs have unsaved modifications
  const modifiedMap = configs.reduce((acc, c) => {
    const orig = originalConfigs.find(o => o.key_name === c.key_name)
    if (orig && orig.value !== c.value) {
      acc[c.key_name] = true
    }
    return acc
  }, {})

  const modifiedCount = Object.keys(modifiedMap).length

  // Update field value locally
  const handleChange = (key_name, value) => {
    setConfigs(configs.map(c => c.key_name === key_name ? { ...c, value } : c))
  }

  // Upload artist photo directly
  const handleUploadArtistPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `artist_bio_${Date.now()}.${fileExt}`
      const filePath = `profile/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      handleChange('artist_photo', publicUrl)
      await handleUpdate('artist_photo', publicUrl)
      showToast('¡Foto del artista subida y guardada exitosamente!')
    } catch (err) {
      showToast('Error al subir foto: ' + err.message, 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Upload Terms and Conditions document directly
  const handleUploadTerms = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingTerms(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `terminos_y_condiciones_${Date.now()}.${fileExt}`
      const filePath = `legal/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      handleChange('terms_url', publicUrl)
      await handleUpdate('terms_url', publicUrl)
      showToast('¡Documento de Términos y Condiciones subido y sincronizado!')
    } catch (err) {
      showToast('Error al subir documento: ' + err.message, 'error')
    } finally {
      setUploadingTerms(false)
      if (termsInputRef.current) termsInputRef.current.value = ''
    }
  }

  // Save single configuration row (with upsert)
  const handleUpdate = async (key_name, newValue) => {
    setSavingId(key_name)
    try {
      const item = configs.find(c => c.key_name === key_name)
      const section = item?.section || 'General'

      const payload = {
        section,
        key_name,
        value: newValue,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('site_config')
        .upsert(payload, { onConflict: 'key_name' })
        
      if (!error) {
        setOriginalConfigs(prev => prev.map(o => o.key_name === key_name ? { ...o, value: newValue } : o))
        showToast(`"${getFriendlyKeyLabel(key_name)}" guardado y sincronizado`)
      } else {
        showToast('Error al guardar: ' + error.message, 'error')
      }
    } catch (err) {
      showToast('Error inesperado al guardar', 'error')
    } finally {
      setSavingId(null)
    }
  }

  // Save all modified configurations in batch
  const handleSaveAll = async () => {
    const modifiedItems = configs.filter(c => modifiedMap[c.key_name])
    if (modifiedItems.length === 0) {
      showToast('No hay cambios pendientes por guardar', 'info')
      return
    }

    setSavingAll(true)
    try {
      for (const item of modifiedItems) {
        await supabase
          .from('site_config')
          .upsert({
            section: item.section || 'General',
            key_name: item.key_name,
            value: item.value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key_name' })
      }
      setOriginalConfigs(JSON.parse(JSON.stringify(configs)))
      showToast(`¡Se guardaron ${modifiedItems.length} cambios exitosamente!`)
    } catch (err) {
      showToast('Error al guardar cambios: ' + err.message, 'error')
    } finally {
      setSavingAll(false)
    }
  }

  // Discard changes for a single item
  const handleRevertSingle = (key_name) => {
    const orig = originalConfigs.find(o => o.key_name === key_name)
    if (orig) {
      setConfigs(configs.map(c => c.key_name === key_name ? { ...c, value: orig.value } : c))
      showToast('Cambios revertidos')
    }
  }

  // Discard all unsaved changes
  const handleRevertAll = () => {
    setConfigs(JSON.parse(JSON.stringify(originalConfigs)))
    showToast('Todos los cambios sin guardar fueron revertidos')
  }

  // Delete configuration row
  const handleDelete = async (id, keyName) => {
    if (confirm(`¿Eliminar definitivamente el parámetro "${keyName}"?`)) {
      try {
        const { error } = await supabase.from('site_config').delete().eq('key_name', keyName)
        if (!error) {
          setConfigs(configs.filter(c => c.key_name !== keyName))
          setOriginalConfigs(originalConfigs.filter(c => c.key_name !== keyName))
          showToast(`Parámetro "${keyName}" eliminado`)
        } else {
          showToast('Error al eliminar: ' + error.message, 'error')
        }
      } catch (err) {
        showToast('Error al procesar eliminación', 'error')
      }
    }
  }

  // Add new configuration key
  const handleCreateConfig = async (e) => {
    e.preventDefault()
    if (!newKey.trim() || !newValue.trim()) {
      showToast('Por favor completa todos los campos', 'error')
      return
    }

    const cleanKey = newKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    
    if (configs.some(c => c.key_name.toLowerCase() === cleanKey)) {
      showToast(`La clave "${cleanKey}" ya existe`, 'error')
      return
    }

    try {
      const payload = {
        section: newSection.trim() || 'General',
        key_name: cleanKey,
        value: newValue.trim()
      }

      const { data, error } = await supabase
        .from('site_config')
        .insert([payload])
        .select()

      if (!error && data) {
        setConfigs([...configs, data[0]])
        setOriginalConfigs([...originalConfigs, data[0]])
        setModalOpen(false)
        setNewKey('')
        setNewValue('')
        showToast(`Clave "${cleanKey}" creada exitosamente`)
      } else {
        showToast('Error al crear: ' + (error?.message || 'Verifica permisos'), 'error')
      }
    } catch (err) {
      showToast('Error de conexión al crear clave', 'error')
    }
  }

  // Seed all essential configs
  const handleSeedDefaults = async () => {
    if (!confirm('¿Deseas asegurar y sincronizar todos los textos base del estudio en la base de datos?')) {
      return
    }

    try {
      setLoading(true)
      let insertedCount = 0
      for (const item of ESSENTIAL_CONFIGS) {
        const { error } = await supabase
          .from('site_config')
          .upsert({
            section: item.section,
            key_name: item.key_name,
            value: item.value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key_name' })
        if (!error) insertedCount++
      }
      showToast(`¡Se sincronizaron ${insertedCount} parámetros base!`)
      fetchConfigs()
    } catch (err) {
      showToast('Error al sincronizar textos: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Sections extraction
  const sections = ['all', 'Biografía & Artista', 'Agendar Cita', 'Inicio & Hero', 'Contacto & Redes', 'Footer & Legal']

  // Filtered configs
  const filteredConfigs = configs.filter(config => {
    const matchSearch = (config.key_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (config.value || '').toLowerCase().includes(search.toLowerCase()) ||
                        (config.section || '').toLowerCase().includes(search.toLowerCase()) ||
                        getFriendlyKeyLabel(config.key_name).toLowerCase().includes(search.toLowerCase())
    
    const matchSection = selectedSection === 'all' || config.section === selectedSection
    return matchSearch && matchSection
  })

  return (
    <div className={styles.container}>
      {/* Toast Notification Alert */}
      {toast && (
        <div className={`${styles.toast} ${
          toast.type === 'error' ? styles.toastError : 
          toast.type === 'info' ? styles.toastInfo : styles.toastSuccess
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Badges */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.brandBadge}>INKED CONTROL</span>
            <span className={styles.versionBadge}>WEB CONFIG V1.0</span>
            <span className={styles.shortcutTip}>Atajo: Ctrl+S para guardar</span>
          </div>
          <h1 className={styles.title}>Configuración & Textos del Sitio</h1>
          <p className={styles.subtitle}>
            Modifica en tiempo real la biografía del artista, los llamados para agendar cita, eslóganes e información institucional sincronizada con tu página web.
          </p>
        </div>

        <div className={styles.topActions}>
          <button 
            type="button" 
            onClick={handleSeedDefaults} 
            className={styles.btnSecondary}
            title="Sincronizar plantilla de textos base si faltan parámetros"
          >
            <Sparkles size={16} />
            <span>Sincronizar Textos Base</span>
          </button>

          <button 
            type="button" 
            onClick={() => setModalOpen(true)} 
            className={styles.btnAdd}
          >
            <Plus size={18} />
            <span>Nueva Clave</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Bar */}
      <div className={styles.metricsBar}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Parámetros</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{configs.length}</span>
            <Globe size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Secciones Principales</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>5 Secciones</span>
            <Layers size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Cambios Pendientes</span>
          <div className={styles.metricValueWrap}>
            <span className={`${styles.metricValue} ${modifiedCount > 0 ? styles.textWarning : styles.textSuccess}`}>
              {modifiedCount}
            </span>
            <Sliders size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Sincronización Web</span>
          <div className={styles.metricValueWrap}>
            <span className={`${styles.metricValue} ${styles.textSuccess}`}>En Tiempo Real</span>
            <CheckCheck size={18} className={styles.metricIcon} />
          </div>
        </div>
      </div>

      {/* MODIFIED CHANGES BANNER */}
      {modifiedCount > 0 && (
        <div className={styles.changesStickyBar}>
          <div className={styles.changesInfo}>
            <AlertCircle size={18} className={styles.changesIcon} />
            <span>Tienes <strong>{modifiedCount}</strong> cambio(s) sin guardar en los textos del sitio web.</span>
          </div>
          <div className={styles.changesActions}>
            <button 
              type="button" 
              onClick={handleRevertAll} 
              className={styles.btnSecondary}
              disabled={savingAll}
            >
              <RotateCcw size={15} />
              <span>Descartar Cambios</span>
            </button>
            <button 
              type="button" 
              onClick={handleSaveAll} 
              className={styles.btnSaveAll}
              disabled={savingAll}
            >
              {savingAll ? <RefreshCw size={15} className={styles.spin} /> : <Save size={15} />}
              <span>{savingAll ? 'Guardando...' : `Guardar Todos (${modifiedCount})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* FILTER & TABS TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Buscar por texto, sección o identificador..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={styles.searchInput}
          />
        </div>

        {/* Section Tabs */}
        <div className={styles.sectionTabs}>
          <button 
            type="button"
            onClick={() => setSelectedSection('all')}
            className={`${styles.tabBtn} ${selectedSection === 'all' ? styles.tabBtnActive : ''}`}
          >
            Todas ({configs.length})
          </button>
          {sections.filter(s => s !== 'all').map(sec => {
            const count = configs.filter(c => c.section === sec).length
            return (
              <button 
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`${styles.tabBtn} ${selectedSection === sec ? styles.tabBtnActive : ''}`}
              >
                {sec} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* CONFIGURATION CARDS GRID */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <RefreshCw size={32} className={styles.spin} />
          <p>Cargando configuraciones desde Supabase...</p>
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className={styles.emptyState}>
          <Globe size={48} className={styles.emptyIcon} />
          <h3>No se encontraron parámetros</h3>
          <p>Prueba con otros términos de búsqueda o sincroniza los textos base recomendados.</p>
          <button type="button" onClick={handleSeedDefaults} className={styles.btnAdd}>
            <Sparkles size={16} /> Sincronizar Textos Base
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredConfigs.map((config) => {
            const isDirty = !!modifiedMap[config.key_name]
            const isSavingThis = savingId === config.key_name
            const isBio = config.key_name === 'hero_bio'
            const isCTA = config.key_name.startsWith('cta_')
            const isPhoto = config.key_name === 'artist_photo'
            const isTerms = config.key_name === 'terms_url'
            const isDelivery = config.key_name === 'delivery_timeframe'
            const isLongText = (config.value || '').length > 60 || (config.value || '').includes('\n') || isBio || config.key_name === 'cta_subtitle'

            return (
              <div 
                key={config.key_name} 
                className={`${styles.card} ${isDirty ? styles.cardDirty : ''} ${isBio || isCTA || isTerms || isDelivery ? styles.cardHighlight : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <div className={styles.cardKeyHeader}>
                      <span className={styles.keyTag}>{config.key_name}</span>
                      {isDirty && <span className={styles.dirtyDot} title="Modificado sin guardar">● Sin Guardar</span>}
                    </div>
                    <h3 className={styles.cardTitle}>{getFriendlyKeyLabel(config.key_name)}</h3>
                  </div>
                  
                  <span className={styles.badge}>{config.section}</span>
                </div>
                
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label>
                      {isBio ? 'Texto de la Biografía del Artista:' : 
                       isCTA ? 'Texto para el Banner de Agendamiento:' : 
                       isPhoto ? 'URL o Imagen del Artista:' : 
                       isTerms ? 'Documento PDF de Términos y Condiciones (se abre en nueva pestaña en el footer):' :
                       isDelivery ? 'Plazo de Entrega y Envíos (se muestra en tienda y checkout):' :
                       'Contenido del Texto:'}
                    </label>
                    <span className={styles.charCount}>{(config.value || '').length} caracteres</span>
                  </div>

                  {isPhoto ? (
                    <div className={styles.photoControlGroup}>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={config.value || ''}
                        onChange={(e) => handleChange(config.key_name, e.target.value)}
                        placeholder="https://... o sube una imagen desde tu PC"
                      />
                      <button 
                        type="button" 
                        onClick={() => photoInputRef.current?.click()}
                        className={styles.btnUploadPhoto}
                        disabled={uploadingPhoto}
                      >
                        <UploadCloud size={16} />
                        <span>{uploadingPhoto ? 'Subiendo...' : 'Subir Foto'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={photoInputRef}
                        accept="image/*"
                        onChange={handleUploadArtistPhoto}
                        style={{ display: 'none' }}
                      />
                      {config.value && (
                        <div className={styles.photoPreviewThumb}>
                          <img src={config.value} alt="Preview artista" />
                        </div>
                      )}
                    </div>
                  ) : isTerms ? (
                    <div className={styles.photoControlGroup}>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={config.value || ''}
                        onChange={(e) => handleChange(config.key_name, e.target.value)}
                        placeholder="URL del PDF o sube el archivo PDF desde tu PC"
                      />
                      <button 
                        type="button" 
                        onClick={() => termsInputRef.current?.click()}
                        className={styles.btnUploadPhoto}
                        disabled={uploadingTerms}
                        style={{ background: '#2563eb', border: '1px solid #3b82f6' }}
                      >
                        <FileText size={16} />
                        <span>{uploadingTerms ? 'Subiendo PDF...' : 'Subir PDF Términos'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={termsInputRef}
                        accept=".pdf,.doc,.docx,application/pdf"
                        onChange={handleUploadTerms}
                        style={{ display: 'none' }}
                      />
                      {config.value && (
                        <a 
                          href={config.value} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                          <ExternalLink size={14} /> Ver PDF Actual ↗
                        </a>
                      )}
                    </div>
                  ) : isLongText ? (
                    <textarea 
                      className={`${styles.input} ${styles.textarea}`} 
                      rows={isBio ? 5 : 4}
                      value={config.value || ''}
                      onChange={(e) => handleChange(config.key_name, e.target.value)}
                      placeholder="Escribe el texto aquí..."
                    />
                  ) : (
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={config.value || ''}
                      onChange={(e) => handleChange(config.key_name, e.target.value)}
                      placeholder={isDelivery ? 'Ej: 24 a 48 horas en RM y 2 a 4 días hábiles a Regiones' : 'Escribe el texto aquí...'}
                    />
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardFooterLeft}>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(config.id, config.key_name)} 
                      className={styles.btnDelete}
                      title="Eliminar este parámetro"
                    >
                      <Trash2 size={15} />
                    </button>

                    {isDirty && (
                      <button 
                        type="button" 
                        onClick={() => handleRevertSingle(config.key_name)} 
                        className={styles.btnRevert}
                        title="Descartar cambios en este campo"
                      >
                        <RotateCcw size={14} /> Revertir
                      </button>
                    )}
                  </div>

                  <button 
                    type="button"
                    className={`${styles.btnSave} ${isDirty ? styles.btnSaveHighlight : ''}`} 
                    onClick={() => handleUpdate(config.key_name, config.value)}
                    disabled={isSavingThis || !isDirty}
                  >
                    {isSavingThis ? (
                      <>
                        <RefreshCw size={15} className={styles.spin} />
                        <span>Guardando...</span>
                      </>
                    ) : isDirty ? (
                      <>
                        <Save size={15} />
                        <span>Guardar</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Sincronizado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE NEW CONFIG MODAL */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Crear Nueva Clave de Configuración</h3>
                <p>Añade un nuevo texto o parámetro dinámico para tu sitio web.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)} 
                className={styles.btnCloseModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConfig} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Sección / Categoría *</label>
                <select 
                  value={newSection} 
                  onChange={e => setNewSection(e.target.value)} 
                  className={styles.input}
                  required
                >
                  <option value="Biografía & Artista">Biografía & Artista</option>
                  <option value="Agendar Cita">Agendar Cita (CTA)</option>
                  <option value="Inicio & Hero">Inicio & Hero</option>
                  <option value="Contacto & Redes">Contacto & Redes</option>
                  <option value="Footer & Legal">Footer & Legal</option>
                  <option value="Tienda & Productos">Tienda & Productos</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Identificador Clave (Slug único) *</label>
                <input 
                  type="text" 
                  placeholder="ej: promo_banner_text, whatsapp_support" 
                  value={newKey} 
                  onChange={e => setNewKey(e.target.value)} 
                  className={styles.input}
                  required
                />
                <span className={styles.fieldHint}>Se guardará en minúsculas y sin espacios (ej: mi_clave).</span>
              </div>

              <div className={styles.formGroup}>
                <label>Valor / Texto inicial *</label>
                <textarea 
                  rows={4} 
                  placeholder="Escribe el contenido o texto que se mostrará..." 
                  value={newValue} 
                  onChange={e => setNewValue(e.target.value)} 
                  className={`${styles.input} ${styles.textarea}`}
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.btnAdd}
                >
                  <Save size={16} /> Crear Parámetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
