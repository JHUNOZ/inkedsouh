'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingBag, Truck, DollarSign, Clock, CheckCircle2, 
  Trash2, Eye, Phone, MapPin, RefreshCw, Save, X, Check,
  AlertCircle, ExternalLink, Copy, Calendar, Package
} from 'lucide-react'
import styles from './pedidos.module.css'

export default function PedidosAdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>Cargando panel de ventas y pedidos...</div>}>
      <PedidosAdminContent />
    </Suspense>
  )
}

function PedidosAdminContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'envios' ? 'envios' : 'pedidos'
  const initialFilter = searchParams.get('filter') === 'pendientes' ? 'pendientes' : 'todos'

  const [activeTab, setActiveTab] = useState(initialTab) // 'pedidos' | 'envios'
  const [filterStatus, setFilterStatus] = useState(initialFilter) // 'todos' | 'pagados' | 'pendientes'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingBatch, setDeletingBatch] = useState(false)
  const [savingShipping, setSavingShipping] = useState(false)
  const [toast, setToast] = useState(null)

  // Configuración de Despacho & Días de Entrega
  const [expressShippingCost, setExpressShippingCost] = useState(3990)
  const [shippingDaysRancagua, setShippingDaysRancagua] = useState('24h hábiles')
  const [shippingDaysRM, setShippingDaysRM] = useState('24 a 48h hábiles')
  const [shippingDaysRegiones, setShippingDaysRegiones] = useState('2 a 4 días hábiles')

  const supabase = createClient()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Texto generado automáticamente segun los días configurados
  const autoDeliveryTimeframe = useMemo(() => {
    return `${shippingDaysRancagua} en Rancagua y Machalí • ${shippingDaysRM} en RM • ${shippingDaysRegiones} a Regiones vía Starken por pagar`
  }, [shippingDaysRancagua, shippingDaysRM, shippingDaysRegiones])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Cargar Órdenes (excluyendo eliminadas)
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'eliminada')
        .order('created_at', { ascending: false })

      if (!ordersErr && ordersData) {
        setOrders(ordersData)
      }

      // 2. Cargar Configuración de Despacho desde site_config
      const { data: configData } = await supabase
        .from('site_config')
        .select('*')
        .in('key_name', [
          'express_shipping_cost', 
          'shipping_days_rancagua', 
          'shipping_days_rm', 
          'shipping_days_regiones'
        ])

      if (configData && configData.length > 0) {
        configData.forEach(item => {
          if (item.key_name === 'express_shipping_cost' && item.value) {
            setExpressShippingCost(parseInt(item.value, 10) || 3990)
          }
          if (item.key_name === 'shipping_days_rancagua' && item.value) {
            setShippingDaysRancagua(item.value)
          }
          if (item.key_name === 'shipping_days_rm' && item.value) {
            setShippingDaysRM(item.value)
          }
          if (item.key_name === 'shipping_days_regiones' && item.value) {
            setShippingDaysRegiones(item.value)
          }
        })
      }
    } catch (err) {
      console.error('Error fetching orders & shipping:', err)
      showToast('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Guardar Configuración de Envíos & Plazos Automáticos
  const handleSaveShippingConfig = async () => {
    setSavingShipping(true)
    try {
      const now = new Date().toISOString()
      const rows = [
        {
          section: 'Tienda & Envíos',
          key_name: 'express_shipping_cost',
          value: String(parseInt(expressShippingCost, 10) || 3990),
          updated_at: now
        },
        {
          section: 'Tienda & Envíos',
          key_name: 'delivery_timeframe',
          value: autoDeliveryTimeframe,
          updated_at: now
        },
        {
          section: 'Tienda & Envíos',
          key_name: 'shipping_days_rancagua',
          value: shippingDaysRancagua,
          updated_at: now
        },
        {
          section: 'Tienda & Envíos',
          key_name: 'shipping_days_rm',
          value: shippingDaysRM,
          updated_at: now
        },
        {
          section: 'Tienda & Envíos',
          key_name: 'shipping_days_regiones',
          value: shippingDaysRegiones,
          updated_at: now
        }
      ]

      const { error } = await supabase
        .from('site_config')
        .upsert(rows, { onConflict: 'key_name' })

      if (error) throw error

      showToast('Tarifa de despacho y plazos automáticos guardados correctamente')
    } catch (err) {
      console.error('Error saving shipping config:', err)
      showToast('Error al guardar configuración: ' + err.message, 'error')
    } finally {
      setSavingShipping(false)
    }
  }

  // Confirmar Pago de una orden
  const handleConfirmPayment = async (order) => {
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
        await fetchData()
      } else {
        throw new Error(data.error || 'Error al confirmar pago')
      }
    } catch (err) {
      alert(err.message || 'Error al confirmar el pago.')
    } finally {
      setConfirmingId(null)
    }
  }

  // Manejo de Selección Múltiple
  const handleToggleSelect = (orderNumber) => {
    setSelectedIds(prev => 
      prev.includes(orderNumber)
        ? prev.filter(id => id !== orderNumber)
        : [...prev, orderNumber]
    )
  }

  const handleToggleSelectAll = (list) => {
    const listNumbers = list.map(o => o.order_number)
    const isAll = listNumbers.length > 0 && listNumbers.every(num => selectedIds.includes(num))
    if (isAll) {
      setSelectedIds(prev => prev.filter(id => !listNumbers.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...listNumbers])))
    }
  }

  // Eliminar transacción individual
  const handleDeleteOrder = async (order) => {
    const isPaid = order.payment_status === 'pagado' || order.status === 'pagado' || order.status === 'completada'
    const warningMsg = isPaid 
      ? `¿Estás seguro de eliminar la orden #${order.order_number}? Esta orden ya está marcada como pagada.`
      : `¿Eliminar la orden #${order.order_number} de ${order.customer_name}?`

    if (!confirm(warningMsg)) return

    // 1. Actualización optimista inmediata en la interfaz
    setOrders(prev => prev.filter(o => o.order_number !== order.order_number && o.id !== order.id))
    setSelectedIds(prev => prev.filter(id => id !== order.order_number))
    if (selectedOrder && (selectedOrder.id === order.id || selectedOrder.order_number === order.order_number)) {
      setSelectedOrder(null)
    }

    showToast(`Orden #${order.order_number} eliminada. La base de datos está sincronizando los cambios en segundo plano.`)

    try {
      setDeletingId(order.id || order.order_number)
      await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number
        })
      })
      fetchData()
    } catch (err) {
      console.error('Error al sincronizar eliminación:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Eliminar múltiples transacciones seleccionadas
  const handleDeleteBatch = async () => {
    if (selectedIds.length === 0) return

    const count = selectedIds.length
    const anyPaid = orders.some(o => selectedIds.includes(o.order_number) && (o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada'))

    const confirmMsg = anyPaid
      ? `Atención: 1 o más de los ${count} pedidos seleccionados están marcados como pagados. ¿Estás seguro de eliminarlos?`
      : `¿Eliminar los ${count} pedidos seleccionados? Esta acción los removerá de la lista.`

    if (!confirm(confirmMsg)) return

    const numbersToDelete = [...selectedIds]

    // 1. Actualización optimista inmediata
    setOrders(prev => prev.filter(o => !numbersToDelete.includes(o.order_number)))
    setSelectedIds([])
    if (selectedOrder && numbersToDelete.includes(selectedOrder.order_number)) {
      setSelectedOrder(null)
    }

    showToast(`${count} ${count === 1 ? 'pedido eliminado' : 'pedidos eliminados'}. La base de datos está sincronizando los registros actualizados en segundo plano.`)

    setDeletingBatch(true)
    try {
      await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumbers: numbersToDelete
        })
      })
      fetchData()
    } catch (err) {
      console.error('Error al procesar eliminación en lote:', err)
    } finally {
      setDeletingBatch(false)
    }
  }

  // Copiar dirección al portapapeles
  const handleCopyAddress = (order) => {
    const fullText = `${order.customer_name}\n${order.delivery_address || ''}, ${order.delivery_city || ''}\nTel: ${order.customer_phone || ''}`
    navigator.clipboard.writeText(fullText)
    showToast('Dirección copiada al portapapeles')
  }

  // Métricas calculadas
  const metrics = useMemo(() => {
    let totalSales = 0
    let paidCount = 0
    let pendingCount = 0
    let pendingAmount = 0

    orders.forEach(o => {
      const isPaid = o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada'
      const amt = parseInt(o.total_amount || 0, 10)
      if (isPaid) {
        totalSales += amt
        paidCount += 1
      } else {
        pendingCount += 1
        pendingAmount += amt
      }
    })

    return { totalSales, paidCount, pendingCount, pendingAmount, totalOrders: orders.length }
  }, [orders])

  // Filtrado de órdenes
  const filteredOrders = useMemo(() => {
    if (filterStatus === 'pagados') {
      return orders.filter(o => o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada')
    }
    if (filterStatus === 'pendientes') {
      return orders.filter(o => !(o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada'))
    }
    return orders
  }, [orders, filterStatus])

  // Órdenes completadas para despacho (Sub-pestaña Envíos)
  const completedOrdersForShipping = useMemo(() => {
    return orders.filter(o => o.payment_status === 'pagado' || o.status === 'pagado' || o.status === 'completada')
  }, [orders])

  const formatPrice = (val) => `$${(val || 0).toLocaleString('es-CL')}`

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.badgeRow}>
            <span className={styles.badgePill}>TIENDA ONLINE</span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Gestión de Compras & Despachos
            </span>
          </div>
          <h1 className={styles.title}>Ventas, Pedidos & Despachos</h1>
          <p className={styles.subtitle}>
            Administra los pedidos de insumos y productos, confirma pagos directos, elimina transacciones no concretadas y coordina envíos con plazos automáticos.
          </p>
        </div>

        <div className={styles.topActions}>
          <button 
            type="button" 
            className={styles.btnSecondary}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Navegación por Sub-Pestañas */}
      <div className={styles.subTabsRow}>
        <button 
          type="button" 
          className={`${styles.tabBtn} ${activeTab === 'pedidos' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          <ShoppingBag size={17} />
          <span>Pedidos & Ventas Online</span>
          <span className={styles.tabCount}>{orders.length}</span>
        </button>

        <button 
          type="button" 
          className={`${styles.tabBtn} ${activeTab === 'envios' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('envios')}
        >
          <Truck size={17} />
          <span>Envíos y Entregas</span>
          <span className={styles.tabCount}>{completedOrdersForShipping.length}</span>
        </button>
      </div>

      {/* SUB-PESTAÑA 1: PEDIDOS & VENTAS ONLINE */}
      {activeTab === 'pedidos' && (
        <>
          {/* Mensaje informativo de configuración de envíos y plazos */}
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1E40AF', fontSize: '0.86rem' }}>
              <Truck size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
              <span>
                <strong>Aviso de Configuración:</strong> Puedes modificar las tarifas de envío express y los plazos de entrega automáticos por zona en la subpestaña <strong>Envíos y Entregas</strong>.
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveTab('envios')}
              style={{
                background: '#FFFFFF',
                color: '#2563EB',
                border: '1px solid #93C5FD',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Ir a Envíos y Entregas</span>
              <Truck size={13} />
            </button>
          </div>

          {/* KPI Metrics */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Total Ventas Pagadas</span>
                <div className={`${styles.kpiIconWrap} ${styles.iconRed}`}>
                  <DollarSign size={17} />
                </div>
              </div>
              <span className={styles.kpiAmount}>{formatPrice(metrics.totalSales)} CLP</span>
              <span className={styles.kpiSubText}>{metrics.paidCount} pedidos pagados confirmados</span>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Pedidos Totales</span>
                <div className={`${styles.kpiIconWrap} ${styles.iconBlue}`}>
                  <ShoppingBag size={17} />
                </div>
              </div>
              <span className={styles.kpiAmount}>{metrics.totalOrders}</span>
              <span className={styles.kpiSubText}>Transacciones registradas en tienda</span>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>Pendientes de Pago</span>
                <div className={`${styles.kpiIconWrap} ${styles.iconAmber}`}>
                  <Clock size={17} />
                </div>
              </div>
              <span className={styles.kpiAmount} style={{ color: metrics.pendingCount > 0 ? '#D97706' : '#0F172A' }}>
                {metrics.pendingCount}
              </span>
              <span className={styles.kpiSubText}>
                {metrics.pendingAmount > 0 ? `${formatPrice(metrics.pendingAmount)} CLP por validar` : 'Todos los pedidos al día'}
              </span>
            </div>
          </div>

          {/* Filtros de Tabla */}
          <div className={styles.filterRow}>
            <div className={styles.filterPills}>
              <button 
                type="button" 
                className={`${styles.filterPill} ${filterStatus === 'todos' ? styles.filterPillActive : ''}`}
                onClick={() => setFilterStatus('todos')}
              >
                Todos ({orders.length})
              </button>
              <button 
                type="button" 
                className={`${styles.filterPill} ${filterStatus === 'pagados' ? styles.filterPillActive : ''}`}
                onClick={() => setFilterStatus('pagados')}
              >
                Pagados / Completados ({metrics.paidCount})
              </button>
              <button 
                type="button" 
                className={`${styles.filterPill} ${filterStatus === 'pendientes' ? styles.filterPillActive : ''}`}
                onClick={() => setFilterStatus('pendientes')}
              >
                Pendientes ({metrics.pendingCount})
              </button>
            </div>

            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Mostrando {filteredOrders.length} transacciones
            </span>
          </div>

          {/* Barra de Selección Múltiple */}
          {selectedIds.length > 0 && (
            <div className={styles.selectionBar}>
              <div className={styles.selectionText}>
                <Check size={16} />
                <span>{selectedIds.length} {selectedIds.length === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}</span>
              </div>
              <div className={styles.selectionActions}>
                <button 
                  type="button" 
                  className={styles.btnDeleteBatch}
                  onClick={handleDeleteBatch}
                  disabled={deletingBatch}
                >
                  <Trash2 size={14} />
                  <span>{deletingBatch ? 'Eliminando...' : `Eliminar Seleccionados (${selectedIds.length})`}</span>
                </button>
                <button 
                  type="button" 
                  className={styles.btnCancelSelection}
                  onClick={() => setSelectedIds([])}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Tabla de Órdenes */}
          <div className={styles.card}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                <ShoppingBag size={40} style={{ color: '#E11D48', opacity: 0.6, marginBottom: '10px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No hay transacciones en este filtro.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.checkboxTh}>
                        <input 
                          type="checkbox" 
                          className={styles.customCheckbox}
                          checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.order_number))}
                          onChange={() => handleToggleSelectAll(filteredOrders)}
                          title="Seleccionar o deseleccionar todos los pedidos"
                        />
                      </th>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Método de Pago</th>
                      <th>Despacho</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const isPaid = order.payment_status === 'pagado' || order.status === 'pagado' || order.status === 'completada'
                      const isPending = !isPaid
                      const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CL') : 'Reciente'
                      const isExpress = order.delivery_type === 'santiago' || order.delivery_type === 'express'
                      const isSelected = selectedIds.includes(order.order_number)

                      let paymentMethodLabel = 'Flow Webpay'
                      if (order.payment_method === 'transfer') paymentMethodLabel = 'Transferencia'
                      if (order.payment_method === 'whatsapp') paymentMethodLabel = 'WhatsApp'

                      return (
                        <tr 
                          key={order.id || order.order_number}
                          style={{ background: isSelected ? '#FFF1F2' : undefined }}
                        >
                          <td className={styles.checkboxTd}>
                            <input 
                              type="checkbox" 
                              className={styles.customCheckbox}
                              checked={isSelected}
                              onChange={() => handleToggleSelect(order.order_number)}
                              title={`Seleccionar orden #${order.order_number}`}
                            />
                          </td>
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
                                style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
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
                            <span className={isExpress ? styles.badgeDeliveryExpress : styles.badgeDeliveryStarken}>
                              {isExpress ? 'Express Rancagua/RM' : 'Regiones (Starken)'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A' }}>
                              {formatPrice(order.total_amount)} CLP
                            </strong>
                          </td>
                          <td>
                            {isPaid ? (
                              <span className={styles.badgePaid}>
                                <Check size={11} /> Pagado
                              </span>
                            ) : (
                              <span className={styles.badgePending}>
                                <Clock size={11} /> Pendiente
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button 
                                type="button"
                                className={styles.actionBtnDetail}
                                onClick={() => setSelectedOrder(order)}
                                title="Ver detalles y productos de la orden"
                              >
                                <Eye size={13} />
                                <span>Detalle</span>
                              </button>

                              {isPending && (
                                <button 
                                  type="button"
                                  className={styles.actionBtnConfirm}
                                  onClick={() => handleConfirmPayment(order)}
                                  disabled={confirmingId === (order.id || order.order_number)}
                                  title="Marcar orden como pagada y completada"
                                >
                                  <Check size={13} />
                                  <span>{confirmingId === (order.id || order.order_number) ? '...' : 'Confirmar'}</span>
                                </button>
                              )}

                              <button 
                                type="button"
                                className={styles.actionBtnDelete}
                                onClick={() => handleDeleteOrder(order)}
                                disabled={deletingId === (order.id || order.order_number)}
                                title="Eliminar orden"
                              >
                                <Trash2 size={13} />
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
        </>
      )}

      {/* SUB-PESTAÑA 2: ENVÍOS Y ENTREGAS */}
      {activeTab === 'envios' && (
        <>
          {/* Configuración de Días de Entrega & Tarifa Fija (Trasladada aquí) */}
          <div className={styles.shippingConfigCard}>
            <div className={styles.shippingConfigHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={20} style={{ color: '#E11D48' }} />
                  <span>Configuración de Días de Entrega & Tarifa Express</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  Define los plazos para Rancagua, RM y Regiones. El texto informativo de entrega al comprar se genera automáticamente segun los días que ingreses.
                </p>
              </div>

              <button 
                type="button" 
                className={styles.btnPrimary}
                onClick={handleSaveShippingConfig}
                disabled={savingShipping}
              >
                <Save size={15} />
                <span>{savingShipping ? 'Guardando...' : 'Guardar Plazos y Tarifa'}</span>
              </button>
            </div>

            <div className={styles.shippingGrid}>
              <div className={styles.formField}>
                <label>Precio Fijo Envío Express (CLP)</label>
                <input 
                  type="number"
                  className={styles.input}
                  value={expressShippingCost}
                  onChange={(e) => setExpressShippingCost(e.target.value)}
                  placeholder="3990"
                  min="0"
                  step="100"
                />
                <span className={styles.fieldHelper}>Monto cobrado al cliente si elige Envío Express</span>
              </div>

              <div className={styles.formField}>
                <label>Días de Entrega Rancagua & Machalí</label>
                <input 
                  type="text"
                  className={styles.input}
                  value={shippingDaysRancagua}
                  onChange={(e) => setShippingDaysRancagua(e.target.value)}
                  placeholder="24h hábiles"
                />
                <span className={styles.fieldHelper}>Ciudad de origen del estudio</span>
              </div>

              <div className={styles.formField}>
                <label>Días de Entrega Región Metropolitana (RM)</label>
                <input 
                  type="text"
                  className={styles.input}
                  value={shippingDaysRM}
                  onChange={(e) => setShippingDaysRM(e.target.value)}
                  placeholder="24 a 48h hábiles"
                />
                <span className={styles.fieldHelper}>Plazo express hacia Santiago y alrededores</span>
              </div>

              <div className={styles.formField}>
                <label>Días de Entrega Otras Regiones</label>
                <input 
                  type="text"
                  className={styles.input}
                  value={shippingDaysRegiones}
                  onChange={(e) => setShippingDaysRegiones(e.target.value)}
                  placeholder="2 a 4 días hábiles"
                />
                <span className={styles.fieldHelper}>Envíos por pagar vía Starken / Chilexpress</span>
              </div>
            </div>

            {/* Banner de Previsualización Automática */}
            <div className={styles.shippingPreviewBanner}>
              <MapPin size={20} style={{ color: '#E11D48', flexShrink: 0 }} />
              <div className={styles.shippingPreviewText}>
                <strong>Texto Informativo Generado Automáticamente para la Web:</strong>
                <div style={{ marginTop: '3px', fontWeight: 700, color: '#9F1239' }}>
                  « {autoDeliveryTimeframe} »
                </div>
              </div>
            </div>
          </div>

          {/* Listado de Pedidos Completados para Despacho */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0F172A', fontWeight: 700 }}>
                  Órdenes Pagadas Listas para Despachar ({completedOrdersForShipping.length})
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                  Transacciones completadas con dirección de entrega y detalle de productos para embalaje.
                </p>
              </div>
            </div>

            {completedOrdersForShipping.length === 0 ? (
              <div className={styles.card} style={{ padding: '50px 20px', textAlign: 'center', color: '#64748B' }}>
                <Truck size={40} style={{ color: '#2563EB', opacity: 0.6, marginBottom: '10px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No hay órdenes pagadas pendientes de despacho en este momento.</p>
              </div>
            ) : (
              <div className={styles.deliveryListGrid}>
                {completedOrdersForShipping.map(order => {
                  const items = Array.isArray(order.items) ? order.items : []
                  const isExpress = order.delivery_type === 'santiago' || order.delivery_type === 'express'
                  const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '')

                  return (
                    <div key={order.id || order.order_number} className={styles.deliveryCard}>
                      <div className={styles.deliveryCardHeader}>
                        <div>
                          <span className={styles.deliveryOrderNum}>#{order.order_number}</span>
                          <div className={styles.deliveryCustomerName}>{order.customer_name}</div>
                        </div>

                        <span className={isExpress ? styles.badgeDeliveryExpress : styles.badgeDeliveryStarken}>
                          {isExpress ? 'Express Rancagua/RM' : 'Regiones (Starken)'}
                        </span>
                      </div>

                      {/* Dirección de Entrega */}
                      <div className={styles.deliveryAddressBox}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748B' }}>
                            Dirección de Destino:
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleCopyAddress(order)}
                            style={{ background: 'transparent', border: 'none', color: '#E11D48', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', fontWeight: 700 }}
                            title="Copiar dirección"
                          >
                            <Copy size={11} /> Copiar
                          </button>
                        </div>
                        <div className={styles.deliveryAddressText}>
                          {order.delivery_address || 'Dirección no especificada'}
                        </div>
                        <div className={styles.deliveryCityText}>
                          {order.delivery_city || 'Chile'}
                        </div>
                        {order.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#B45309', background: '#FEF3C7', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                            Nota: {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Tabla de Productos a Empaquetar */}
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                          Productos a Despachar:
                        </span>
                        <table className={styles.deliveryItemsTable} style={{ marginTop: '6px' }}>
                          <tbody>
                            {items.length > 0 ? (
                              items.map((it, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{it.name || it.title}</td>
                                  <td style={{ textAlign: 'center', color: '#64748B' }}>x{it.quantity}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                    {formatPrice(it.price * it.quantity)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} style={{ color: '#94A3B8', fontStyle: 'italic' }}>Compra general de tienda</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer con Acciones */}
                      <div className={styles.deliveryCardFooter}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Total Pagado: </span>
                          <strong style={{ color: '#0F172A' }}>{formatPrice(order.total_amount)}</strong>
                        </div>

                        {cleanPhone && (
                          <a 
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${order.customer_name}, te escribo de INKEDSOUH sobre tu pedido #${order.order_number}. Tu despacho está siendo preparado.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <Phone size={12} /> Contactar WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Detalle de Orden */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>DETALLE DE COMPRA</span>
                <h3 className={styles.modalTitle}>Orden #{selectedOrder.order_number}</h3>
              </div>
              <button 
                type="button" 
                className={styles.modalCloseBtn}
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Info Cliente */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{selectedOrder.customer_name}</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>Email: {selectedOrder.customer_email || 'No especificado'}</div>
                {selectedOrder.customer_phone && (
                  <div style={{ fontSize: '0.85rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                    Teléfono / WhatsApp: {selectedOrder.customer_phone}
                  </div>
                )}
              </div>

              {/* Entrega */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase' }}>
                  Datos de Entrega:
                </div>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                  {selectedOrder.delivery_address || 'Sin dirección registrada'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {selectedOrder.delivery_city || 'Chile'}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span className={selectedOrder.delivery_type === 'santiago' || selectedOrder.delivery_type === 'express' ? styles.badgeDeliveryExpress : styles.badgeDeliveryStarken}>
                    {selectedOrder.delivery_type === 'santiago' || selectedOrder.delivery_type === 'express' ? 'Envío Express Rancagua & RM' : 'Regiones (Starken por pagar)'}
                  </span>
                </div>
              </div>

              {/* Desglose de Productos */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', marginBottom: '8px' }}>
                  Productos Comprados:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', color: '#475569' }}>Producto</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>Cant.</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>Precio</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#0F172A' }}>{it.name || it.title}</td>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#64748B' }}>{it.quantity}</td>
                          <td style={{ padding: '10px', textAlign: 'right', color: '#64748B' }}>{formatPrice(it.price)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                            {formatPrice(it.price * it.quantity)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '14px', textAlign: 'center', color: '#94A3B8' }}>
                          Sin desglose de items disponible.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                        Total Orden:
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: '#E11D48' }}>
                        {formatPrice(selectedOrder.total_amount)} CLP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className={styles.modalFooter}>
              {!(selectedOrder.payment_status === 'pagado' || selectedOrder.status === 'pagado' || selectedOrder.status === 'completada') && (
                <>
                  <button 
                    type="button" 
                    className={styles.actionBtnDelete}
                    onClick={() => handleDeleteOrder(selectedOrder)}
                    style={{ marginRight: 'auto' }}
                  >
                    <Trash2 size={14} />
                    <span>Eliminar Orden</span>
                  </button>

                  <button 
                    type="button" 
                    className={styles.actionBtnConfirm}
                    onClick={() => handleConfirmPayment(selectedOrder)}
                  >
                    <Check size={14} />
                    <span>Confirmar Pago Recibido</span>
                  </button>
                </>
              )}

              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={() => setSelectedOrder(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
