'use client'
import { useState, useEffect } from 'react'
import { 
  ShoppingBag, ShoppingCart, Plus, Minus, X, Search, 
  Check, ChevronRight, ChevronDown, Sparkles, Tag, ShieldCheck, 
  Star, MessageCircle, ArrowRight, CreditCard, Building2,
  Zap, Copy, CheckCircle2, Truck, MapPin, User, Mail, Phone,
  FileText, ExternalLink, RefreshCw, AlertCircle, ArrowLeft,
  Gift, Flame, Package
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { 
  parseProductSpecifications, 
  calculateTotalVariantStock, 
  calculateBundleTotals,
  calculateDiscountSavings,
  isProductBundle,
  formatCLP,
  isVideoUrl,
  calculateInstallmentAmount
} from '@/lib/productUtils'
import { getBancameWidget } from '@bancame/widget-js'
import styles from './productos.module.css'

// Flag para activar o desactivar Banca.me hasta tener las credenciales oficiales
const IS_BANCAME_ENABLED = process.env.NEXT_PUBLIC_ENABLE_BANCAME === 'true'

export default function ProductosPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('+56930254425')

  // Product Quickview / Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [specsExpanded, setSpecsExpanded] = useState(false)

  // Multi-Step Checkout Modal
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('details') // 'details' | 'payment' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('flow') // 'flow' | 'transfer' | 'whatsapp' | 'bancame'
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('24h hábiles Rancagua / Machalí • 24 a 48h RM • 2 a 4 días Regiones')
  const [expressShippingCost, setExpressShippingCost] = useState(3990)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryType: 'santiago', // 'santiago' (express) | 'starken' (por pagar)
    address: '',
    city: 'Santiago',
    notes: ''
  })
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [simulationData, setSimulationData] = useState(null)
  const [bancameError, setBancameError] = useState(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])

        // Load contact WhatsApp
        const { data: profile } = await supabase.from('admin_profile').select('whatsapp_number').single()
        if (profile?.whatsapp_number) {
          setWhatsappNumber(profile.whatsapp_number)
        }

        // Load services and express shipping fee from /api/services
        try {
          const svcRes = await fetch('/api/services', { cache: 'no-store' })
          if (svcRes.ok) {
            const svcData = await svcRes.json()
            if (svcData.expressShippingCost) {
              setExpressShippingCost(svcData.expressShippingCost)
            }
            if (svcData.deliveryTimeframe) {
              setDeliveryTimeframe(svcData.deliveryTimeframe)
            }
          }
        } catch (e) {
          console.warn('Error fetching /api/services in products:', e)
        }
      } catch (err) {
        console.error('Error al cargar productos:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const formatPrice = (price) => formatCLP(price || 0)
  const getDiscountedPrice = (price, discount) => Math.round(price * (1 - (discount || 0) / 100))

  // Open Product Modal
  const openDetailModal = (product) => {
    setSelectedProduct(product)
    setActiveImageIdx(0)
    setSelectedQuantity(1)

    const { variantConfig } = parseProductSpecifications(product.specifications)
    if (variantConfig.enabled && Array.isArray(variantConfig.variants) && variantConfig.variants.length > 0) {
      // Pick first in-stock variant, or the first variant in list
      const inStock = variantConfig.variants.find(v => (parseInt(v.stock) || 0) > 0)
      setSelectedVariant(inStock || variantConfig.variants[0])
    } else {
      setSelectedVariant(null)
    }
  }

  // Add item to Cart
  const addToCart = (product, variant = null, quantity = 1, e = null, openDrawer = true) => {
    if (e) e.stopPropagation()

    const { variantConfig } = parseProductSpecifications(product.specifications)
    const hasVariants = variantConfig.enabled && variantConfig.variants && variantConfig.variants.length > 0
    
    // If product has variants and no variant was specified, open modal so user can pick
    const targetVariant = variant !== null ? variant : (hasVariants ? selectedVariant : null)
    if (hasVariants && !targetVariant) {
      openDetailModal(product)
      return
    }

    const itemId = targetVariant 
      ? `${product.id}_${targetVariant.id || targetVariant.name}` 
      : product.id

    const itemPrice = targetVariant?.price ? parseFloat(targetVariant.price) : parseFloat(product.price || 0)
    const itemStock = targetVariant ? (parseInt(targetVariant.stock) || 0) : (parseInt(product.stock) || 0)
    const itemSku = targetVariant?.sku || product.sku || 'N/A'

    if (itemStock <= 0) return

    const existing = cart.find(item => item.id === itemId)
    if (existing) {
      const newQty = existing.quantity + quantity
      if (newQty > itemStock) return
      setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQty } : item))
    } else {
      const mainImg = product.image_url || (product.images && product.images[0]) || null
      const newItem = {
        id: itemId,
        productId: product.id,
        name: product.name,
        category: product.category,
        variantName: targetVariant?.name || null,
        variantSku: itemSku,
        variantAttribute: variantConfig.name || 'Medida / Calibre',
        isBundle: isProductBundle(product),
        price: itemPrice,
        discount: product.discount || 0,
        stock: itemStock,
        image_url: mainImg,
        quantity: Math.min(quantity, itemStock)
      }
      setCart([...cart, newItem])
    }

    if (openDrawer) {
      setCartOpen(true)
    }
  }

  // Comprar Ahora (1-Click Express Checkout)
  const handleBuyNow = (product, variant = null, quantity = 1) => {
    addToCart(product, variant, quantity, null, false)
    setSelectedProduct(null)
    setCartOpen(false)
    setCheckoutStep('details')
    setCheckoutOpen(true)
  }

  const updateQuantity = (id, delta) => {
    setCart(cart.map((item) => {
      if (item.id !== id) return item
      const newQty = item.quantity + delta
      if (newQty <= 0) return null
      if (newQty > item.stock) return item
      return { ...item, quantity: newQty }
    }).filter(Boolean))
  }

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id))

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price
    return sum + price * item.quantity
  }, 0)

  const isExpressShipping = customerInfo.deliveryType === 'santiago'
  const shippingFee = isExpressShipping ? expressShippingCost : 0
  const finalCheckoutTotal = cartTotal + shippingFee

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Categories extraction
  const dynamicCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
  const allCategories = ['Todos', ...Array.from(new Set([...PRODUCT_CATEGORIES, ...dynamicCategories]))]

  // Filter products
  const filtered = products.filter((p) => {
    const { variantConfig: pVarConf } = parseProductSpecifications(p.specifications)
    const variantNames = (pVarConf.variants || []).map(v => `${v.name} ${v.sku}`).join(' ')

    const matchCategory = activeCategory === 'Todos' || p.category === activeCategory
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
                        variantNames.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  // Parse product images
  const getProductImages = (product) => {
    if (!product) return []
    let imgs = []
    if (Array.isArray(product.images)) imgs = product.images
    else if (typeof product.images === 'string') {
      try { imgs = JSON.parse(product.images) } catch { imgs = [] }
    }
    if (product.image_url && !imgs.includes(product.image_url)) {
      imgs = [product.image_url, ...imgs]
    }
    return imgs.length > 0 ? imgs : (product.image_url ? [product.image_url] : [])
  }

  // Handle Copy Bank Details
  const handleCopyBankDetails = () => {
    const bankText = `DATOS PARA TRANSFERENCIA BANCARIA - INKEDSOUH\n` +
      `Banco: Banco Estado\n` +
      `Tipo de Cuenta: Cuenta Vista / RUT\n` +
      `N° de Cuenta: 19.823.419-5\n` +
      `Titular: InkedSouh Tattoo Studio\n` +
      `RUT: 19.823.419-5\n` +
      `Correo: pagos@inkedsouh.com\n` +
      `Monto a Transferir: ${formatPrice(finalCheckoutTotal)} CLP`
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bankText)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 3000)
    }
  }

  // Handle Multi-Method Order Submission
  const handleProcessCheckout = async (e) => {
    if (e) e.preventDefault()
    if (cart.length === 0) return

    setOrderProcessing(true)
    setBancameError(null)
    setSimulationData(null)
    const orderNumber = `INK-${Math.floor(100000 + Math.random() * 900000)}`

    try {
      if (paymentMethod === 'flow') {
        const flowRes = await fetch('/api/flow/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'product',
            amount: finalCheckoutTotal,
            shippingCost: shippingFee,
            orderNumber,
            customer: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone
            },
            items: cart,
            deliveryType: customerInfo.deliveryType,
            deliveryAddress: customerInfo.address,
            deliveryCity: customerInfo.city,
            deliveryNotes: customerInfo.notes,
            deliveryTimeframe
          })
        })

        const flowData = await flowRes.json()

        if (!flowRes.ok || !flowData.success) {
          throw new Error(flowData.error || 'No se pudo iniciar la pasarela de pago Flow.')
        }

        setCart([])
        if (flowData.redirectUrl) {
          window.location.href = flowData.redirectUrl
          return
        }
      }

      if (paymentMethod === 'bancame') {
        // Iniciar sesión con Banca.me API
        const res = await fetch('/api/bancame/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalCheckoutTotal,
            shippingCost: shippingFee,
            orderNumber,
            customer: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone
            },
            items: cart,
            deliveryType: customerInfo.deliveryType,
            deliveryAddress: customerInfo.address,
            deliveryCity: customerInfo.city,
            deliveryNotes: customerInfo.notes,
            deliveryTimeframe
          })
        })

        const session = await res.json()

        if (!res.ok) {
          throw new Error(session?.error || 'No se pudo iniciar la sesión de pago con Banca.me.')
        }

        // Si estamos en modo simulación (sin API key real aún o sandbox)
        if (session.mode === 'simulation' || session.mode === 'sandbox_fallback') {
          setSimulationData({
            orderNumber: session.orderNumber,
            widgetToken: session.widgetToken,
            publicKey: session.publicKey,
            warning: session.warning,
            message: session.message
          })
          setOrderProcessing(false)
          return
        }

        // Si estamos en modo live (API key configurada)
        if (session.widgetToken) {
          try {
            const bancame = await getBancameWidget()
            if (!bancame) {
              throw new Error('El SDK de Banca.me no se pudo inicializar en el navegador.')
            }

            const widget = bancame.create({
              widgetToken: session.widgetToken,
              publicKey: session.publicKey || process.env.NEXT_PUBLIC_BANCAME_PUBLIC_KEY,
              onSuccess: async (trxData) => {
                console.log('[Banca.me Success]:', trxData)
                await supabase
                  .from('orders')
                  .update({
                    status: 'pagado_bnpl',
                    payment_status: 'aprobado',
                    bancame_trx_id: trxData?.id || null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('order_number', session.orderNumber)
                  .catch(() => {})

                setSubmittedOrder({
                  orderNumber: session.orderNumber,
                  date: new Date().toLocaleDateString('es-CL'),
                  total: cartTotal,
                  items: [...cart],
                  paymentMethod: 'bancame',
                  deliveryType: customerInfo.deliveryType,
                  status: 'Aprobado y Pagado en Cuotas'
                })
                setCart([])
                setCheckoutStep('success')
                setOrderProcessing(false)
              },
              onError: (err) => {
                console.error('[Banca.me Error]:', err)
                setBancameError(err?.message || 'Ocurrió un error en el widget de Banca.me.')
                setOrderProcessing(false)
              },
              onReject: (rej) => {
                console.warn('[Banca.me Rejected]:', rej)
                setBancameError('Tu solicitud de cuotas no fue pre-aprobada por el sistema. Puedes optar por Transferencia Bancaria.')
                setOrderProcessing(false)
              },
              onExit: () => {
                setOrderProcessing(false)
              }
            })

            widget.open()
            return
          } catch (widgetErr) {
            console.error('[Banca.me Widget Launch Error]:', widgetErr)
            setSimulationData({
              orderNumber: session.orderNumber,
              widgetToken: session.widgetToken,
              warning: 'No se pudo abrir el widget externo. Se activó el panel de verificación.'
            })
            setOrderProcessing(false)
            return
          }
        }
      }

      // Método Transferencia Bancaria o WhatsApp
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customer: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          items: cart,
          totalAmount: finalCheckoutTotal,
          shippingCost: shippingFee,
          paymentMethod,
          deliveryType: customerInfo.deliveryType,
          deliveryAddress: customerInfo.address,
          deliveryCity: customerInfo.city,
          deliveryNotes: customerInfo.notes,
          deliveryTimeframe
        })
      })

      const orderData = await orderRes.json()
      const effectiveOrderNumber = orderData?.orderNumber || orderNumber

      setSubmittedOrder({
        orderNumber: effectiveOrderNumber,
        date: new Date().toLocaleDateString('es-CL'),
        total: finalCheckoutTotal,
        shippingCost: shippingFee,
        items: [...cart],
        paymentMethod,
        deliveryType: customerInfo.deliveryType
      })

      // Si es WhatsApp, abrir chat de inmediato
      if (paymentMethod === 'whatsapp') {
        let msg = `Estimado equipo InkedSouh,\nAcabo de generar la orden *#${effectiveOrderNumber}* desde la tienda web:\n\n`
        msg += `*DATOS DEL CLIENTE:*\n`
        msg += `• Nombre: ${customerInfo.name || 'Cliente'}\n`
        msg += `• Teléfono: ${customerInfo.phone || 'No especificado'}\n`
        msg += `• Modalidad de Envío: ${customerInfo.deliveryType === 'santiago' ? `Envío Express RM (${customerInfo.address}, ${customerInfo.city})` : `Envío por Pagar Starken/Chilexpress (${customerInfo.address}, ${customerInfo.city})`}\n`
        msg += `• Plazo Estimado: ${deliveryTimeframe}\n\n`
        msg += `*DETALLE DE PRODUCTOS:*\n`
        cart.forEach((item, idx) => {
          const unitPrice = item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price
          msg += `${idx + 1}. *${item.name}* ${item.variantName ? `(${item.variantAttribute || 'Medida'}: ${item.variantName})` : ''} - ${item.quantity} un. x ${formatPrice(unitPrice)}\n`
        })
        msg += `\n*TOTAL A PAGAR: ${formatPrice(cartTotal)} CLP*\n\n`
        msg += `Solicito confirmación para coordinar el pago y despacho. Muchas gracias.`

        const cleanPhone = (whatsappNumber || '+56930254425').replace(/[^0-9]/g, '')
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
        window.open(url, '_blank')
      }

      setCart([])
      setCheckoutStep('success')
    } catch (err) {
      console.error('Error procesando pedido:', err)
      setBancameError(err?.message || 'Error al procesar la orden.')
    } finally {
      setOrderProcessing(false)
    }
  }

  // Simular aprobación de Banca.me (Sandbox)
  const handleSimulateBancameSuccess = async () => {
    if (!simulationData) return
    setOrderProcessing(true)
    try {
      await supabase
        .from('orders')
        .update({
          status: 'pagado_bnpl',
          payment_status: 'aprobado',
          bancame_trx_id: `sim_approved_${Date.now()}`,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', simulationData.orderNumber)
        .catch(() => {})

      setSubmittedOrder({
        orderNumber: simulationData.orderNumber,
        date: new Date().toLocaleDateString('es-CL'),
        total: cartTotal,
        items: [...cart],
        paymentMethod: 'bancame',
        deliveryType: customerInfo.deliveryType,
        status: 'Aprobado en Cuotas (Simulación Sandbox)'
      })
      setSimulationData(null)
      setCart([])
      setCheckoutStep('success')
    } catch (err) {
      console.error('Error simulando éxito:', err)
    } finally {
      setOrderProcessing(false)
    }
  }

  // Simular rechazo de Banca.me (Sandbox)
  const handleSimulateBancameReject = async () => {
    if (!simulationData) return
    try {
      await supabase
        .from('orders')
        .update({
          status: 'rechazado',
          payment_status: 'rechazado',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', simulationData.orderNumber)
        .catch(() => {})

      alert('Simulación: Solicitud de crédito evaluada y rechazada por políticas crediticias. Por favor selecciona Transferencia Bancaria o WhatsApp para continuar tu compra.')
      setSimulationData(null)
    } catch (err) {
      console.error('Error simulando rechazo:', err)
    }
  }

  // Handle WhatsApp Direct Message from Cart
  const handleWhatsAppCheckout = () => {
    setCartOpen(false)
    setCheckoutOpen(true)
    setCheckoutStep('details')
  }

  // Direct WhatsApp query from product modal
  const handleDirectWhatsAppQuery = (product, variant) => {
    const cleanPhone = (whatsappNumber || '+56930254425').replace(/[^0-9]/g, '')
    let msg = `Hola, deseo consultar sobre la disponibilidad del producto *${product.name}*`
    if (variant) {
      msg += ` en la medida/calibre *${variant.name}* (SKU: ${variant.sku})`
    }
    msg += `. ¿Tienen stock disponible para entrega o despacho?`
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionTitle subtitle="Insumos profesionales para tatuadores: agujas, tintas y cuidado">
            CATÁLOGO & PRODUCTOS
          </SectionTitle>

          {/* Barra de búsqueda y filtros dinámicos */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por calibre (1207, 1007MC), aguja, tinta..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className={styles.filters}>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterActive : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de productos sincronizados con HONE CATALOG */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '80px' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(225,29,72,0.2)', borderTopColor: '#E11D48', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              Cargando catálogo en tiempo real...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#475569', padding: '80px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px dashed #CBD5E1', maxWidth: '600px', margin: '40px auto', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
              <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.7, color: '#E11D48' }} />
              <h3 style={{ color: '#0F172A' }}>Aún no tenemos productos disponibles</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '8px' }}>
                Los productos creados y sincronizados desde HONE CATALOG aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((product) => {
                const productImages = getProductImages(product)
                const mainImage = productImages[0] || product.image_url
                const { variantConfig, bundleConfig } = parseProductSpecifications(product.specifications)
                const isBundle = isProductBundle(product)
                const hasVariants = variantConfig.enabled && variantConfig.variants && variantConfig.variants.length > 0
                const totalStock = hasVariants ? calculateTotalVariantStock(variantConfig.variants) : product.stock

                return (
                  <div key={product.id} className={styles.card} onClick={() => openDetailModal(product)} style={{ cursor: 'pointer' }}>
                    <div className={styles.cardImage}>
                      {mainImage ? (
                        isVideoUrl(mainImage) ? (
                          <video 
                            src={mainImage} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <img src={mainImage} alt={product.name} loading="lazy" />
                        )
                      ) : (
                        <ShoppingBag size={36} />
                      )}

                      {/* Badges */}
                      {isBundle ? (
                        <span className={styles.comboBadgeStore}>
                          <Package size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                          PACK COMBO
                        </span>
                      ) : product.badge ? (
                        <span className={styles.discountBadge} style={{ background: '#E11D48', left: '12px', right: 'auto' }}>
                          {product.badge}
                        </span>
                      ) : null}

                      {product.discount > 0 && (
                        <span className={styles.discountBadge}>-{product.discount}%</span>
                      )}
                      
                      {totalStock <= 0 && (
                        <div className={styles.outOfStock}>AGOTADO</div>
                      )}

                      {productImages.length > 1 && (
                        <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.75)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
                          +{productImages.length} fotos
                        </span>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <span className={styles.cardCategory}>{product.category}</span>
                      <h3 className={styles.cardName}>{product.name}</h3>

                      {/* Pill indicating combo pack */}
                      {isBundle && bundleConfig.items?.length > 0 && (
                        <div style={{ marginTop: '2px', marginBottom: '2px' }}>
                          <span className={styles.comboCardPill}>
                            <Package size={11} />
                            Pack Promocional ({bundleConfig.items.length} productos)
                          </span>
                        </div>
                      )}

                      {/* Pill indicating variety of sizes/measures */}
                      {hasVariants && (
                        <div style={{ marginTop: '2px', marginBottom: '2px' }}>
                          <span className={styles.cardVariantPill}>
                            {variantConfig.variants.length} {variantConfig.name || 'Medidas'}
                          </span>
                        </div>
                      )}

                      <p className={styles.cardDesc}>{product.description || 'Insumo profesional testeado por tatuadores.'}</p>
                      
                      <div className={styles.cardFooter}>
                        <div className={styles.priceWrap}>
                          {product.discount > 0 ? (
                            <>
                              <span className={styles.price}>
                                {formatPrice(getDiscountedPrice(product.price, product.discount))}
                              </span>
                              <span className={styles.priceOriginal}>{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <span className={styles.price}>{formatPrice(product.price)}</span>
                          )}
                        </div>
                        <button
                          className={styles.cardActionBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetailModal(product)
                          }}
                          disabled={totalStock <= 0}
                          title={totalStock <= 0 ? "Sin stock disponible" : (hasVariants ? "Elegir Medida / Calibre" : "Ver detalles y comprar")}
                        >
                          <ShoppingCart size={14} />
                          <span>{totalStock <= 0 ? 'Agotado' : (hasVariants ? 'Elegir' : 'Comprar')}</span>
                        </button>
                      </div>

                      <span className={totalStock > 0 ? styles.stockLabel : styles.stockOut}>
                        {totalStock > 0 ? `${totalStock} disponibles` : 'Sin stock disponible'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Product Quickview / Lightbox Modal (Exact Match to Reference Photos 1 & 2) */}
        {selectedProduct && (() => {
          const { attributes: modalSpecs, variantConfig: modalVarConfig, bundleConfig: modalBundleConfig } = parseProductSpecifications(selectedProduct.specifications)
          const isBundle = isProductBundle(selectedProduct)
          const hasVariants = modalVarConfig.enabled && modalVarConfig.variants && modalVarConfig.variants.length > 0
          const modalImgs = getProductImages(selectedProduct)
          const currentImg = modalImgs[activeImageIdx] || selectedProduct.image_url

          // Active variant or base product attributes
          const activeSku = selectedVariant ? (selectedVariant.sku || selectedProduct.sku) : selectedProduct.sku
          const activeStock = selectedVariant ? (parseInt(selectedVariant.stock) || 0) : (parseInt(selectedProduct.stock) || 0)
          const activeBasePrice = selectedVariant?.price ? parseFloat(selectedVariant.price) : parseFloat(selectedProduct.price || 0)
          const activeDiscountedPrice = selectedProduct.discount > 0 ? getDiscountedPrice(activeBasePrice, selectedProduct.discount) : activeBasePrice

          return (
            <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className={styles.modalCloseBtn}
                  title="Cerrar ventana"
                >
                  <X size={20} />
                </button>

                {/* Left Column: Gallery Lightbox */}
                <div className={styles.modalGalleryCol}>
                  <div className={styles.modalMainImageWrap}>
                    {currentImg ? (
                      isVideoUrl(currentImg) ? (
                        <video 
                          src={currentImg} 
                          autoPlay 
                          muted 
                          loop 
                          playsInline 
                          controls 
                          className={styles.modalMainImage} 
                        />
                      ) : (
                        <img src={currentImg} alt={selectedProduct.name} className={styles.modalMainImage} />
                      )
                    ) : (
                      <ShoppingBag size={56} style={{ color: '#64748B' }} />
                    )}
                    {isBundle ? (
                      <span className={styles.comboBadgeStore}>
                        <Package size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                        PACK PROMOCIONAL
                      </span>
                    ) : selectedProduct.badge ? (
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#E11D48', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                        {selectedProduct.badge}
                      </span>
                    ) : null}
                  </div>

                  {/* Gallery Thumbnails */}
                  {modalImgs.length > 1 && (
                    <div className={styles.modalThumbnails}>
                      {modalImgs.map((imgUrl, idx) => (
                        isVideoUrl(imgUrl) ? (
                          <video 
                            key={idx} 
                            src={imgUrl} 
                            muted 
                            playsInline 
                            onClick={() => setActiveImageIdx(idx)}
                            className={`${styles.modalThumb} ${activeImageIdx === idx ? styles.modalThumbActive : ''}`}
                          />
                        ) : (
                          <img 
                            key={idx} 
                            src={imgUrl} 
                            alt="thumb" 
                            onClick={() => setActiveImageIdx(idx)}
                            className={`${styles.modalThumb} ${activeImageIdx === idx ? styles.modalThumbActive : ''}`}
                          />
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Product Info & Variant Selector */}
                <div className={styles.modalInfoCol}>
                  <div>
                    <span className={styles.categoryTopBadge}>{selectedProduct.category}</span>
                    <h2 className={styles.modalTitle} style={{ marginBottom: '12px' }}>{selectedProduct.name}</h2>

                    {/* SKU & Stock Box */}
                    <div className={styles.skuStockBox}>
                      <div className={styles.skuCell}>
                        SKU: <span style={{ color: '#0F172A', fontFamily: 'monospace' }}>{activeSku || 'N/A'}</span>
                      </div>
                      <div className={styles.stockCell}>
                        STOCK: <span style={{ color: activeStock > 0 ? '#059669' : '#DC2626' }}>{activeStock}</span>
                      </div>
                    </div>

                    {/* COMBO PACK CONTENTS SECTION */}
                    {isBundle && modalBundleConfig.enabled && modalBundleConfig.items?.length > 0 && (
                      <div className={styles.comboModalSection}>
                        <div className={styles.comboModalTitle}>
                          <Package size={16} color="#D97706" />
                          <span>Contenido de este Pack ({modalBundleConfig.items.length} productos)</span>
                        </div>

                        <div className={styles.comboModalItemsList}>
                          {modalBundleConfig.items.map((bItem, bIdx) => (
                            <div key={bIdx} className={styles.comboModalItemRow}>
                              <div className={styles.comboModalItemInfo}>
                                {bItem.image_url ? (
                                  <img src={bItem.image_url} alt={bItem.name} className={styles.comboModalItemThumb} />
                                ) : (
                                  <div className={styles.comboModalItemThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShoppingBag size={14} color="#64748B" />
                                  </div>
                                )}
                                <div>
                                  <div className={styles.comboModalItemName}>{bItem.name}</div>
                                  <div className={styles.comboModalItemQty}>
                                    Incluye: <strong style={{ color: '#0F172A' }}>{bItem.quantity || 1} un.</strong> {bItem.sku ? `• SKU: ${bItem.sku}` : ''}
                                  </div>
                                </div>
                              </div>
                              <div className={styles.comboModalItemPrice}>
                                {bItem.price ? formatPrice(bItem.price * (bItem.quantity || 1)) : ''}
                              </div>
                            </div>
                          ))}
                        </div>

                        {(() => {
                          const { totalOriginalPrice } = calculateBundleTotals(modalBundleConfig.items)
                          const currentPrice = selectedProduct.price || 0
                          if (totalOriginalPrice > currentPrice) {
                            const { savingsAmount, discountPercentage } = calculateDiscountSavings(totalOriginalPrice, currentPrice)
                            return (
                              <div className={styles.comboSavingsBox}>
                                <span>Valor individual referencial: <span style={{ textDecoration: 'line-through', opacity: 0.8 }}>{formatPrice(totalOriginalPrice)}</span></span>
                                <span>Ahorras {formatPrice(savingsAmount)} ({discountPercentage}% OFF)</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    )}

                    {/* VARIANT SELECTOR */}
                    {hasVariants && (
                      <div className={styles.variantSection}>
                        <label className={styles.variantLabel}>
                          {modalVarConfig.name || 'Calibre / Medida'}
                        </label>

                        {/* Interactive Chips Grid */}
                        <div className={styles.variantButtonsGrid}>
                          {modalVarConfig.variants.map((v, vIdx) => {
                            const isSelected = selectedVariant?.id ? selectedVariant.id === v.id : selectedVariant?.name === v.name
                            const vStock = parseInt(v.stock) || 0
                            const isOut = vStock <= 0

                            return (
                              <button
                                key={v.id || vIdx}
                                type="button"
                                onClick={() => {
                                  setSelectedVariant(v)
                                  setSelectedQuantity(1)
                                }}
                                disabled={isOut}
                                className={`
                                  ${styles.variantBtn}
                                  ${isSelected ? styles.variantBtnSelected : ''}
                                  ${isOut ? styles.variantBtnDisabled : ''}
                                `}
                                title={isOut ? `${v.name} (Agotado)` : `${v.name} - SKU: ${v.sku || 'N/A'} (${vStock} disponibles)`}
                              >
                                {v.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price & Quantity Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '10px', padding: '12px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                      <div className={styles.priceSection} style={{ marginTop: 0 }}>
                        <span className={styles.priceLabel}>Precio</span>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                          <span className={styles.priceDisplay}>
                            {formatPrice(activeDiscountedPrice)} CLP
                          </span>
                          {selectedProduct.old_price > selectedProduct.price && (
                            <span className={styles.priceOldDisplay}>
                              {formatPrice(selectedProduct.old_price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.qtySection} style={{ marginTop: 0 }}>
                        <span className={styles.qtySectionLabel}>Cant:</span>
                        <div className={styles.qtyBox}>
                          <button 
                            type="button" 
                            onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                            disabled={selectedQuantity <= 1 || activeStock <= 0}
                            className={styles.qtyButton}
                          >
                            <Minus size={14} />
                          </button>
                          <span className={styles.qtyValue}>{activeStock <= 0 ? 0 : selectedQuantity}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedQuantity(Math.min(activeStock, selectedQuantity + 1))}
                            disabled={selectedQuantity >= activeStock || activeStock <= 0}
                            className={styles.qtyButton}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dual Action Buttons: Comprar Ahora & Añadir al Carro */}
                    <div className={styles.modalActionButtonsRow} style={{ marginTop: '14px' }}>
                      <button
                        type="button"
                        onClick={() => handleBuyNow(selectedProduct, selectedVariant, selectedQuantity)}
                        disabled={activeStock <= 0}
                        className={styles.btnBuyNow}
                      >
                        <CreditCard size={18} />
                        <span>{activeStock > 0 ? 'COMPRAR AHORA' : 'AGOTADO'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          addToCart(selectedProduct, selectedVariant, selectedQuantity, null, true)
                          setSelectedProduct(null)
                        }}
                        disabled={activeStock <= 0}
                        className={styles.btnAddToCartSecondary}
                      >
                        <ShoppingCart size={18} />
                        <span>Añadir al Carro</span>
                      </button>
                    </div>

                    {/* Clean Dispatch Note below action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', marginTop: '12px' }}>
                      <Truck size={15} style={{ color: '#E11D48', flexShrink: 0 }} />
                      <span><strong>Despacho desde Rancagua:</strong> 24h Rancagua / Machalí • 24-48h RM • Starken a Regiones</span>
                    </div>

                    {/* Collapsible Ficha Técnica */}
                    {modalSpecs.length > 0 && (
                      <div>
                        <button 
                          type="button" 
                          className={styles.specsToggleBtn}
                          onClick={() => setSpecsExpanded(!specsExpanded)}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={14} style={{ color: '#E11D48' }} />
                            Especificaciones Técnicas
                          </span>
                          <ChevronDown size={16} style={{ transform: specsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                        </button>

                        {specsExpanded && (
                          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                            {modalSpecs.map((s, idx) => (
                              <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px' }}>
                                <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>{s.key}</div>
                                <div style={{ color: '#0F172A', fontSize: '0.82rem', fontWeight: 700 }}>{s.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Botón flotante del carrito */}
        {cartCount > 0 && (
          <button className={styles.cartFloat} onClick={() => setCartOpen(true)}>
            <ShoppingCart size={22} />
            <span className={styles.cartBadge}>{cartCount}</span>
          </button>
        )}

        {/* Drawer del carrito */}
        {cartOpen && (
          <div className={styles.cartOverlay} onClick={() => setCartOpen(false)}>
            <div className={styles.cartPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.cartHeader}>
                <h3 className={styles.cartTitle}>
                  <ShoppingCart size={20} /> Tu Carrito ({cartCount})
                </h3>
                <button className={styles.cartCloseBtn} onClick={() => setCartOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>
                  <ShoppingBag size={40} />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className={styles.cartItems}>
                    {cart.map((item) => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemInfo}>
                          <h4>{item.name}</h4>

                          {/* Combo Pack badge in cart */}
                          {item.isBundle && (
                            <span className={styles.comboCardPill} style={{ margin: '2px 0', fontSize: '0.68rem', padding: '1px 6px' }}>
                              <Gift size={11} /> Combo Pack
                            </span>
                          )}

                          {/* Selected variant badge in cart */}
                          {item.variantName && (
                            <span className={styles.cartVariantInfo}>
                              {item.variantAttribute || 'Medida'}: <strong>{item.variantName}</strong>
                              {item.variantSku && item.variantSku !== 'N/A' ? ` (${item.variantSku})` : ''}
                            </span>
                          )}

                          <span className={styles.cartItemPrice}>
                            {formatPrice(item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price)}
                          </span>
                        </div>
                        <div className={styles.cartItemActions}>
                          <button onClick={() => updateQuantity(item.id, -1)} className={styles.qtyBtn}>
                            <Minus size={14} />
                          </button>
                          <span className={styles.qtyNum}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className={styles.qtyBtn} disabled={item.quantity >= item.stock}>
                            <Plus size={14} />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} className={styles.removeBtn}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.cartFooter}>
                    <div className={styles.cartTotal}>
                      <span>Total Estimado</span>
                      <strong>{formatPrice(cartTotal)}</strong>
                    </div>

                    {/* BNPL Teaser in Cart (Condicional) */}
                    {IS_BANCAME_ENABLED && (
                      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>Hasta <strong>3 cuotas sin interés de {formatPrice(calculateInstallmentAmount(cartTotal, 3))}</strong></span>
                        <span style={{ background: '#EA580C', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>BNPL</span>
                      </div>
                    )}

                    <button 
                      type="button" 
                      onClick={() => {
                        setCartOpen(false)
                        setCheckoutOpen(true)
                        setCheckoutStep('details')
                      }}
                      className={styles.btnAddToCartLarge}
                      style={{ fontSize: '0.95rem', marginTop: '10px' }}
                    >
                      <span>Iniciar Checkout</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODAL DE CHECKOUT & MÉTODOS DE PAGO MULTI-PASO */}
        {checkoutOpen && (
          <div className={styles.checkoutOverlay} onClick={() => !orderProcessing && setCheckoutOpen(false)}>
            <div className={styles.checkoutCard} onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div className={styles.checkoutHeader}>
                <div className={styles.checkoutTitle}>
                  <CreditCard size={22} style={{ color: '#E11D48' }} />
                  <span>Proceso de Pago & Checkout</span>
                </div>
                {!orderProcessing && (
                  <button 
                    className={styles.modalCloseBtn} 
                    onClick={() => setCheckoutOpen(false)}
                    title="Cerrar checkout"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Step indicator */}
              <div className={styles.checkoutSteps}>
                <div className={`${styles.checkoutStep} ${checkoutStep === 'details' ? styles.checkoutStepActive : ''} ${(checkoutStep === 'payment' || checkoutStep === 'success') ? styles.checkoutStepDone : ''}`}>
                  {(checkoutStep === 'payment' || checkoutStep === 'success') ? <Check size={14} /> : <span>1</span>}
                  <span>Datos & Entrega</span>
                </div>
                <div className={`${styles.checkoutStep} ${checkoutStep === 'payment' ? styles.checkoutStepActive : ''} ${checkoutStep === 'success' ? styles.checkoutStepDone : ''}`}>
                  {checkoutStep === 'success' ? <Check size={14} /> : <span>2</span>}
                  <span>Método de Pago</span>
                </div>
                <div className={`${styles.checkoutStep} ${checkoutStep === 'success' ? styles.checkoutStepActive : ''}`}>
                  <span>3</span>
                  <span>Confirmación</span>
                </div>
              </div>

              {/* Body */}
              <div className={styles.checkoutBody}>

                {/* PASO 1: DATOS DEL CLIENTE Y ENTREGA */}
                {checkoutStep === 'details' && (
                  <div className={styles.checkoutGrid}>
                    {/* Columna Izquierda: Datos del Cliente */}
                    <div>
                      <h4 className={styles.checkoutSectionTitle}>
                        <User size={18} style={{ color: '#E11D48' }} /> Datos de Contacto y Entrega
                      </h4>

                      <div className={styles.formGrid}>
                        <div className={`${styles.formField} ${styles.fullCol}`}>
                          <label>Nombre y Apellido *</label>
                          <input 
                            type="text" 
                            placeholder="Ej: Camilo Henríquez" 
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className={styles.formField}>
                          <label>WhatsApp / Teléfono *</label>
                          <input 
                            type="tel" 
                            placeholder="+56 9 1234 5678" 
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            required
                          />
                        </div>

                        <div className={styles.formField}>
                          <label>Correo Electrónico *</label>
                          <input 
                            type="email" 
                            placeholder="correo@ejemplo.com" 
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                            required
                          />
                        </div>

                        <div className={`${styles.formField} ${styles.fullCol}`}>
                          <label>Dirección de Envío (Calle, número, depto / sucursal) *</label>
                          <input 
                            type="text" 
                            placeholder="Ej: Av. Providencia 1234, Depto 402" 
                            value={customerInfo.address}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                            required
                          />
                        </div>

                        <div className={`${styles.formField} ${styles.fullCol}`}>
                          <label>Comuna / Ciudad *</label>
                          <input 
                            type="text" 
                            placeholder="Ej: Rancagua, Santiago, Machalí, Viña del Mar..." 
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                            required
                          />
                        </div>

                        <div className={`${styles.formField} ${styles.fullCol}`}>
                          <label>Notas adicionales de despacho (opcional)</label>
                          <textarea 
                            rows={2} 
                            placeholder="Instrucciones para el repartidor, horarios de entrega..." 
                            value={customerInfo.notes}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Resumen de Compra + Selección de Envío */}
                    <div className={styles.checkoutOrderSummary}>
                      <h4 className={styles.checkoutSectionTitle}>
                        <ShoppingBag size={18} style={{ color: '#E11D48' }} /> Resumen ({cartCount})
                      </h4>

                      {/* Lista de productos */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {cart.map((item) => (
                          <div key={item.id} className={styles.summaryItemRow}>
                            <div className={styles.summaryItemName}>
                              <span>{item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                              <small style={{ color: '#64748B' }}>{item.quantity} un. x {formatPrice(item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price)}</small>
                            </div>
                            <span style={{ color: '#0F172A', fontWeight: 700 }}>
                              {formatPrice((item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* SELECCIÓN DE ENVÍO DIRECTAMENTE ABAJO DEL RESUMEN */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={15} style={{ color: '#E11D48' }} /> Modalidad de Envío
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Opción 1: Envío Express Rancagua & RM */}
                          <div 
                            onClick={() => setCustomerInfo({ ...customerInfo, deliveryType: 'santiago' })}
                            style={{
                              border: isExpressShipping ? '2px solid #E11D48' : '1px solid #CBD5E1',
                              background: isExpressShipping ? '#FFF1F2' : '#FFFFFF',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: isExpressShipping ? '5px solid #E11D48' : '2px solid #94A3B8', background: '#FFFFFF', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>Envío Express (Rancagua / RM)</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>24h Rancagua / Machalí • 24-48h RM</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E11D48' }}>
                              +{formatPrice(expressShippingCost)}
                            </span>
                          </div>

                          {/* Opción 2: Starken / Chilexpress Regiones Por Pagar */}
                          <div 
                            onClick={() => setCustomerInfo({ ...customerInfo, deliveryType: 'starken' })}
                            style={{
                              border: !isExpressShipping ? '2px solid #E11D48' : '1px solid #CBD5E1',
                              background: !isExpressShipping ? '#FFF1F2' : '#FFFFFF',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: !isExpressShipping ? '5px solid #E11D48' : '2px solid #94A3B8', background: '#FFFFFF', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>Por Pagar Regiones</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Starken / Chilexpress a todo Chile</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: '4px' }}>
                              Por Pagar ($0)
                            </span>
                          </div>
                        </div>

                        {/* Origen Rancagua */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748B', marginTop: '8px' }}>
                          <MapPin size={12} style={{ color: '#E11D48', flexShrink: 0 }} />
                          <span>Despacho prioritario desde nuestro estudio en Rancagua.</span>
                        </div>
                      </div>

                      {/* Desglose de Totales */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748B' }}>
                          <span>Subtotal</span>
                          <span>{formatPrice(cartTotal)} CLP</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748B' }}>
                          <span>Envío</span>
                          <span style={{ fontWeight: 600, color: isExpressShipping ? '#E11D48' : '#059669' }}>
                            {isExpressShipping ? `+${formatPrice(expressShippingCost)} CLP` : 'Por Pagar ($0)'}
                          </span>
                        </div>
                        <div className={styles.summaryTotalRow} style={{ marginTop: '2px', paddingTop: '8px' }}>
                          <span>Total</span>
                          <span style={{ color: '#E11D48' }}>{formatPrice(finalCheckoutTotal)} CLP</span>
                        </div>
                      </div>

                      {/* Botón Continuar */}
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!customerInfo.name.trim()) {
                            alert('Por favor ingresa tu nombre completo')
                            return
                          }
                          if (!customerInfo.phone.trim()) {
                            alert('Por favor ingresa tu WhatsApp de contacto')
                            return
                          }
                          if (!customerInfo.email.trim() || !customerInfo.email.includes('@')) {
                            alert('Por favor ingresa un correo electrónico válido para enviarte el comprobante de compra')
                            return
                          }
                          if (!customerInfo.address.trim()) {
                            alert('Por favor ingresa tu dirección de envío')
                            return
                          }
                          setCheckoutStep('payment')
                        }}
                        className={styles.btnAddToCartLarge}
                        style={{ fontSize: '0.95rem', marginTop: '10px', padding: '12px' }}
                      >
                        <span>Continuar al Pago</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 2: SELECCIÓN DE MÉTODO DE PAGO */}
                {checkoutStep === 'payment' && (
                  <div className={styles.checkoutGrid}>
                    {/* Columna Izquierda: Métodos de Pago */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <h4 className={styles.checkoutSectionTitle}>
                        <CreditCard size={18} style={{ color: '#E11D48' }} /> Selecciona tu Método de Pago
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* 1. FLOW (WEBPAY PLUS / MACH / SERVIPAG / REDCOMPRA) */}
                        <div 
                          className={`${styles.paymentMethodCard} ${paymentMethod === 'flow' ? styles.paymentMethodCardActive : ''}`}
                          onClick={() => setPaymentMethod('flow')}
                          style={{ padding: '12px 14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'flow' ? '5px solid #E11D48' : '2px solid #CBD5E1', background: '#FFFFFF', flexShrink: 0 }} />
                              <div className={styles.paymentIconWrap} style={{ background: '#FFF1F2', color: '#E11D48', width: '32px', height: '32px' }}>
                                <CreditCard size={16} />
                              </div>
                              <div>
                                <h5 className={styles.paymentMethodName} style={{ fontSize: '0.9rem', margin: 0 }}>Pago Online Seguro (Flow Webpay / Tarjetas)</h5>
                                <p className={styles.paymentMethodDesc} style={{ fontSize: '0.74rem', margin: '2px 0 0 0' }}>Débito, Crédito, Redcompra, Mach y Servipag</p>
                              </div>
                            </div>
                            <span className={styles.paymentBadgePill} style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', fontSize: '0.65rem' }}>
                              Recomendado
                            </span>
                          </div>
                        </div>

                        {/* 2. TRANSFERENCIA BANCARIA */}
                        <div 
                          className={`${styles.paymentMethodCard} ${paymentMethod === 'transfer' ? styles.paymentMethodCardActive : ''}`}
                          onClick={() => setPaymentMethod('transfer')}
                          style={{ padding: '12px 14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'transfer' ? '5px solid #E11D48' : '2px solid #CBD5E1', background: '#FFFFFF', flexShrink: 0 }} />
                              <div className={styles.paymentIconWrap} style={{ background: '#EFF6FF', color: '#2563EB', width: '32px', height: '32px' }}>
                                <Building2 size={16} />
                              </div>
                              <div>
                                <h5 className={styles.paymentMethodName} style={{ fontSize: '0.9rem', margin: 0 }}>Transferencia Bancaria Directa</h5>
                                <p className={styles.paymentMethodDesc} style={{ fontSize: '0.74rem', margin: '2px 0 0 0' }}>Cuenta Vista / RUT BancoEstado</p>
                              </div>
                            </div>
                            <span className={styles.paymentBadgePill} style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '0.65rem' }}>
                              Transferencia
                            </span>
                          </div>
                        </div>

                        {/* 3. WHATSAPP DIRECTO */}
                        <div 
                          className={`${styles.paymentMethodCard} ${paymentMethod === 'whatsapp' ? styles.paymentMethodCardActive : ''}`}
                          onClick={() => setPaymentMethod('whatsapp')}
                          style={{ padding: '12px 14px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: paymentMethod === 'whatsapp' ? '5px solid #E11D48' : '2px solid #CBD5E1', background: '#FFFFFF', flexShrink: 0 }} />
                              <div className={styles.paymentIconWrap} style={{ background: '#ECFDF5', color: '#059669', width: '32px', height: '32px' }}>
                                <MessageCircle size={16} />
                              </div>
                              <div>
                                <h5 className={styles.paymentMethodName} style={{ fontSize: '0.9rem', margin: 0 }}>Pedido Asistido por WhatsApp</h5>
                                <p className={styles.paymentMethodDesc} style={{ fontSize: '0.74rem', margin: '2px 0 0 0' }}>Coordina el pago y entrega directamente con el artista</p>
                              </div>
                            </div>
                            <span className={styles.paymentBadgePill} style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.65rem' }}>
                              Atención Directa
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SUB-PANEL COMPACTO INFORMATIVO SEGÚN EL MÉTODO */}
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', fontSize: '0.82rem', color: '#475569' }}>
                        {paymentMethod === 'flow' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ color: '#0F172A', fontWeight: 600 }}>
                              Serás redirigido a la pasarela Flow para pagar en un entorno encriptado 100% seguro:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>💳 Webpay Plus</span>
                              <span style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>🟣 Mach</span>
                              <span style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>🟦 Redcompra</span>
                              <span style={{ fontSize: '0.72rem', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>🟡 Servipag</span>
                            </div>
                          </div>
                        )}

                        {paymentMethod === 'transfer' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: '#0F172A' }}>Datos de Cuenta BancoEstado:</strong>
                              <button type="button" onClick={handleCopyBankDetails} className={styles.copyBankBtn} style={{ padding: '3px 8px', fontSize: '0.74rem' }}>
                                {copyFeedback ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                                <span>{copyFeedback ? '¡Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '0.78rem', color: '#334155' }}>
                              <div><strong>Banco:</strong> Banco Estado</div>
                              <div><strong>Tipo:</strong> Cuenta Vista / RUT</div>
                              <div><strong>N° Cuenta:</strong> 19.823.419-5</div>
                              <div><strong>RUT:</strong> 19.823.419-5</div>
                              <div><strong>Titular:</strong> InkedSouh Studio</div>
                              <div><strong>Correo:</strong> pagos@inkedsouh.com</div>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', borderTop: '1px solid #E2E8F0', paddingTop: '4px' }}>
                              Tu pedido quedará guardado como pendiente hasta que envíes el comprobante.
                            </div>
                          </div>
                        )}

                        {paymentMethod === 'whatsapp' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700 }}>
                              <MessageCircle size={16} />
                              <span>Coordinación Inmediata por WhatsApp</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.4 }}>
                              Al presionar continuar, se generará tu orden en el sistema y se abrirá el chat oficial de WhatsApp con el tatuador para convenir el pago y resolver dudas sobre despacho.
                            </p>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', borderTop: '1px solid #E2E8F0', paddingTop: '4px' }}>
                              El pedido quedará registrado en el sistema como pendiente de pago.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botones de Navegación */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setCheckoutStep('details')}
                          className={styles.btnSecondary}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.85rem' }}
                          disabled={orderProcessing}
                        >
                          <ArrowLeft size={16} />
                          <span>Volver a Datos</span>
                        </button>

                        <button 
                          type="button" 
                          onClick={handleProcessCheckout}
                          disabled={orderProcessing}
                          className={styles.btnAddToCartLarge}
                          style={{ width: 'auto', padding: '12px 24px', fontSize: '0.92rem' }}
                        >
                          {orderProcessing ? (
                            <>
                              <RefreshCw size={16} className={styles.spin} />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <span>
                                {paymentMethod === 'flow' && `Pagar con Webpay Plus (${formatPrice(finalCheckoutTotal)} CLP)`}
                                {paymentMethod === 'whatsapp' && 'Generar Pedido por WhatsApp'}
                                {paymentMethod === 'transfer' && 'Confirmar Pedido por Transferencia'}
                              </span>
                              <ChevronRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Columna Derecha: Resumen del Pedido (Compacto y Equilibrado) */}
                    <div className={styles.checkoutOrderSummary} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 className={styles.checkoutSectionTitle}>
                        <ShoppingBag size={18} style={{ color: '#E11D48' }} /> Resumen del Pedido
                      </h4>

                      {/* Datos de Entrega */}
                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div><strong>Destinatario:</strong> {customerInfo.name}</div>
                        <div><strong>Teléfono:</strong> {customerInfo.phone}</div>
                        <div><strong>Dirección:</strong> {customerInfo.address}, {customerInfo.city}</div>
                        <div style={{ color: isExpressShipping ? '#E11D48' : '#2563EB', fontWeight: 600, marginTop: '2px' }}>
                          <Truck size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                          {isExpressShipping ? 'Envío Express Rancagua & RM' : 'Regiones Starken Por Pagar'}
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                        {cart.map((item) => (
                          <div key={item.id} className={styles.summaryItemRow} style={{ fontSize: '0.82rem' }}>
                            <div className={styles.summaryItemName}>
                              <span>{item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                              <small style={{ color: '#64748B' }}>{item.quantity} un.</small>
                            </div>
                            <span style={{ color: '#0F172A', fontWeight: 700 }}>
                              {formatPrice((item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Desglose de Totales */}
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748B' }}>
                          <span>Subtotal Productos</span>
                          <span>{formatPrice(cartTotal)} CLP</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748B' }}>
                          <span>Envío</span>
                          <span style={{ fontWeight: 600, color: isExpressShipping ? '#E11D48' : '#059669' }}>
                            {isExpressShipping ? `+${formatPrice(expressShippingCost)} CLP` : 'Por Pagar ($0)'}
                          </span>
                        </div>
                        <div className={styles.summaryTotalRow} style={{ marginTop: '2px', paddingTop: '8px' }}>
                          <span>Total Final</span>
                          <span style={{ color: '#E11D48' }}>{formatPrice(finalCheckoutTotal)} CLP</span>
                        </div>
                      </div>

                      {/* Sello de Confianza y Despacho */}
                      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} style={{ color: '#E11D48', flexShrink: 0 }} />
                        <span>Despacho directo desde estudio en <strong>Rancagua, Chile</strong>.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: CONFIRMACIÓN DE LA ORDEN (DIFERENCIADO POR MÉTODO) */}
                {checkoutStep === 'success' && submittedOrder && (
                  <div className={styles.orderSuccessBox}>
                    
                    {/* Caso 1: FLOW (Pago Online Confirmado) */}
                    {submittedOrder.paymentMethod === 'flow' && (
                      <>
                        <div className={styles.successIconWrap} style={{ background: '#DCFCE7', color: '#15803D' }}>
                          <CheckCircle2 size={40} />
                        </div>
                        <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          PAGO CONFIRMADO CON WEBPAY
                        </span>
                        <h3 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                          ¡Pago y Pedido Confirmados con Éxito!
                        </h3>
                        <div className={styles.orderNumberBadge}>
                          Orden #{submittedOrder.orderNumber}
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                          Hemos recibido tu pago en línea correctamente. Tu compra ya está confirmada y nuestro equipo en Rancagua está preparando tu paquete para despacho.
                        </p>
                      </>
                    )}

                    {/* Caso 2: WHATSAPP (Pendiente de Pago) */}
                    {submittedOrder.paymentMethod === 'whatsapp' && (
                      <>
                        <div className={styles.successIconWrap} style={{ background: '#FEF3C7', color: '#B45309' }}>
                          <Clock size={40} />
                        </div>
                        <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          PEDIDO PENDIENTE DE PAGO
                        </span>
                        <h3 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                          Pedido Registrado — Pendiente de Pago
                        </h3>
                        <div className={styles.orderNumberBadge}>
                          Orden #{submittedOrder.orderNumber}
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, margin: 0, maxWidth: '500px' }}>
                          Tu orden ha quedado registrada en el sistema, pero <strong>el pago aún no ha sido efectuado</strong>. Para completar tu compra y asegurar tu pedido, abre WhatsApp con el tatuador para coordinar la transferencia y despacho.
                        </p>
                        
                        <div style={{ marginTop: '6px' }}>
                          <a 
                            href={`https://wa.me/56930254425?text=${encodeURIComponent(`Hola InkedSouh! Generé la orden #${submittedOrder.orderNumber} por un total de ${formatPrice(submittedOrder.total)} CLP en la tienda web. Deseo coordinar el pago y confirmar mi pedido.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#FFFFFF', padding: '12px 26px', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)' }}
                          >
                            <MessageCircle size={18} />
                            <span>Abrir WhatsApp con mi Pedido</span>
                          </a>
                        </div>
                      </>
                    )}

                    {/* Caso 3: TRANSFERENCIA BANCARIA (Esperando Transferencia) */}
                    {submittedOrder.paymentMethod === 'transfer' && (
                      <>
                        <div className={styles.successIconWrap} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          <Building2 size={40} />
                        </div>
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          TRANSFERENCIA PENDIENTE
                        </span>
                        <h3 style={{ color: '#0F172A', fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                          Pedido Reservado — Esperando Transferencia
                        </h3>
                        <div className={styles.orderNumberBadge}>
                          Orden #{submittedOrder.orderNumber}
                        </div>
                        <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, margin: 0, maxWidth: '500px' }}>
                          Tu orden está reservada a la espera de tu transferencia bancaria. Una vez realizada, envía el comprobante a nuestro WhatsApp para que el tatuador confirme el pago en el panel y despache tus productos.
                        </p>

                        {/* Card Banco */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 18px', width: '100%', maxWidth: '420px', textAlign: 'left', fontSize: '0.82rem', color: '#334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ color: '#0F172A' }}>Datos para Transferir:</strong>
                            <button type="button" onClick={handleCopyBankDetails} className={styles.copyBankBtn} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                              {copyFeedback ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                              <span>{copyFeedback ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div><strong>Banco:</strong> Banco Estado (Cuenta Vista / RUT)</div>
                          <div><strong>N° Cuenta:</strong> 19.823.419-5</div>
                          <div><strong>Titular:</strong> InkedSouh Tattoo Studio (RUT: 19.823.419-5)</div>
                          <div><strong>Monto:</strong> <span style={{ color: '#E11D48', fontWeight: 800 }}>{formatPrice(submittedOrder.total)} CLP</span></div>
                        </div>

                        <div style={{ marginTop: '4px' }}>
                          <a 
                            href={`https://wa.me/56930254425?text=${encodeURIComponent(`Hola InkedSouh! Ya realicé la transferencia de la orden #${submittedOrder.orderNumber} por ${formatPrice(submittedOrder.total)} CLP. Adjunto comprobante para confirmar el pago.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#FFFFFF', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}
                          >
                            <MessageCircle size={16} />
                            <span>Enviar Comprobante por WhatsApp</span>
                          </a>
                        </div>
                      </>
                    )}

                    {/* Plazo de Entrega */}
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 16px', fontSize: '0.82rem', color: '#1E40AF', maxWidth: '480px', marginTop: '4px' }}>
                      <Truck size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px', color: '#2563EB' }} />
                      <strong>Plazo de entrega desde Rancagua:</strong> {deliveryTimeframe}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button 
                        type="button" 
                        className={styles.checkoutBtnNext} 
                        style={{ background: '#0F172A', color: '#FFFFFF', padding: '10px 24px', fontSize: '0.9rem' }}
                        onClick={() => {
                          setCheckoutOpen(false)
                          setCheckoutStep('details')
                        }}
                      >
                        Cerrar y seguir navegando
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

