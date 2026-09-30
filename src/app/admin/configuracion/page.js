'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Save, RefreshCw, Plus, Search, Check, AlertCircle, 
  Trash2, RotateCcw, Sliders, Globe, Sparkles, Layout, 
  MessageSquare, Share2, HelpCircle, Eye, EyeOff, Layers,
  ExternalLink, CheckCheck
} from 'lucide-react'
import styles from './configuracion.module.css'

// Default seed configurations in case the database is empty
const DEFAULT_CONFIGS = [
  { section: 'Inicio', key_name: 'hero_badge', value: 'TATTOO STUDIO & TATTOO SUPPLIES' },
  { section: 'Inicio', key_name: 'hero_title', value: 'ARTE EN TU PIEL' },
  { section: 'Inicio', key_name: 'hero_subtitle', value: 'Cada tatuaje es una historia única, creada con pasión, higiene y precisión quirúrgica.' },
  { section: 'Inicio', key_name: 'hero_bio', value: 'Artista del tatuaje especializado en Blackwork y Lettering en Rancagua. Con años de experiencia transformando tus ideas en obras maestras permanentes.' },
  { section: 'Llamados a la Acción', key_name: 'cta_title', value: 'AGENDA TU CITA EXCLUSIVA' },
  { section: 'Llamados a la Acción', key_name: 'cta_subtitle', value: 'Reserva tu sesión de tatuaje de forma rápida y sencilla con nuestro sistema en tiempo real.' },
  { section: 'Llamados a la Acción', key_name: 'cta_button_text', value: 'RESERVAR SESIÓN AHORA' },
  { section: 'Contacto & Redes', key_name: 'contact_instagram_handle', value: '@inked.tto' },
  { section: 'Contacto & Redes', key_name: 'contact_instagram_url', value: 'https://www.instagram.com/inked.tto/' },
  { section: 'Contacto & Redes', key_name: 'contact_whatsapp', value: '+56 9 1234 5678' },
  { section: 'Contacto & Redes', key_name: 'contact_address', value: 'Rancagua, Región de O\'Higgins, Chile' },
  { section: 'Footer & Legal', key_name: 'footer_description', value: 'Estudio profesional de tatuajes y academia de formación artística en Rancagua. Calidad premium y bioseguridad certificada.' },
  { section: 'Footer & Legal', key_name: 'footer_copyright', value: '© 2026 INKED TATTOO STUDIO. Todos los derechos reservados.' }
]

// Friendly label helper
const getFriendlyKeyLabel = (keyName) => {
  const map = {
    hero_badge: 'Insignia / Badge Superior del Hero',
    hero_title: 'Título Principal del Hero',
    hero_subtitle: 'Subtítulo del Hero',
    hero_bio: 'Biografía / Descripción del Artista',
    cta_title: 'Título del Banner de Agendamiento',
    cta_subtitle: 'Subtítulo del Banner de Agendamiento',
    cta_button_text: 'Texto del Botón de Reserva',
    contact_instagram_handle: 'Usuario de Instagram',
    contact_instagram_url: 'Enlace Directo de Instagram',
    contact_whatsapp: 'Número de WhatsApp',
    contact_address: 'Dirección o Ubicación del Estudio',
    footer_description: 'Descripción del Pie de Página (Footer)',
    footer_copyright: 'Texto de Derechos Reservados (Copyright)'
  }
  return map[keyName] || keyName.replace(/_/g, ' ').toUpperCase()
}

export default function ConfiguracionPage() {
  const [configs, setConfigs] = useState([])
  const [originalConfigs, setOriginalConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [savingAll, setSavingAll] = useState(false)
  
  // Search & Filter
  const [search, setSearch] = useState('')
  const [selectedSection, setSelectedSection] = useState('all')
  const [showLivePreview, setShowLivePreview] = useState(true)

  // New config modal
  const [modalOpen, setModalOpen] = useState(false)
  const [newSection, setNewSection] = useState('Inicio')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  // Toast
  const [toast, setToast] = useState(null)
  const searchInputRef = useRef(null)
  const supabase = createClient()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Keyboard shortcut for saving changes (Ctrl+S)
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
      
      if (!error && data) {
        setConfigs(data)
        setOriginalConfigs(JSON.parse(JSON.stringify(data)))
      } else if (error) {
        console.error('Error fetching site_config:', error)
      }
    } catch (err) {
      console.error('Fetch exception:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check which configs have unsaved modifications
  const modifiedMap = configs.reduce((acc, c) => {
    const orig = originalConfigs.find(o => o.id === c.id)
    if (orig && orig.value !== c.value) {
      acc[c.id] = true
    }
    return acc
  }, {})

  const modifiedCount = Object.keys(modifiedMap).length

  // Update field value locally
  const handleChange = (id, value) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, value } : c))
  }

  // Save single configuration row
  const handleUpdate = async (id, newValue) => {
    setSavingId(id)
    try {
      const { error } = await supabase
        .from('site_config')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('id', id)
        
      if (!error) {
        setOriginalConfigs(prev => prev.map(o => o.id === id ? { ...o, value: newValue } : o))
        showToast('Texto guardado y sincronizado con éxito')
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
    const modifiedItems = configs.filter(c => modifiedMap[c.id])
    if (modifiedItems.length === 0) {
      showToast('No hay cambios pendientes por guardar', 'info')
      return
    }

    setSavingAll(true)
    try {
      for (const item of modifiedItems) {
        await supabase
          .from('site_config')
          .update({ value: item.value, updated_at: new Date().toISOString() })
          .eq('id', item.id)
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
  const handleRevertSingle = (id) => {
    const orig = originalConfigs.find(o => o.id === id)
    if (orig) {
      setConfigs(configs.map(c => c.id === id ? { ...c, value: orig.value } : c))
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
        const { error } = await supabase.from('site_config').delete().eq('id', id)
        if (!error) {
          setConfigs(configs.filter(c => c.id !== id))
          setOriginalConfigs(originalConfigs.filter(c => c.id !== id))
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
    
    // Check if key already exists
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

  // Seed default configurations if empty
  const handleSeedDefaults = async () => {
    if (!confirm('¿Deseas insertar los textos predeterminados del estudio? No sobrescribirá los ya existentes.')) {
      return
    }

    try {
      setLoading(true)
      let insertedCount = 0
      for (const item of DEFAULT_CONFIGS) {
        const exists = configs.some(c => c.key_name === item.key_name)
        if (!exists) {
          const { error } = await supabase.from('site_config').insert([item])
          if (!error) insertedCount++
        }
      }
      showToast(`¡Se insertaron ${insertedCount} parámetros iniciales!`)
      fetchConfigs()
    } catch (err) {
      showToast('Error al cargar datos predeterminados: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Sections extraction
  const sections = ['all', ...Array.from(new Set(configs.map(c => c.section).filter(Boolean)))]

  // Filtered configs
  const filteredConfigs = configs.filter(config => {
    const matchSearch = (config.key_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (config.value || '').toLowerCase().includes(search.toLowerCase()) ||
                        (config.section || '').toLowerCase().includes(search.toLowerCase()) ||
                        getFriendlyKeyLabel(config.key_name).toLowerCase().includes(search.toLowerCase())
    
    const matchSection = selectedSection === 'all' || config.section === selectedSection
    return matchSearch && matchSection
  })

  // Helper to find current value for preview
  const getConfigVal = (keyName, fallback = '') => {
    const item = configs.find(c => c.key_name === keyName)
    return item ? item.value : fallback
  }

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
          <h1 className={styles.title}>Configuración & Contenidos Web</h1>
          <p className={styles.subtitle}>
            Personaliza en tiempo real los textos, eslóganes, llamados a la acción e información institucional visibles en tu tienda y academia.
          </p>
        </div>

        <div className={styles.topActions}>
          <button 
            type="button" 
            onClick={() => setShowLivePreview(!showLivePreview)} 
            className={`${styles.btnSecondary} ${showLivePreview ? styles.btnActive : ''}`}
            title="Mostrar / Ocultar Vista Previa del Sitio"
          >
            {showLivePreview ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showLivePreview ? 'Ocultar Previa' : 'Ver Previa'}</span>
          </button>

          <button 
            type="button" 
            onClick={handleSeedDefaults} 
            className={styles.btnSecondary}
            title="Cargar catálogo de textos recomendados si faltan valores"
          >
            <Sparkles size={16} />
            <span>Cargar Textos Base</span>
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
          <span className={styles.metricLabel}>Secciones Activas</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{sections.filter(s => s !== 'all').length}</span>
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
          <span className={styles.metricLabel}>Estado de Sincronización</span>
          <div className={styles.metricValueWrap}>
            <span className={`${styles.metricValue} ${styles.textSuccess}`}>En Línea</span>
            <CheckCheck size={18} className={styles.metricIcon} />
          </div>
        </div>
      </div>

      {/* LIVE SIMULATED PREVIEW ACCORDION */}
      {showLivePreview && (
        <div className={styles.previewContainer}>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitleWrap}>
              <Sparkles size={16} className={styles.previewIcon} />
              <h4>Vista Previa en Vivo (Simulador Web)</h4>
            </div>
            <span className={styles.previewHint}>Los cambios que edites abajo se reflejan aquí de inmediato</span>
          </div>

          <div className={styles.previewMockup}>
            <div className={styles.mockupHero}>
              <div className={styles.mockupBadge}>
                {getConfigVal('hero_badge', 'TATTOO STUDIO & TATTOO SUPPLIES')}
              </div>
              <h2 className={styles.mockupTitle}>
                {getConfigVal('hero_title', 'ARTE EN TU PIEL')}
              </h2>
              <p className={styles.mockupSubtitle}>
                {getConfigVal('hero_subtitle', 'Cada tatuaje es una historia única, creada con pasión y precisión.')}
              </p>
              <div className={styles.mockupButtons}>
                <button className={styles.mockupBtnPrimary}>
                  {getConfigVal('cta_button_text', 'RESERVAR AHORA')}
                </button>
                <div className={styles.mockupIgTag}>
                  {getConfigVal('contact_instagram_handle', '@inked.tto')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODIFIED CHANGES BANNER */}
      {modifiedCount > 0 && (
        <div className={styles.changesStickyBar}>
          <div className={styles.changesInfo}>
            <AlertCircle size={18} className={styles.changesIcon} />
            <span>Tienes <strong>{modifiedCount}</strong> cambio(s) sin guardar en la configuración web.</span>
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
          <p>Prueba con otros términos de búsqueda o añade una nueva clave de configuración.</p>
          <button type="button" onClick={handleSeedDefaults} className={styles.btnAdd}>
            <Sparkles size={16} /> Cargar Textos Recomendados
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredConfigs.map((config) => {
            const isDirty = !!modifiedMap[config.id]
            const isSavingThis = savingId === config.id
            const isLongText = (config.value || '').length > 70 || (config.value || '').includes('\n')

            return (
              <div 
                key={config.id} 
                className={`${styles.card} ${isDirty ? styles.cardDirty : ''}`}
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
                    <label>Contenido del Texto:</label>
                    <span className={styles.charCount}>{(config.value || '').length} caracteres</span>
                  </div>

                  {isLongText ? (
                    <textarea 
                      className={`${styles.input} ${styles.textarea}`} 
                      rows={Math.min(6, Math.max(3, Math.ceil((config.value || '').length / 45)))}
                      value={config.value || ''}
                      onChange={(e) => handleChange(config.id, e.target.value)}
                      placeholder="Escribe el texto aquí..."
                    />
                  ) : (
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={config.value || ''}
                      onChange={(e) => handleChange(config.id, e.target.value)}
                      placeholder="Escribe el texto aquí..."
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
                        onClick={() => handleRevertSingle(config.id)} 
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
                    onClick={() => handleUpdate(config.id, config.value)}
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
                  <option value="Inicio">Inicio (Hero & Bio)</option>
                  <option value="Llamados a la Acción">Llamados a la Acción (CTA)</option>
                  <option value="Contacto & Redes">Contacto & Redes</option>
                  <option value="Footer & Legal">Footer & Legal</option>
                  <option value="Tienda">Tienda & Productos</option>
                  <option value="Academia">Academia & Cursos</option>
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
