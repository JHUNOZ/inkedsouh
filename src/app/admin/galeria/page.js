'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  UploadCloud, Trash2, Image as ImageIcon, Video, User, Check, 
  AlertTriangle, RefreshCw, Plus, Sparkles, Eye, Film, Layers 
} from 'lucide-react'
import styles from './galeria.module.css'

export default function MultimediaPage() {
  const [activeTab, setActiveTab] = useState('gallery_manual') // 'gallery_manual' | 'bio_photo'
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)

  // Subida de Trabajo Individual
  const [mediaType, setMediaType] = useState('IMAGE') // 'IMAGE' | 'VIDEO'
  const [category, setCategory] = useState('Blackwork')
  const [title, setTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Foto de Biografía
  const [bioPhotoUrl, setBioPhotoUrl] = useState(null)
  const [uploadingBioPhoto, setUploadingBioPhoto] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const bioInputRef = useRef(null)
  const supabase = createClient()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchBioPhoto()
    fetchGallery()
  }, [])

  const fetchBioPhoto = async () => {
    try {
      const { data } = await supabase
        .from('site_config')
        .select('value')
        .eq('key_name', 'artist_photo')
        .maybeSingle()
      
      if (data && data.value) {
        try {
          const parsed = JSON.parse(data.value)
          setBioPhotoUrl(parsed.url || data.value)
        } catch {
          setBioPhotoUrl(data.value)
        }
      }
    } catch (err) {
      console.error('Error fetching bio photo:', err)
    }
  }

  const fetchGallery = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('instagram_cache')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setMedia(data)
      }
    } catch (err) {
      console.error('Error fetching gallery:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle local file selection with preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    
    // Auto-detect media type if possible
    if (file.type.startsWith('video/')) {
      setMediaType('VIDEO')
    } else {
      setMediaType('IMAGE')
    }

    if (!title) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      setTitle(cleanName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    }
  }

  // Upload new work
  const handlePublishWork = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      showToast('Por favor selecciona una foto o video', 'error')
      return
    }

    try {
      setUploadingMedia(true)

      const fileExt = selectedFile.name.split('.').pop()
      const cleanFileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`
      const filePath = `gallery/${cleanFileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      // Format title and category in permalink or structured text
      const workMetadata = JSON.stringify({
        title: title.trim() || 'Obra InkedSouh',
        category: category || 'Tatuaje',
        type: mediaType
      })

      const { error: dbError } = await supabase
        .from('instagram_cache')
        .insert({
          ig_id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          media_url: publicUrl,
          permalink: workMetadata,
          media_type: mediaType,
          created_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      showToast('¡Obra publicada en la galería y sincronizada con la web!')
      setSelectedFile(null)
      setPreviewUrl(null)
      setTitle('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchGallery()
    } catch (err) {
      console.error(err)
      showToast('Error al publicar: ' + err.message, 'error')
    } finally {
      setUploadingMedia(false)
    }
  }

  // Delete media item
  const handleDeleteMedia = async (id) => {
    if (!confirm('¿Deseas eliminar definitivamente este elemento de la galería?')) return
    try {
      const { error } = await supabase
        .from('instagram_cache')
        .delete()
        .eq('id', id)

      if (!error) {
        setMedia(media.filter(m => m.id !== id))
        showToast('Elemento eliminado de la galería')
      } else {
        showToast('Error al eliminar: ' + error.message, 'error')
      }
    } catch (err) {
      showToast('Error al procesar eliminación', 'error')
    }
  }

  // Upload Bio Photo
  const handleBioPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingBioPhoto(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `artist_bio_${Date.now()}.${fileExt}`
      const filePath = `profile/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      const { error: settingsError } = await supabase
        .from('site_config')
        .upsert({ 
          section: 'Biografía & Artista',
          key_name: 'artist_photo', 
          value: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key_name' })

      if (settingsError) throw settingsError

      setBioPhotoUrl(publicUrl)
      showToast('¡Foto oficial del artista actualizada!')
    } catch (error) {
      showToast('Error al subir foto: ' + error.message, 'error')
    } finally {
      setUploadingBioPhoto(false)
    }
  }

  // Helper to parse item details
  const getItemDetails = (item) => {
    let itemTitle = 'Tatuaje InkedSouh'
    let itemCategory = 'Tatuaje'
    
    if (item.permalink) {
      try {
        if (item.permalink.startsWith('{')) {
          const parsed = JSON.parse(item.permalink)
          if (parsed.title) itemTitle = parsed.title
          if (parsed.category) itemCategory = parsed.category
        } else if (!item.permalink.startsWith('http')) {
          itemTitle = item.permalink
        }
      } catch {
        itemTitle = item.permalink
      }
    }

    return { title: itemTitle, category: itemCategory }
  }

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.brandBadge}>INKED CONTROL</span>
            <span className={styles.versionBadge}>PORTAFOLIO V1.0</span>
          </div>
          <h1 className={styles.title}>Gestión de Galería & Portafolio</h1>
          <p className={styles.subtitle}>
            Sube fotos y videos especificando su categoría y estilo para que aparezcan en el carrusel de inicio y en la galería completa.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabGroup}>
          <button 
            type="button"
            onClick={() => setActiveTab('gallery_manual')}
            className={`${styles.tabBtn} ${activeTab === 'gallery_manual' ? styles.tabBtnActive : ''}`}
          >
            <ImageIcon size={16} />
            <span>Portafolio ({media.length})</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('bio_photo')}
            className={`${styles.tabBtn} ${activeTab === 'bio_photo' ? styles.tabBtnActive : ''}`}
          >
            <User size={16} />
            <span>Foto Biografía</span>
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD & MANAGE GALLERY */}
      {activeTab === 'gallery_manual' && (
        <div className={styles.tabContent}>
          {/* UPLOAD CARD */}
          <div className={styles.uploadCard}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#ff2a3d' }} />
                <h3>Publicar Nueva Obra o Video</h3>
              </div>
              <span className={styles.headerHint}>Se sincronizará en tiempo real con la web</span>
            </div>

            <form onSubmit={handlePublishWork} className={styles.uploadForm}>
              <div className={styles.formGrid}>
                {/* 1. Tipo de Archivo */}
                <div className={styles.formGroup}>
                  <label>Tipo de Multimedia *</label>
                  <div className={styles.typeToggle}>
                    <button
                      type="button"
                      onClick={() => setMediaType('IMAGE')}
                      className={`${styles.typeBtn} ${mediaType === 'IMAGE' ? styles.typeBtnActive : ''}`}
                    >
                      <ImageIcon size={16} />
                      <span>Fotografía / Tatuaje</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('VIDEO')}
                      className={`${styles.typeBtn} ${mediaType === 'VIDEO' ? styles.typeBtnActive : ''}`}
                    >
                      <Film size={16} />
                      <span>Video / Reel</span>
                    </button>
                  </div>
                </div>

                {/* 2. Categoría / Estilo */}
                <div className={styles.formGroup}>
                  <label>Categoría / Estilo del Trabajo *</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className={styles.select}
                  >
                    <option value="Blackwork">Blackwork</option>
                    <option value="Realismo">Realismo Sombras</option>
                    <option value="Lettering">Lettering & Caligrafía</option>
                    <option value="Fine Line">Fine Line / Línea Fina</option>
                    <option value="Neotradicional">Neotradicional</option>
                    <option value="Geometría & Puntillismo">Geometría & Puntillismo</option>
                    <option value="Video Reel">Video Reel / Proceso</option>
                    <option value="Estudio & Sesiones">Estudio & Sesiones</option>
                    <option value="Tatuaje">Tatuaje General</option>
                  </select>
                </div>

                {/* 3. Título o Descripción */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Título o Descripción de la Obra *</label>
                  <input 
                    type="text" 
                    placeholder="ej: Manga Japonesa Samurai, Dragón Sombras, etc." 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className={styles.input}
                    required
                  />
                </div>

                {/* 4. Selector de Archivo con Dropzone */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Archivo Multimedia ({mediaType === 'VIDEO' ? 'MP4, WEBM' : 'JPG, PNG, WEBP'}) *</label>
                  
                  <div 
                    className={styles.dropzone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className={styles.previewContainer}>
                        {mediaType === 'VIDEO' ? (
                          <video src={previewUrl} controls className={styles.previewMedia} />
                        ) : (
                          <img src={previewUrl} alt="Vista previa" className={styles.previewMedia} />
                        )}
                        <span className={styles.changeFileBtn}>Cambiar Archivo</span>
                      </div>
                    ) : (
                      <div className={styles.dropzonePrompt}>
                        <UploadCloud size={40} className={styles.dropIcon} />
                        <h4>Haz clic para seleccionar tu {mediaType === 'VIDEO' ? 'video' : 'foto'}</h4>
                        <p>Sube el archivo en alta definición para el portafolio</p>
                      </div>
                    )}

                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept={mediaType === 'VIDEO' ? 'video/*' : 'image/*'}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button 
                  type="submit" 
                  className={styles.btnPublish} 
                  disabled={uploadingMedia || !selectedFile}
                >
                  {uploadingMedia ? (
                    <>
                      <RefreshCw size={16} className={styles.spin} />
                      <span>Subiendo y Publicando...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>Publicar en Portafolio Web</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* PUBLISHED ITEMS GRID */}
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3>Obras Publicadas por el Administrador ({media.length})</h3>
              <p>Estas imágenes y videos se visualizan en el carrusel de inicio y en la sección /galeria.</p>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <RefreshCw size={28} className={styles.spin} />
                <p>Cargando galería de Supabase...</p>
              </div>
            ) : media.length === 0 ? (
              <div className={styles.emptyBox}>
                <ImageIcon size={44} style={{ color: '#ff2a3d', opacity: 0.6 }} />
                <h4>Aún no has subido obras personalizadas</h4>
                <p>Utiliza el formulario de arriba para publicar tu primera fotografía o video en el portafolio.</p>
              </div>
            ) : (
              <div className={styles.mediaGrid}>
                {media.map((item) => {
                  const details = getItemDetails(item)
                  const isVideo = item.media_type === 'VIDEO'

                  return (
                    <div key={item.id} className={styles.mediaCard}>
                      <div className={styles.mediaThumbWrap}>
                        {isVideo ? (
                          <video src={item.media_url} muted loop className={styles.mediaThumb} />
                        ) : (
                          <img src={item.media_url} alt={details.title} className={styles.mediaThumb} />
                        )}
                        
                        <span className={`${styles.typeBadge} ${isVideo ? styles.typeBadgeVideo : styles.typeBadgeImg}`}>
                          {isVideo ? 'VIDEO / REEL' : 'TATUAJE'}
                        </span>
                      </div>

                      <div className={styles.mediaCardBody}>
                        <span className={styles.cardCategory}>{details.category}</span>
                        <h4 className={styles.cardTitle}>{details.title}</h4>
                        <span className={styles.cardDate}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('es-CL') : 'Reciente'}
                        </span>
                      </div>

                      <div className={styles.mediaCardActions}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteMedia(item.id)}
                          className={styles.btnDelete}
                          title="Eliminar de la galería"
                        >
                          <Trash2 size={15} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BIO PHOTO */}
      {activeTab === 'bio_photo' && (
        <div className={styles.tabContent}>
          <div className={styles.uploadCard}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: '#ff2a3d' }} />
                <h3>Foto de Perfil / Biografía Pública</h3>
              </div>
              <span className={styles.headerHint}>Aparece en el Hero de inicio y en la sección Biografía</span>
            </div>

            <div className={styles.bioPhotoSection}>
              <div className={styles.bioAvatarWrap}>
                {bioPhotoUrl ? (
                  <img src={bioPhotoUrl} alt="Artista" className={styles.bioAvatarImg} />
                ) : (
                  <div className={styles.bioAvatarPlaceholder}>
                    <User size={64} />
                    <span>Sin Foto</span>
                  </div>
                )}
              </div>

              <div className={styles.bioPhotoActions}>
                <h4>Actualizar Foto del Artista</h4>
                <p>Sube una fotografía en formato vertical o cuadrado (JPG, PNG) para mostrar en tu biografía oficial.</p>

                <button 
                  type="button"
                  onClick={() => bioInputRef.current?.click()}
                  className={styles.btnPublish}
                  disabled={uploadingBioPhoto}
                >
                  {uploadingBioPhoto ? (
                    <>
                      <RefreshCw size={16} className={styles.spin} />
                      <span>Subiendo Foto...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>Seleccionar y Guardar Foto</span>
                    </>
                  )}
                </button>

                <input 
                  type="file" 
                  ref={bioInputRef}
                  accept="image/*"
                  onChange={handleBioPhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
