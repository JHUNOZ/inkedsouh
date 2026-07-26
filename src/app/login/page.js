'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, User as UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import SparklesBg from '@/components/home/SparklesBg'
import styles from './login.module.css'

export default function LoginPage() {
  // Login State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Register State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const handleLoginSubmit = async (e) => {
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
      if (authError) throw authError
      
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
      setError('Credenciales inválidas o error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setRegLoading(true)
    setRegError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPass,
        options: {
          data: { name: regName, role: 'estudiante' }
        }
      })

      if (signUpError) throw signUpError
      window.location.href = '/estudiante'
    } catch (err) {
      setRegError(err.message)
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Lado izquierdo — Formulario de Login */}
      <div className={styles.formSide}>
        <motion.div 
          className={styles.formInner}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.backLinkWrap}>
            <Link href="/" className={`${styles.backLink} interactive magnetic`}>
              <ArrowLeft size={16} />
              Volver al Sitio Web
            </Link>
          </div>

          {/* Logo */}
          <div className={styles.logo}>
            INKED<span className={styles.logoAccent}>SOUH</span>
          </div>
          <h1 className={styles.title}>Plataforma</h1>
          <p className={styles.subtitle}>Ingreso a tu cuenta</p>

          <form onSubmit={handleLoginSubmit} className={styles.form}>
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
                  className={`${styles.togglePass} interactive`}
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
              className={`${styles.submitBtn} interactive magnetic`}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Entrar'}
              {!loading && <span className={styles.btnLine}>—</span>}
            </button>
          </form>

          <p className={styles.credits} style={{ marginTop: '50px' }}>© INKEDSOUH</p>
        </motion.div>
      </div>

      {/* Lado derecho — Visual & Formulario de Registro */}
      <div className={styles.visualSide}>
        <SparklesBg count={40} />
        <div className={styles.visualGlow} />
        
        <motion.div 
          className={styles.registerCard}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className={styles.registerHeader}>
            <h3>¿Accedes a un curso?</h3>
            <p>Regístrate aquí para comenzar tu aprendizaje</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className={styles.registerForm}>
            <div className={styles.inputWrapCompact}>
              <UserIcon size={14} className={styles.inputIcon} />
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nombre completo"
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.inputWrapCompact}>
              <Mail size={14} className={styles.inputIcon} />
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Correo electrónico"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputWrapCompact}>
              <Lock size={14} className={styles.inputIcon} />
              <input
                type={showRegPass ? 'text' : 'password'}
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="Contraseña"
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowRegPass(!showRegPass)}
                className={`${styles.togglePass} interactive`}
              >
                {showRegPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {regError && (
              <div className={styles.errorCompact}>
                <AlertCircle size={14} />
                <p>{regError}</p>
              </div>
            )}

            <button
              type="submit"
              className={`${styles.registerBtn} interactive`}
              disabled={regLoading}
            >
              {regLoading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
