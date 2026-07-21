'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './perfil.module.css'

export default function PerfilPage() {
  const [user, setUser] = useState(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: '' }
  
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mi Perfil</h1>
        <p className={styles.subtitle}>Configura tu cuenta de administrador</p>
      </div>

      <div className={styles.card}>
        <div className={styles.formGroup} style={{ marginBottom: '30px' }}>
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
  )
}
