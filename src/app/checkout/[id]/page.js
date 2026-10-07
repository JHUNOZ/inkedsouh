'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ShieldCheck, BookOpen, ArrowLeft, CreditCard, Lock, ArrowRight } from 'lucide-react'
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
    try {
      const resolvedParams = await params
      const id = resolvedParams.id
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      
      if (data) setCourse(data)
    } catch (err) {
      console.error('Error fetching course:', err)
    } finally {
      setLoadingCourse(false)
    }
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create or verify Supabase student account
      let userId = null
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
        // If user already registered, attempt login with entered password
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          if (signInError) {
            setError('Este correo ya está registrado. Por favor ingresa tu contraseña correcta para continuar.')
            setLoading(false)
            return
          }
          userId = signInData.user?.id
        } else {
          setError('Error al registrar cuenta: ' + authError.message)
          setLoading(false)
          return
        }
      } else {
        userId = authData.user?.id
      }

      // 2. Generate Flow Payment Order
      const res = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'course',
          courseId: course.id,
          courseTitle: course.title,
          amount: course.price,
          customer: {
            name,
            email
          },
          userId
        })
      })

      const paymentResult = await res.json()

      if (!res.ok || !paymentResult.success) {
        throw new Error(paymentResult.error || 'No se pudo iniciar la pasarela de pago Flow.')
      }

      // 3. Redirect to Flow Gateway or Return Page
      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl
      } else {
        router.push(`/checkout/flow-return?order=${paymentResult.orderNumber}&token=${paymentResult.token}`)
      }

    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Ocurrió un error inesperado al procesar la compra.')
      setLoading(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0)

  if (loadingCourse) {
    return (
      <>
        <Navbar />
        <div className={styles.page} style={{ textAlign: 'center', paddingTop: '150px' }}>
          <p>Cargando detalles del curso...</p>
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
          <Link href="/cursos" style={{ color: '#ff2a3d', marginTop: '10px', display: 'inline-block' }}>
            Volver a Cursos
          </Link>
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
            <Link href="/cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#888', textDecoration: 'none', marginBottom: '20px', fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Volver a cursos
            </Link>
            
            <h1 className={styles.title}>Matricúlate en el Curso</h1>
            <p className={styles.subtitle}>Crea tu cuenta de estudiante y accede al aula virtual de por vida.</p>

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
                  autoComplete="name"
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
                  autoComplete="email"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Contraseña para tu cuenta de estudiante</label>
                <input 
                  type="password" 
                  required 
                  minLength="6"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>

              {/* Selector de Pasarela Flow */}
              <div className={styles.paymentGatewayBox}>
                <div className={styles.paymentGatewayHeader}>
                  <div className={styles.paymentGatewayTitle}>
                    <Lock size={16} color="#4ade80" />
                    <span>Pago Seguro en Línea</span>
                  </div>
                  <span className={styles.flowBadge}>Flow Chile</span>
                </div>
                <div className={styles.paymentLogos}>
                  <span className={styles.paymentPill}>💳 Webpay Plus</span>
                  <span className={styles.paymentPill}>🟣 Mach</span>
                  <span className={styles.paymentPill}>🟦 Redcompra</span>
                  <span className={styles.paymentPill}>🟡 Servipag</span>
                  <span className={styles.paymentPill}>⚡ Klap</span>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Conectando con Flow...' : (
                  <>
                    <span>Pagar con Flow ({formatPrice(course.price)})</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resumen del Pedido */}
          <div className={styles.summarySection}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Resumen de Compra
            </h2>
            
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} className={styles.courseImage} />
            ) : (
              <div className={styles.courseImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={48} color="#555" />
              </div>
            )}
            
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: '1.5' }}>{course.description}</p>

            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Total a pagar</span>
              <span className={styles.priceValue}>{formatPrice(course.price)}</span>
            </div>

            <div className={styles.secureNotice}>
              <ShieldCheck size={18} color="#4ade80" />
              <span>Acceso de por vida, certificado y soporte directo</span>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
