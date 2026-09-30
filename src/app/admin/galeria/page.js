'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Image as ImageIcon, Video, User, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import styles from './galeria.module.css'

export default function MultimediaPage() {
  const [activeTab, setActiveTab] = useState('gallery_manual') // 'gallery_manual' | 'bio_photo'
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)

  // Foto de Biografía Pública
  const [bioPhotoUrl, setBioPhotoUrl] = useState(null)
  const [uploadingBioPhoto, setUploadingBioPhoto] = useState(false)
  const [bioMessage, setBioMessage] = useState(null)

  // Subida Galería
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaMessage, setMediaMessage] = useState(null)
  const [mediaType, setMediaType] = useState('IMAGE')

  const supabase = createClient()

  useEffect(() => {
    fetchBioPhoto()
    fetchGallery()
  }, [])

  const fetchBioPhoto = async () => {
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
  }

  const fetchGallery = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('instagram_cache')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setMedia(data)
    }
    setLoading(false)
  }

  const handleBioPhotoUpload = async (e) => {
    try {
      setUploadingBioPhoto(true)
      setBioMessage(null)

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `artist-biography-${Date.now()}.${fileExt}`
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
      setBioMessage({ type: 'success', text: '¡Foto de biografía pública actualizada!' })
    } catch (error) {
      console.error(error)
      setBioMessage({ type: 'error', text: error.message || 'Error al subir la imagen' })
    } finally {
      setUploadingBioPhoto(false)
    }
  }

  const handleManualMediaUpload = async (e) => {
    e.preventDefault()
    const fileInput = e.target.elements.mediaFile
    if (!fileInput.files || fileInput.files.length === 0) {
      setMediaMessage({ type: 'error', text: 'Por favor selecciona un archivo' })
      return
    }

    try {
      setUploadingMedia(true)
      setMediaMessage(null)

      const file = fileInput.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('instagram_cache')
        .insert({
          ig_id: `manual_${Date.now()}`,
          media_url: publicUrl,
          permalink: publicUrl,
          media_type: mediaType,
          created_at: new Date()
        })

      if (dbError) throw dbError

      setMediaMessage({ type: 'success', text: '¡Elemento publicado en la galería!' })
      e.target.reset()
      fetchGallery()
    } catch (err) {
      console.error(err)
      setMediaMessage({ type: 'error', text: err.message || 'Error al subir el elemento' })
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleDeleteMedia = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta foto/video de la galería?')) return
    const { error } = await supabase
      .from('instagram_cache')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchGallery()
    } else {
      alert('Error al eliminar elemento')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Galería & Multimedia</h1>
          <p className={styles.subtitle}>Sube y administra directamente los trabajos de tu portafolio y la foto de biografía</p>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            onClick={() => setActiveTab('gallery_manual')}
            className={styles.btnSync}
            style={{ background: activeTab === 'gallery_manual' ? 'var(--color-red)' : 'rgba(255,255,255,0.05)' }}
          >
            <ImageIcon size={16} /> Portafolio & Trabajos
          </button>
          <button 
            onClick={() => setActiveTab('bio_photo')}
            className={styles.btnSync}
            style={{ background: activeTab === 'bio_photo' ? 'var(--color-red)' : 'rgba(255,255,255,0.05)' }}
          >
            <User size={16} /> Foto Biografía Artista
          </button>
        </div>
      </div>

      {/* TAB 1: GALERIA SUBIDA MANUAL */}
      {activeTab === 'gallery_manual' && (
        <div>
          <div className={styles.infoBox} style={{ background: 'var(--color-bg-elevated)', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '30px' }}>
            <h3>Subir Nuevo Trabajo a la Galería</h3>
            <form onSubmit={handleManualMediaUpload} style={{ width: '100%', marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gray-400)', marginBottom: '6px' }}>Tipo de Archivo</label>
                  <select 
                    value={mediaType} 
                    onChange={e => setMediaType(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="IMAGE" style={{ background: '#111' }}>Imagen / Tatuaje</option>
                    <option value="VIDEO" style={{ background: '#111' }}>Video / Reel</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-gray-400)', marginBottom: '6px' }}>Seleccionar Archivo</label>
                  <input 
                    type="file" 
                    name="mediaFile"
                    accept={mediaType === 'VIDEO' ? 'video/*' : 'image/*'}
                    required
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '8px', color: '#fff', width: '100%' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.btnSync} 
                disabled={uploadingMedia}
                style={{ background: 'var(--color-red)', width: 'fit-content' }}
              >
                <Upload size={16} />
                {uploadingMedia ? 'Publicando...' : 'Publicar en Galería'}
              </button>

              {mediaMessage && (
                <div style={{ color: mediaMessage.type === 'success' ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>
                  {mediaMessage.text}
                </div>
              )}
            </form>
          </div>

          <h3 style={{ marginBottom: '15px' }}>Trabajos Publicados ({media.length})</h3>

          {loading ? (
            <div className={styles.loading}>Cargando galería...</div>
          ) : (
            <div className={styles.grid}>
              {media.length === 0 ? (
                <div className={styles.empty}>
                  No hay elementos en la galería. Sube tu primer tatuaje arriba.
                </div>
              ) : (
                media.map(item => (
                  <div key={item.id} className={styles.card}>
                    {item.media_type === 'VIDEO' ? (
                      <video src={item.media_url} autoPlay loop muted playsInline className={styles.media} />
                    ) : (
                      <img src={item.media_url} alt="Galería InkedSouh" className={styles.media} />
                    )}
                    <div className={styles.cardFooter} style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        {item.media_type === 'VIDEO' ? 'Video / Reel' : 'Tatuaje / Foto'}
                      </span>
                      <button 
                        onClick={() => handleDeleteMedia(item.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Eliminar de la Galería"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FOTO DE BIOGRAFIA PUBLICA */}
      {activeTab === 'bio_photo' && (
        <div className={styles.infoBox} style={{ background: 'var(--color-bg-elevated)', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h3>Foto de Perfil para la Biografía Pública</h3>
          <p style={{ color: 'var(--color-gray-400)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Esta foto es la que se muestra en la sección de biografía del artista InkedSouh en la web principal.
          </p>

          <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '180px', height: '180px', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              {bioPhotoUrl ? (
                <img src={bioPhotoUrl} alt="Foto Biografía Artista" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: '#666', textAlign: 'center', fontSize: '0.8rem' }}>
                  <ImageIcon size={32} />
                  <div>Sin Foto</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className={styles.btnSync} style={{ cursor: 'pointer', background: 'var(--color-red)' }}>
                <Upload size={16} />
                {uploadingBioPhoto ? 'Subiendo...' : 'Subir Nueva Foto de Biografía'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBioPhotoUpload}
                  disabled={uploadingBioPhoto}
                  style={{ display: 'none' }}
                />
              </label>
              {bioMessage && (
                <div style={{ color: bioMessage.type === 'success' ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>
                  {bioMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
