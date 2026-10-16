'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Calendar, Package, BookOpen, ArrowUpRight, 
  Users, Sparkles, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, ArrowRight, ShieldCheck, Zap, ShoppingBag,
  DollarSign, Check, Phone, Truck, X, Eye, ExternalLink,
  Wallet, CreditCard, Layers
} from 'lucide-react'
import styles from './resumen.module.css'

export default function ResumenPage() {
  const [stats, setStats] = useState({
    totalGanancias: 0,
    totalVentas: 0,
    pedidosTotales: 0,
    pedidosPagados: 0,
    pedidosPendientes: 0,
    montoPendiente: 0,
    gananciasCursos: 0,
    alumnosActivos: 0,
    totalAlumnos: 0,
    cursosActivos: 0,
    gananciasAbonos: 0,
    reservasConfirmadas: 0,
    reservasPendientes: 0,
    productosActivos: 0,
    totalStock: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState(null)
  const supabase = createClient()

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    try {
      // 1. Reservas y Abonos
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      let depositEarnings = 0
      let confirmedBookingsCount = 0
      let pendingBookingsCount = 0

      if (bookingsData && bookingsData.length > 0) {
        bookingsData.forEach(b => {
          const isConfirmed = b.status === 'confirmed' || b.status === 'confirmada' || b.status === 'completada' || b.status === 'completed'
          if (isConfirmed) {
            confirmedBookingsCount += 1
            depositEarnings += parseInt(b.deposit_amount || b.deposit || 20000, 10)
          } else {
            pendingBookingsCount += 1
          }
        })
      }

      // 2. Productos Activos & Stock
      const { data: prods } = await supabase
        .from('products')
        .select('stock, is_active')
      
      const activeProds = (prods || []).filter(p => p.is_active)
      const stockTotal = (prods || []).reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0)

      // 3. Cursos Activos
      const { count: countCursos } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 4. Alumnos Totales & Ganancias de la Academia
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, course_id, status, courses(price, title)')

      let totalCourseEarnings = 0
      let activeStudentsCount = 0

      if (studentsData && studentsData.length > 0) {
        studentsData.forEach(s => {
          if (s.status === 'activo' || s.status === 'active') {
            activeStudentsCount += 1
            const coursePrice = s.courses?.price ? parseInt(s.courses.price, 10) : 0
            totalCourseEarnings += coursePrice
          }
        })
      }

      // 5. Órdenes y Ventas de la Tienda de Productos
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      let totalSales = 0
      let pendingOrdersCount = 0
      let paidOrdersCount = 0
      let pendingOrdersAmount = 0

      if (ordersData && ordersData.length > 0) {
        ordersData.forEach(o => {
          const isPaid = o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada'
          const amt = parseInt(o.total_amount || 0, 10)
          if (isPaid) {
            totalSales += amt
            paidOrdersCount += 1
          } else {
            pendingOrdersCount += 1
            pendingOrdersAmount += amt
          }
        })
        setRecentOrders(ordersData.slice(0, 10))
      }

      const totalGanancias = totalSales + totalCourseEarnings + depositEarnings

      setStats({
        totalGanancias,
        totalVentas: totalSales,
        pedidosTotales: (ordersData || []).length,
        pedidosPagados: paidOrdersCount,
        pedidosPendientes: pendingOrdersCount,
        montoPendiente: pendingOrdersAmount,
        gananciasCursos: totalCourseEarnings,
        alumnosActivos: activeStudentsCount,
        totalAlumnos: (studentsData || []).length,
        cursosActivos: countCursos || 0,
        gananciasAbonos: depositEarnings,
        reservasConfirmadas: confirmedBookingsCount,
        reservasPendientes: pendingBookingsCount,
        productosActivos: activeProds.length,
        totalStock: stockTotal
      })

      if (bookingsData) {
        setRecentBookings(bookingsData.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Confirmar Pago de una orden (WhatsApp o Transferencia)
  const handleConfirmOrderPayment = async (order) => {
    if (!confirm(`¿Confirmar que el pago de ${order.customer_name} por $${(order.total_amount || 0).toLocaleString('es-CL')} CLP ha sido recibido?`)) {
      return
    }

    try {
      setConfirmingId(order.id || order.order_number)
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        showToast(`Pago de orden #${order.order_number} confirmado exitosamente`)
        if (selectedOrder && (selectedOrder.id === order.id || selectedOrder.order_number === order.order_number)) {
          setSelectedOrder({ ...selectedOrder, payment_status: 'pagado', status: 'completada' })
        }
        await fetchStats()
      } else {
        throw new Error(data.error || 'Error al confirmar pago')
      }
    } catch (err) {
      alert(err.message || 'Error al confirmar el pago.')
    } finally {
      setConfirmingId(null)
    }
  }

  const formatPrice = (val) => `$${(val || 0).toLocaleString('es-CL')}`

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.greetingTag}>
            <Sparkles size={14} />
            <span>ESTUDIO INKEDSOUH</span>
          </div>
          <h1 className={styles.title}>Panel de Control Principal</h1>
          <p className={styles.subtitle}>Visión global de ventas de la tienda, citas agendadas, catálogo y academia.</p>
        </div>

        <div className={styles.headerBadge}>
          <span className={styles.statusLiveDot}></span>
          <span>SISTEMA EN LÍNEA</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Sincronizando métricas en tiempo real...</p>
        </div>
      ) : (
        <>
          {/* BANNER PRINCIPAL: RESUMEN DE VENTAS Y GANANCIAS */}
          <div className={styles.financeBanner}>
            <div className={styles.financeHeader}>
              <div className={styles.financeTitleWrap}>
                <div className={styles.financeBadge}>
                  <TrendingUp size={15} />
                  <span>BALANCE GENERAL & RENDIMIENTO COMERCIAL</span>
                </div>
                <h2 className={styles.financeTitle}>Resumen de Ventas y Ganancias</h2>
                <p className={styles.financeSubtitle}>
                  Ingresos consolidados por venta de productos en tienda web, cursos de la academia y abonos de citas de tatuajes.
                </p>
              </div>

              <div className={styles.financeTotalBox}>
                <span className={styles.financeTotalLabel}>Ganancias Totales Acumuladas</span>
                <span className={styles.financeTotalAmount}>{formatPrice(stats.totalGanancias)} CLP</span>
                {stats.montoPendiente > 0 && (
                  <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}>
                    +{formatPrice(stats.montoPendiente)} CLP por confirmar en pedidos web pendientes
                  </span>
                )}
              </div>
            </div>

            {/* Desglose de ingresos en 3 áreas */}
            <div className={styles.financeBreakdownGrid}>
              <div className={styles.financeSubCard}>
                <div className={styles.financeSubTop}>
                  <span className={styles.financeSubLabel}>Ventas Tienda Web</span>
                  <div className={`${styles.statIcon} ${styles.iconRed}`} style={{ width: '32px', height: '32px' }}>
                    <ShoppingBag size={16} />
                  </div>
                </div>
                <span className={styles.financeSubAmount}>{formatPrice(stats.totalVentas)}</span>
                <span className={styles.financeSubDetails}>
                  {stats.pedidosPagados} pedidos pagados • {stats.pedidosPendientes} pendientes
                </span>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    href="/admin/pedidos" 
                    style={{ fontSize: '0.8rem', color: '#E11D48', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Ver Pedidos</span>
                    <ArrowRight size={13} />
                  </Link>

                  <Link 
                    href="/admin/pedidos?filter=pendientes" 
                    style={{ 
                      fontSize: '0.78rem', 
                      background: stats.pedidosPendientes > 0 ? '#FEF3C7' : '#F1F5F9', 
                      color: stats.pedidosPendientes > 0 ? '#B45309' : '#475569', 
                      border: `1px solid ${stats.pedidosPendientes > 0 ? '#FDE68A' : '#E2E8F0'}`, 
                      padding: '4px 9px', 
                      borderRadius: '6px', 
                      fontWeight: 700, 
                      textDecoration: 'none', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Ver pedidos pendientes de confirmación"
                  >
                    <span>Ver Pendientes {stats.pedidosPendientes > 0 ? `(${stats.pedidosPendientes})` : ''}</span>
                  </Link>
                </div>
              </div>

              <div className={styles.financeSubCard}>
                <div className={styles.financeSubTop}>
                  <span className={styles.financeSubLabel}>Academia & Cursos</span>
                  <div className={`${styles.statIcon} ${styles.iconGreen}`} style={{ width: '32px', height: '32px' }}>
                    <BookOpen size={16} />
                  </div>
                </div>
                <span className={styles.financeSubAmount}>{formatPrice(stats.gananciasCursos)}</span>
                <span className={styles.financeSubDetails}>
                  {stats.alumnosActivos} alumnos activos • {stats.cursosActivos} cursos
                </span>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <Link 
                    href="/admin/cursos" 
                    style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Ver Cursos & Alumnos</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              <div className={styles.financeSubCard}>
                <div className={styles.financeSubTop}>
                  <span className={styles.financeSubLabel}>Abonos de Tatuaje</span>
                  <div className={`${styles.statIcon} ${styles.iconPurple}`} style={{ width: '32px', height: '32px' }}>
                    <Calendar size={16} />
                  </div>
                </div>
                <span className={styles.financeSubAmount}>{formatPrice(stats.gananciasAbonos)}</span>
                <span className={styles.financeSubDetails}>
                  {stats.reservasConfirmadas} citas confirmadas • {stats.reservasPendientes} por revisar
                </span>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <Link 
                    href="/admin/reservas" 
                    style={{ fontSize: '0.8rem', color: '#7E22CE', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>Ver Agenda & Citas</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Hub - Mejorado y Profesional */}
          <div className={styles.quickHub}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className={styles.hubTitle} style={{ margin: 0 }}>Accesos Rápidos</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Atajos de Gestión Diaria</span>
            </div>
            <div className={styles.hubGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <Link href="/admin/pedidos" className={styles.hubCard}>
                <div className={styles.hubCardIcon} style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3' }}><ShoppingBag size={18} /></div>
                <div>
                  <strong>Ventas & Pedidos Online</strong>
                  <p>Confirma transferencias y elimina pruebas</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/pedidos?tab=envios" className={styles.hubCard}>
                <div className={styles.hubCardIcon} style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}><Truck size={18} /></div>
                <div>
                  <strong>Envíos y Entregas</strong>
                  <p>Despachos Rancagua, RM y plazos automáticos</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/servicios" className={styles.hubCard}>
                <div className={styles.hubCardIcon} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}><Layers size={18} /></div>
                <div>
                  <strong>Servicios & Tarifas</strong>
                  <p>Configura abonos y tipos de tatuajes</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/productos" className={styles.hubCard}>
                <div className={styles.hubCardIcon} style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}><Package size={18} /></div>
                <div>
                  <strong>HONE CATALOG</strong>
                  <p>Administra stock y precios de insumos</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/reservas" className={styles.hubCard}>
                <div className={styles.hubCardIcon} style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}><Calendar size={18} /></div>
                <div>
                  <strong>Agenda & Cotizaciones</strong>
                  <p>Acepta, agenda o reprograma clientes</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/cursos" className={styles.hubCard}>
                <div className={styles.hubCardIcon} style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}><BookOpen size={18} /></div>
                <div>
                  <strong>Academia & Cursos</strong>
                  <p>Lecciones con video y alumnos activos</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>
            </div>
          </div>

          {/* SECCIÓN 1: ÚLTIMOS PEDIDOS */}
          <div id="ultimos-pedidos" className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <div>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} style={{ color: '#E11D48' }} />
                  <span>Últimos Pedidos</span>
                </h3>
                <p className={styles.sectionDesc}>
                  Ventas recientes registradas a través de la tienda web oficial.
                </p>
              </div>

              <Link href="/admin/pedidos" className={styles.btnViewAll}>
                Ver Todos los Pedidos
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <ShoppingBag size={36} style={{ color: '#E11D48', opacity: 0.7 }} />
                <p>No hay pedidos recientes registrados.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Despacho</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 5).map((order) => {
                      const isPaid = order.payment_status === 'pagado' || order.status === 'pagado' || order.status === 'completada'
                      const isPending = !isPaid
                      const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CL') : 'Reciente'
                      const isExpress = order.delivery_type === 'santiago' || order.delivery_type === 'express'

                      return (
                        <tr key={order.id || order.order_number}>
                          <td>
                            <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                              #{order.order_number}
                            </strong>
                          </td>
                          <td style={{ color: '#64748B', fontSize: '0.82rem' }}>
                            {dateStr}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{order.customer_name}</div>
                            {order.customer_phone && (
                              <a 
                                href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                title="Abrir WhatsApp con cliente"
                              >
                                <Phone size={11} /> {order.customer_phone}
                              </a>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A' }}>
                              {formatPrice(order.total_amount)}
                            </strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '4px', background: isExpress ? '#FFF1F2' : '#F1F5F9', color: isExpress ? '#E11D48' : '#475569', fontWeight: 600 }}>
                              {isExpress ? 'Express Rancagua/RM' : 'Regiones Starken'}
                            </span>
                          </td>
                          <td>
                            {isPaid ? (
                              <span className={`${styles.statusBadge} ${styles.statusPaid}`}>
                                PAGADO
                              </span>
                            ) : (
                              <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                                PENDIENTE
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              {isPending && (
                                <button 
                                  type="button" 
                                  className={styles.btnConfirmPay}
                                  onClick={() => handleConfirmOrderPayment(order)}
                                  disabled={confirmingId === (order.id || order.order_number)}
                                  title="Confirmar que el pago fue recibido"
                                >
                                  <Check size={13} />
                                  <span>{confirmingId === (order.id || order.order_number) ? 'Confirmando...' : 'Confirmar Pago'}</span>
                                </button>
                              )}
                              <button 
                                type="button" 
                                className={styles.btnViewOrder}
                                onClick={() => setSelectedOrder(order)}
                                title="Ver detalles del pedido"
                              >
                                <Eye size={13} />
                                <span>Detalle</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: RECENT BOOKINGS TABLE */}
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Últimas Solicitudes de Reserva</h3>
                <p className={styles.sectionDesc}>Clientes que han cotizado a través del formulario web</p>
              </div>
              <Link href="/admin/reservas" className={styles.btnViewAll}>
                Ver Todas las Reservas
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <Calendar size={36} style={{ color: '#E11D48', opacity: 0.7 }} />
                <p>No hay solicitudes de reserva recientes.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Servicio / Idea</th>
                      <th>Fecha Solicitada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong style={{ color: '#0F172A' }}>{b.client_name}</strong></td>
                        <td style={{ color: '#64748B' }}>{b.client_email}</td>
                        <td style={{ color: '#334155' }}>{b.service_type || b.tattoo_details?.substring(0, 30) || 'Tatuaje'}</td>
                        <td style={{ color: '#64748B' }}>{b.requested_date}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${b.status === 'accepted' ? styles.statusAccepted : b.status === 'rejected' ? styles.statusRejected : styles.statusPending}`}>
                            {(b.status || 'pendiente').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Detalle de la Orden */}
          {selectedOrder && (
            <div className={styles.orderModalOverlay} onClick={() => setSelectedOrder(null)}>
              <div className={styles.orderModalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.orderModalHeader}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A', fontWeight: 800 }}>
                      Detalle de Orden #{selectedOrder.order_number}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Fecha: {new Date(selectedOrder.created_at).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedOrder(null)}
                    style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748B' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.orderModalBody}>
                  {/* Estado y Monto */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Estado de Pago</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: (selectedOrder.payment_status === 'pagado' || selectedOrder.status === 'completada') ? '#15803D' : '#B45309' }}>
                        {(selectedOrder.payment_status === 'pagado' || selectedOrder.status === 'completada') ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Total Orden</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#E11D48' }}>
                        {formatPrice(selectedOrder.total_amount)} CLP
                      </div>
                    </div>
                  </div>

                  {/* Datos del Cliente y Despacho */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px' }}>
                      <strong style={{ color: '#0F172A', display: 'block', marginBottom: '6px' }}>Datos de Contacto</strong>
                      <div><strong>Nombre:</strong> {selectedOrder.customer_name}</div>
                      <div><strong>Teléfono:</strong> {selectedOrder.customer_phone || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}</div>
                      <div><strong>Método:</strong> {selectedOrder.payment_method?.toUpperCase()}</div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px' }}>
                      <strong style={{ color: '#0F172A', display: 'block', marginBottom: '6px' }}>Datos de Despacho</strong>
                      <div><strong>Modalidad:</strong> {selectedOrder.delivery_type === 'santiago' ? 'Express Rancagua / RM' : 'Regiones Por Pagar'}</div>
                      <div><strong>Dirección:</strong> {selectedOrder.delivery_address || 'No indicada'}</div>
                      <div><strong>Ciudad:</strong> {selectedOrder.delivery_city || 'Santiago'}</div>
                      {selectedOrder.delivery_notes && (
                        <div style={{ marginTop: '4px', color: '#64748B', fontStyle: 'italic' }}>
                          <strong>Notas:</strong> {selectedOrder.delivery_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista de Productos */}
                  <div>
                    <strong style={{ color: '#0F172A', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                      Productos Comprados
                    </strong>
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #E2E8F0' : 'none', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', fontSize: '0.85rem' }}>
                            <div>
                              <strong style={{ color: '#0F172A' }}>{item.name}</strong>
                              {item.variantName && <span style={{ color: '#E11D48', marginLeft: '6px', fontSize: '0.78rem' }}>({item.variantName})</span>}
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Cantidad: {item.quantity} un. x {formatPrice(item.price)}</div>
                            </div>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '14px', color: '#64748B', fontSize: '0.85rem' }}>
                          Sin desglose de items disponible.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.orderModalFooter}>
                  {!(selectedOrder.payment_status === 'pagado' || selectedOrder.status === 'completada') && (
                    <button 
                      type="button" 
                      className={styles.btnConfirmPay}
                      onClick={() => handleConfirmOrderPayment(selectedOrder)}
                      disabled={confirmingId === (selectedOrder.id || selectedOrder.order_number)}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      <Check size={16} />
                      <span>{confirmingId === (selectedOrder.id || selectedOrder.order_number) ? 'Confirmando...' : 'Confirmar Pago Recibido'}</span>
                    </button>
                  )}

                  {selectedOrder.customer_phone && (
                    <a 
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.btnViewOrder}
                      style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#059669', background: '#ECFDF5', borderColor: '#A7F3D0' }}
                    >
                      <Phone size={14} />
                      <span>Contactar por WhatsApp</span>
                    </a>
                  )}

                  <button 
                    type="button" 
                    className={styles.btnViewOrder}
                    onClick={() => setSelectedOrder(null)}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
