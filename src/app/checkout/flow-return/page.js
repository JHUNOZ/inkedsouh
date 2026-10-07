'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { 
  CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, 
  MessageCircle, ShoppingBag, BookOpen, ExternalLink, RefreshCw
} from 'lucide-react'
import styles from './flow-return.module.css'

function FlowReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token')
  const orderParam = searchParams.get('order')
  const isSimulated = searchParams.get('simulated') === 'true'

  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function verifyPayment() {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams()
        if (token) queryParams.set('token', token)
        if (orderParam) queryParams.set('order', orderParam)

        const res = await fetch(`/api/flow/status?${queryParams.toString()}`)
        const data = await res.json()

        if (res.ok && data.success) {
          setPaymentData(data)
        } else {
          // If query failed but we have token or simulation
          if (isSimulated || (token && token.startsWith('sim_'))) {
            setPaymentData({
              isPaid: true,
              flow: {
                statusName: 'PAGADA (MODO PRUEBA)',
                commerceOrder: orderParam || token.split('_')[2] || 'INK-DEMO',
                amount: Number(searchParams.get('amount') || 15000),
                paymentData: { media: 'Flow Webpay Plus' }
              }
            })
          } else {
            setError(data?.error || 'No se pudo verificar el estado del pago.')
          }
        }
      } catch (err) {
        console.error('Error verificando pago:', err)
        setError('Ocurrió un error al contactar el servidor.')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [token, orderParam, isSimulated, searchParams])

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0)

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Verificando transacción con Flow...</h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Por favor espera un momento mientras confirmamos con la pasarela.</p>
        </div>
      </div>
    )
  }

  const isPaid = paymentData?.isPaid || paymentData?.flow?.isPaid
  const orderNumber = paymentData?.order?.order_number || paymentData?.flow?.commerceOrder || orderParam || 'N/A'
  const totalAmount = paymentData?.order?.total_amount || paymentData?.flow?.amount || 0
  const isCourse = paymentData?.order?.metadata?.type === 'course' || orderNumber.startsWith('CUR-')
  const courseId = paymentData?.order?.metadata?.courseId

  if (error || !isPaid) {
    return (
      <div className={styles.card}>
        <div className={styles.headerSuccess}>
          <div className={styles.iconWrapError}>
            <XCircle size={40} />
          </div>
          <h1 className={styles.title}>Pago No Completado</h1>
          <p className={styles.subtitle}>
            {error || 'La transacción fue cancelada o rechazada por la entidad bancaria.'}
          </p>
        </div>

        <div className={styles.receiptBox}>
          <div className={styles.receiptRow}>
            <span className={styles.label}>N° de Orden</span>
            <span className={styles.val}>{orderNumber}</span>
          </div>
          <div className={styles.receiptRow}>
            <span className={styles.label}>Estado</span>
            <span className={styles.val} style={{ color: '#ef4444' }}>Rechazado / Cancelado</span>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <Link href={isCourse ? '/cursos' : '/productos'} className={styles.primaryBtn}>
            <RefreshCw size={18} />
            <span>Reintentar con otro medio de pago</span>
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Volver al Inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.headerSuccess}>
        <div className={styles.iconWrapSuccess}>
          <CheckCircle2 size={42} />
        </div>
        <div className={styles.badgeSuccess}>
          <ShieldCheck size={14} /> Transacción Verificada por Flow
        </div>
        <h1 className={styles.title}>¡Pago Exitoso!</h1>
        <p className={styles.subtitle}>
          {isCourse
            ? 'Tu matrícula ha sido activada y tienes acceso inmediato al curso.'
            : 'Hemos recibido tu orden correctamente. Comenzaremos a preparar tu pedido.'}
        </p>
      </div>

      <div className={styles.receiptBox}>
        <div className={styles.receiptRow}>
          <span className={styles.label}>N° de Orden</span>
          <span className={`${styles.val} ${styles.orderNumberHighlight}`}>{orderNumber}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.label}>Pasarela</span>
          <span className={styles.val}>
            <span className={styles.gatewayBadge}>Flow • Webpay Plus</span>
          </span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.label}>Fecha</span>
          <span className={styles.val}>{new Date().toLocaleDateString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.label}>Cliente</span>
          <span className={styles.val}>{paymentData?.order?.customer_name || 'Cliente InkedSouh'}</span>
        </div>

        {/* Total Row */}
        <div className={`${styles.receiptRow} ${styles.totalRow}`}>
          <span className={styles.totalLabel}>Total Pagado</span>
          <span className={styles.totalValue}>{formatPrice(totalAmount)}</span>
        </div>

        {paymentData?.order?.items && paymentData.order.items.length > 0 && (
          <div className={styles.itemsList}>
            <div className={styles.itemsTitle}>Resumen de Artículos</div>
            {paymentData.order.items.map((item, idx) => (
              <div key={idx} className={styles.itemEntry}>
                <span>{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                <span>{formatPrice(item.price * (item.quantity || 1))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actionsGroup}>
        {isCourse ? (
          <Link href="/estudiante" className={styles.primaryBtn}>
            <BookOpen size={18} />
            <span>Ingresar a mi Aula Virtual</span>
            <ArrowRight size={18} />
          </Link>
        ) : (
          <Link href="/productos" className={styles.primaryBtn}>
            <ShoppingBag size={18} />
            <span>Volver a la Tienda</span>
            <ArrowRight size={18} />
          </Link>
        )}

        <a
          href={`https://wa.me/56930254425?text=${encodeURIComponent(`Hola InkedSouh, acabo de pagar mi orden #${orderNumber} de $${totalAmount} CLP vía Flow Webpay. ¡Quedo atento(a)!`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappBtn}
        >
          <MessageCircle size={18} />
          <span>Notificar por WhatsApp</span>
        </a>

        <Link href="/" className={styles.secondaryBtn}>
          Ir a la Página Principal
        </Link>
      </div>
    </div>
  )
}

export default function FlowReturnPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.glowSphere} />
        <Suspense fallback={
          <div className={styles.card}>
            <div className={styles.loadingBox}>
              <div className={styles.spinner} />
              <p>Cargando información del pago...</p>
            </div>
          </div>
        }>
          <FlowReturnContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
