'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ShieldCheck, BookOpen, ArrowLeft } from 'lucide-react'
import styles from './checkout.module.css'

export default function CheckoutPage({ params }) {
  const [course, setCourse] = useState(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCourse()
  }, [])

  const fetchCourse = async () => {
    const { id } = await params
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) setCourse(data)
    setLoadingCourse(false)
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (authError) {
      // If user already exists, we might need to handle it or show error
      setError('Error al registrar: ' + authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id

    if (userId) {
      // 2. Add them to students table automatically (simulating a successful payment)
      const { error: studentError } = await supabase
        .from('students')
        .insert([{
          user_id: userId,
          course_id: course.id,
          name: name,
          email: email,
          status: 'activo'
        }])

      if (studentError) {
        // Ignoramos errores si ya está inscrito
        console.error('Error insertando en students:', studentError)
      }

      // 3. Redirect to student portal
      router.push('/estudiante')
    } else {
      setError('Ocurrió un error inesperado al procesar el registro.')
      setLoading(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)

  if (loadingCourse) {
    return (
      <>
        <Navbar />
        <div className={styles.page} style={{ textAlign: 'center', paddingTop: '150px' }}>
          Cargando detalles de compra...
        </div>
        <Footer />
      </>
    )
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className={styles.page} style={{ textAlign: 'center', paddingTop: '150px' }}>
          <h2>Curso no encontrado</h2>
          <Link href="/cursos" style={{ color: 'var(--color-primary)' }}>Volver a Cursos</Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          
          {/* Formulario de Checkout */}
          <div className={styles.formSection}>
            <Link href="/cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#888', textDecoration: 'none', marginBottom: '20px' }}>
              <ArrowLeft size={16} /> Volver
            </Link>
            
            <h1 className={styles.title}>Crea tu cuenta</h1>
            <p className={styles.subtitle}>Para acceder al curso, necesitamos crear tu perfil de estudiante.</p>

            <form onSubmit={handleCheckout}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className={styles.input}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className={styles.input}
                  placeholder="tu@correo.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Contraseña para tu cuenta</label>
                <input 
                  type="password" 
                  required 
                  minLength="6"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={styles.input}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Procesando...' : 'Obtener Curso y Registrarme'}
              </button>
            </form>
          </div>

          {/* Resumen del Pedido */}
          <div className={styles.summarySection}>
            <h2 style={{ marginBottom: '20px' }}>Resumen del Pedido</h2>
            
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} className={styles.courseImage} />
            ) : (
              <div className={styles.courseImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={48} color="#888" />
              </div>
            )}
            
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>{course.description}</p>

            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Total a pagar</span>
              <span className={styles.priceValue}>{formatPrice(course.price)}</span>
            </div>

            <div className={styles.secureNotice}>
              <ShieldCheck size={18} color="#4ade80" />
              <span>Acceso inmediato y seguro</span>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
