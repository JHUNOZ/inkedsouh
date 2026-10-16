'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Calendar, Package, BookOpen, ArrowUpRight, 
  Users, Sparkles, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, ArrowRight, ShieldCheck, Zap, ShoppingBag,
  DollarSign, Check, Phone, Truck, X, Eye, ExternalLink
} from 'lucide-react'
import styles from './resumen.module.css'

export default function ResumenPage() {
  const [stats, setStats] = useState({
    reservasPendientes: 0,
    productosActivos: 0,
    cursosActivos: 0,
    totalAlumnos: 0,
    totalStock: 0,
    totalVentas: 0,
    pedidosTotales: 0,
    pedidosPendientes: 0
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
      // 1. Reservas Pendientes
      const { count: countReservas, data: bookingsData } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)

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

      // 4. Alumnos Totales
      const { count: countAlumnos } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // 5. Órdenes y Ventas de la Tienda de Productos
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      let totalSales = 0
      let pendingOrdersCount = 0

      if (ordersData && ordersData.length > 0) {
        ordersData.forEach(o => {
          const isPaid = o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada'
          if (isPaid) {
            totalSales += parseInt(o.total_amount || 0, 10)
          } else {
            pendingOrdersCount += 1
          }
        })
        setRecentOrders(ordersData.slice(0, 10))
      }

      setStats({
        reservasPendientes: (bookingsData || []).filter(b => b.status === 'pending' || b.status === 'pendiente').length,
        productosActivos: activeProds.length,
        cursosActivos: countCursos || 0,
        totalAlumnos: countAlumnos || 0,
        totalStock: stockTotal,
        totalVentas: totalSales,
        pedidosTotales: (ordersData || []).length,
        pedidosPendientes: pendingOrdersCount
      })

      if (bookingsData) {
        setRecentBookings(bookingsData)
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
          {/* Stats Grid: 4 Cards */}
          <div className={styles.statsGrid}>
            
            {/* 1. VENTAS TIENDA WEB */}
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Ventas Tienda Web</span>
                <div className={`${styles.statIcon} ${styles.iconRed}`}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{formatPrice(stats.totalVentas)}</span>
                <span className={styles.statSubText}>
                  {stats.pedidosTotales} pedidos ({stats.pedidosPendientes} por confirmar)
                </span>
              </div>
              <a href="#ventas-web" className={styles.statLink}>
                <span>Ver Pedidos Web</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* 2. CITAS & RESERVAS */}
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Citas & Reservas</span>
                <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                  <Calendar size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{stats.reservasPendientes}</span>
                <span className={styles.statSubText}>Pendientes por revisar</span>
              </div>
              <Link href="/admin/reservas" className={styles.statLink}>
                <span>Ver Agenda</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* 3. PRODUCTOS & INVENTARIO */}
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>HONE CATALOG</span>
                <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                  <Package size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{stats.productosActivos}</span>
                <span className={styles.statSubText}>{stats.totalStock} unidades en stock</span>
              </div>
              <Link href="/admin/productos" className={styles.statLink}>
                <span>Gestionar Catálogo</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* 4. ACADEMIA & ALUMNOS */}
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>Academia & Alumnos</span>
                <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                  <BookOpen size={18} />
                </div>
              </div>
              <div className={styles.statValueWrap}>
                <span className={styles.statValue}>{stats.cursosActivos}</span>
                <span className={styles.statSubText}>{stats.totalAlumnos} alumnos registrados</span>
              </div>
              <Link href="/admin/cursos" className={styles.statLink}>
                <span>Ver Cursos & Alumnos</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className={styles.quickHub}>
            <h3 className={styles.hubTitle}>Accesos Rápidos</h3>
            <div className={styles.hubGrid}>
              <Link href="/admin/servicios" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><Sparkles size={20} /></div>
                <div>
                  <strong>Servicios & Tarifas</strong>
                  <p>Configura abonos y despacho express Rancagua</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/productos" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><Package size={20} /></div>
                <div>
                  <strong>Carga Masiva de Productos</strong>
                  <p>Sube imágenes en lote y gestiona precios</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/reservas" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><Calendar size={20} /></div>
                <div>
                  <strong>Revisar Cotizaciones</strong>
                  <p>Acepta, agenda o reprograma clientes</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>

              <Link href="/admin/cursos" className={styles.hubCard}>
                <div className={styles.hubCardIcon}><BookOpen size={20} /></div>
                <div>
                  <strong>Nuevo Curso & Lecciones</strong>
                  <p>Publica clases con video y materiales</p>
                </div>
                <ArrowUpRight size={16} className={styles.hubArrow} />
              </Link>
            </div>
          </div>

          {/* SECCIÓN 1: TABLA DE VENTAS Y PEDIDOS DE LA TIENDA WEB */}
          <div id="ventas-web" className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <div>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} style={{ color: '#E11D48' }} />
                  <span>Pedidos & Ventas de la Tienda Online</span>
                </h3>
                <p className={styles.sectionDesc}>
                  Listado de compras realizadas por clientes en la web. Confirma los pagos recibidos por Transferencia o WhatsApp.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  Total: {recentOrders.length} pedidos
                </span>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <ShoppingBag size={36} style={{ color: '#E11D48', opacity: 0.7 }} />
                <p>No hay pedidos registrados en la tienda aún.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Método de Pago</th>
                      <th>Despacho</th>
                      <th>Total</th>
                      <th>Estado Pago</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const isPaid = order.payment_status === 'pagado' || order.status === 'pagado' || order.status === 'completada'
                      const isPending = !isPaid
                      const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CL') : 'Reciente'
                      const isExpress = order.delivery_type === 'santiago' || order.delivery_type === 'express'
                      
                      let paymentMethodLabel = 'Flow Webpay'
                      if (order.payment_method === 'transfer') paymentMethodLabel = 'Transferencia'
                      if (order.payment_method === 'whatsapp') paymentMethodLabel = 'WhatsApp'
                      if (order.payment_method === 'bancame') paymentMethodLabel = 'Banca.me'

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
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                              {paymentMethodLabel}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '4px', background: isExpress ? '#FFF1F2' : '#F1F5F9', color: isExpress ? '#E11D48' : '#475569', fontWeight: 600 }}>
                              {isExpress ? 'Express Rancagua/RM' : 'Regiones Por Pagar'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A' }}>
                              {formatPrice(order.total_amount)}
                            </strong>
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
