'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './registro.module.css'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear Cuenta</h1>
        <p className={styles.subtitle}>Regístrate para acceder a tus cursos</p>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4ade80', fontSize: '1.2rem', marginBottom: '15px' }}>
              ¡Registro exitoso!
            </div>
            <p style={{ color: '#888', marginBottom: '20px' }}>
              Revisa tu bandeja de entrada o spam para confirmar tu correo.
            </p>
            <Link href="/login" className={styles.button} style={{ display: 'block', textDecoration: 'none' }}>
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.inputGroup}>
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="tu@correo.com"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Mínimo 6 caracteres"
                minLength="6"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        )}

        <div className={styles.loginLink}>
          ¿Ya tienes cuenta? <Link href="/login">Inicia Sesión aquí</Link>
        </div>
      </div>
    </div>
  )
}
