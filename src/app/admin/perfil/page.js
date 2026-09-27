'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Camera, Save, ShieldCheck } from 'lucide-react'
import styles from './perfil.module.css'

export default function PerfilPage() {
  const [user, setUser] = useState(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Admin Avatar Photo State (Solo para el panel de administración)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoMessage, setPhotoMessage] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUser()
    fetchAdminAvatar()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchAdminAvatar = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_avatar_photo')
      .single()
    
    if (data && data.value) {
      setPhotoUrl(data.value.url)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente!' })
      setPassword('')
    }
    setLoading(false)
  }

  const handlePhotoUpload = async (e) => {
    try {
      setUploadingPhoto(true)
      setPhotoMessage(null)

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `admin-avatar-${Date.now()}.${fileExt}`
      const filePath = `profile/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)

      const { error: settingsError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'admin_avatar_photo', 
          value: { url: publicUrl },
          updated_at: new Date()
        }, { onConflict: 'key' })

      if (settingsError) throw settingsError

      setPhotoUrl(publicUrl)
      setPhotoMessage({ type: 'success', text: 'Avatar de administrador actualizado' })
    } catch (error) {
      console.error(error)
      setPhotoMessage({ type: 'error', text: error.message || 'Error al subir la imagen' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mi Perfil de Administrador</h1>
        <p className={styles.subtitle}>Configura tu cuenta privada de acceso al panel</p>
      </div>

      <div className={styles.grid}>
        {/* Foto de Perfil del Admin */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Avatar del Administrador</h2>
          <p className={styles.cardDesc}>Foto de perfil exclusiva para la cuenta en el panel de control.</p>

          <div className={styles.photoSection}>
            <div className={styles.photoPreview}>
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar Admin" className={styles.image} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <Camera size={32} />
                  <span>Sin Avatar</span>
                </div>
              )}
            </div>
            
            <div className={styles.uploadControls}>
              <label className={styles.uploadBtn}>
                <Upload size={16} />
                {uploadingPhoto ? 'Subiendo...' : 'Subir Foto de Avatar'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  style={{ display: 'none' }}
                />
              </label>
              
              {photoMessage && (
                <div className={`${styles.message} ${photoMessage.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                  {photoMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Seguridad y Acceso</h2>
          <p className={styles.cardDesc}>Actualiza la contraseña de acceso a tu cuenta.</p>
          
          <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
            <label>Correo Electrónico Actual</label>
            <input 
              type="text" 
              className={styles.input} 
              value={user?.email || 'Cargando...'} 
              disabled 
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
            <small style={{ color: '#888', marginTop: '4px' }}>El correo de administrador no se puede cambiar por seguridad.</small>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div className={styles.formGroup}>
              <label>Nueva Contraseña</label>
              <input 
                type="password" 
                className={styles.input} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
              />
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={loading || !password}>
              <Save size={16} />
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>

            {message && (
              <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                {message.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
