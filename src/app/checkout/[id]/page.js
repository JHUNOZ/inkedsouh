'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ShieldCheck, BookOpen, ArrowLeft, CreditCard, Lock, ArrowRight } from 'lucide-react'
import styles from './checkout.module.css'

export default function CheckoutPage() {
  const params = useParams()
  const courseIdParam = params?.id
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
    if (courseIdParam) {
      fetchCourse(courseIdParam)
    }
    loadCurrentUser()
  }, [courseIdParam])

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email) setEmail(user.email)
        if (user.user_metadata?.name) setName(user.user_metadata.name)
      }
    } catch {}
  }

  const fetchCourse = async (id) => {
    try {
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

  const getFinalCoursePrice = (c) => {
    if (!c) return 0
    const basePrice = Number(c.price) || 0
    const disc = Number(c.discount) || 0
    if (disc > 0 && disc < 100) {
      return Math.round(basePrice * (1 - disc / 100))
    }
    return basePrice
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create or verify Supabase student account (non-blocking if rate limited)
      let userId = null
      try {
        const { data: { user: existingSessionUser } } = await supabase.auth.getUser()
        if (existingSessionUser && existingSessionUser.email?.toLowerCase() === email.trim().toLowerCase()) {
          userId = existingSessionUser.id
        } else {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: name.trim()
              }
            }
          })

          if (authError) {
            if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
              })
              if (signInData?.user?.id) {
                userId = signInData.user.id
              }
            } else {
              console.warn('Aviso al crear cuenta de estudiante en checkout:', authError.message)
            }
          } else {
            userId = authData?.user?.id || null
          }
        }
      } catch (authEx) {
        console.warn('Excepción no bloqueante en Auth:', authEx)
      }

      const finalAmount = getFinalCoursePrice(course)

      // 2. Generate Flow Payment Order
      const res = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'course',
          courseId: course.id,
          courseTitle: course.title,
          amount: finalAmount,
          customer: {
            name: name.trim(),
            email: email.trim()
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
  const finalPrice = getFinalCoursePrice(course)

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
          <Link href="/cursos" style={{ color: '#E11D48', marginTop: '10px', display: 'inline-block', fontWeight: 600 }}>
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
            <Link href="/cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
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
                    <Lock size={16} color="#10B981" />
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
                    <span>Pagar con Flow ({formatPrice(finalPrice)})</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resumen del Pedido */}
          <div className={styles.summarySection}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', color: '#0F172A' }}>
              Resumen de Compra
            </h2>
            
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} className={styles.courseImage} />
            ) : (
              <div className={styles.courseImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={48} color="#64748B" />
              </div>
            )}
            
            <h3 className={styles.courseTitle}>{course.title}</h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.5' }}>{course.description}</p>

            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Total a pagar</span>
              <span className={styles.priceValue}>{formatPrice(finalPrice)}</span>
            </div>

            <div className={styles.secureNotice}>
              <ShieldCheck size={18} color="#10B981" />
              <span>Acceso de por vida, certificado y soporte directo</span>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
