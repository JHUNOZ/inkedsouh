'use client'
// Login Admin — Diseño split (formulario + visual)
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'
import SparklesBg from '@/components/home/SparklesBg'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Error al obtener usuario')

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = roleData?.role || 'estudiante'

      if (role === 'admin') {
        window.location.href = '/admin/resumen'
      } else {
        window.location.href = '/estudiante'
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Lado izquierdo — Formulario */}
      <div className={styles.formSide}>
        <div className={styles.formInner}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Sitio Web
          </Link>

          {/* Logo */}
          <div className={styles.logo}>
            INKED<span className={styles.logoAccent}>SOUH</span>
          </div>
          <h1 className={styles.title}>Plataforma</h1>
          <p className={styles.subtitle}>Ingreso a tu cuenta</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email de Acceso</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className={styles.togglePass}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <AlertCircle size={18} />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Entrar'}
              {!loading && <span className={styles.btnLine}>—</span>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>¿No tienes cuenta? </span>
            <Link href="/registro" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>Regístrate aquí</Link>
          </div>

          <p className={styles.credits} style={{ marginTop: '30px' }}>© INKEDSOUH</p>
        </div>
      </div>

      {/* Lado derecho — Visual con logo grande */}
      <div className={styles.visualSide}>
        <SparklesBg count={40} />
        <div className={styles.visualGlow} />
        <div className={styles.visualContent}>
          {/* Aquí irá el logo próximamente */}
        </div>
        {/* Esquina decorativa */}
        <div className={styles.visualCorner} />
      </div>
    </div>
  )
}
