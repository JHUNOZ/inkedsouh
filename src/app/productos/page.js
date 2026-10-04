'use client'
import { useState, useEffect } from 'react'
import { 
  ShoppingBag, ShoppingCart, Plus, Minus, X, Search, 
  Check, ChevronRight, Sparkles, Tag, ShieldCheck, 
  Star, MessageCircle, ArrowRight, CreditCard, Building2,
  Zap, Copy, CheckCircle2, Truck, MapPin, User, Mail, Phone,
  FileText, ExternalLink, RefreshCw, AlertCircle, ArrowLeft,
  Gift, Flame
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

  // Multi-Step Checkout Modal
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('details') // 'details' | 'payment' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('bancame') // 'bancame' | 'transfer' | 'whatsapp'
  const [deliveryTimeframe, setDeliveryTimeframe] = useState('24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryType: 'santiago', // 'santiago' | 'starken'
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

        // Load estimated delivery timeframe from site_config
        const { data: configData } = await supabase
          .from('site_config')
          .select('value')
          .eq('key_name', 'delivery_timeframe')
          .maybeSingle()
        if (configData?.value) {
          setDeliveryTimeframe(configData.value)
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
  const addToCart = (product, variant = null, quantity = 1, e = null) => {
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

    setCartOpen(true)
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
      `Monto a Transferir: ${formatPrice(cartTotal)} CLP`
    
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
      if (paymentMethod === 'bancame') {
        // Iniciar sesión con Banca.me API
        const res = await fetch('/api/bancame/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: cartTotal,
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
          totalAmount: cartTotal,
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
        total: cartTotal,
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
            <div style={{ textAlign: 'center', color: '#888', padding: '80px' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,42,61,0.2)', borderTopColor: '#ff2a3d', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              Cargando catálogo en tiempo real...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)', maxWidth: '600px', margin: '40px auto' }}>
              <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5, color: 'var(--color-red)' }} />
              <h3>Aún no tenemos productos disponibles</h3>
              <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '8px' }}>
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
                        <span className={styles.discountBadge} style={{ background: '#ff2a3d', left: '12px', right: 'auto' }}>
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
                        <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
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
                          className={styles.addBtn}
                          onClick={(e) => {
                            if (hasVariants) {
                              e.stopPropagation()
                              openDetailModal(product)
                            } else {
                              addToCart(product, null, 1, e)
                            }
                          }}
                          disabled={totalStock <= 0}
                          title={hasVariants ? "Elegir Medida / Calibre" : "Añadir al Carrito"}
                        >
                          <Plus size={18} />
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
                      <ShoppingBag size={56} style={{ color: '#444' }} />
                    )}
                    {isBundle ? (
                      <span className={styles.comboBadgeStore}>
                        <Package size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                        PACK PROMOCIONAL
                      </span>
                    ) : selectedProduct.badge ? (
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ff2a3d', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
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
                    <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
                    
                    {/* Star ratings */}
                    <div className={styles.ratingRow} style={{ marginTop: '4px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={15} fill="#facc15" color="#facc15" />
                        ))}
                      </div>
                      <span className={styles.ratingReviews}>(1 Reseña)</span>
                    </div>

                    {/* SKU & Stock Box (Exact Match to Photo 1) */}
                    <div className={styles.skuStockBox}>
                      <div className={styles.skuCell}>
                        SKU: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{activeSku || 'N/A'}</span>
                      </div>
                      <div className={styles.stockCell}>
                        STOCK: <span style={{ color: activeStock > 0 ? '#4ade80' : '#f87171' }}>{activeStock}</span>
                      </div>
                    </div>

                    {/* COMBO PACK CONTENTS SECTION */}
                    {isBundle && modalBundleConfig.enabled && modalBundleConfig.items?.length > 0 && (
                      <div className={styles.comboModalSection}>
                        <div className={styles.comboModalTitle}>
                          <Package size={16} color="#f59e0b" />
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
                                    <ShoppingBag size={14} color="#8e8e9f" />
                                  </div>
                                )}
                                <div>
                                  <div className={styles.comboModalItemName}>{bItem.name}</div>
                                  <div className={styles.comboModalItemQty}>
                                    Incluye: <strong style={{ color: '#fff' }}>{bItem.quantity || 1} un.</strong> {bItem.sku ? `• SKU: ${bItem.sku}` : ''}
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

                    {/* VARIANT SELECTOR (Exact Match to Photo 1 & 2) */}
                    {hasVariants && (
                      <div className={styles.variantSection}>
                        <label className={styles.variantLabel}>
                          {modalVarConfig.name || 'Calibre de las agujas'}
                        </label>

                        {/* Interactive Buttons / Chips Grid (Photo 1) */}
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

                        {/* Optional Dropdown Select Menu (Photo 2) */}
                        <div className={styles.variantDropdownWrap} style={{ marginTop: '8px' }}>
                          <select 
                            className={styles.variantSelectInput}
                            value={selectedVariant?.id || selectedVariant?.name || ''}
                            onChange={(e) => {
                              const chosen = modalVarConfig.variants.find(v => (v.id || v.name) === e.target.value)
                              if (chosen) {
                                setSelectedVariant(chosen)
                                setSelectedQuantity(1)
                              }
                            }}
                          >
                            <option value="" disabled>Elige una opción...</option>
                            {modalVarConfig.variants.map((v, vIdx) => (
                              <option key={v.id || vIdx} value={v.id || v.name} disabled={(parseInt(v.stock) || 0) <= 0}>
                                {v.name} {(parseInt(v.stock) || 0) <= 0 ? '— (Agotado)' : `(Stock: ${v.stock})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Price Section */}
                    <div className={styles.priceSection}>
                      <span className={styles.priceLabel}>PRECIO</span>
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

                    {/* Quantity Section */}
                    <div className={styles.qtySection}>
                      <span className={styles.qtySectionLabel}>Cantidad:</span>
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
                      {activeStock > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#8e8e9f' }}>
                          ({activeStock} unidades disponibles)
                        </span>
                      )}
                    </div>

                    {/* WhatsApp Banner Prompt (Photo 1) */}
                    <div 
                      className={styles.whatsappBanner} 
                      onClick={() => handleDirectWhatsAppQuery(selectedProduct, selectedVariant)}
                      title="Preguntar directamente por WhatsApp"
                    >
                      <div className={styles.whatsappBannerText}>
                        ¿Tienes dudas sobre las medidas? <strong>Envíanos un mensaje de WhatsApp</strong>
                      </div>
                      <div className={styles.whatsappBubbleIcon}>
                        <MessageCircle size={18} fill="#fff" color="#25d366" />
                      </div>
                    </div>

                    {/* Delivery Timeframe Notice */}
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                      <Truck size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.78rem', color: '#bfdbfe', lineHeight: 1.35 }}>
                        <strong>Envíos a todo Chile</strong> • Plazo estimado: <span style={{ color: '#fff', fontWeight: 600 }}>{deliveryTimeframe}</span>
                      </div>
                    </div>

                    {/* Main CTA Button "AGREGAR AL CARRO" */}
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct, selectedVariant, selectedQuantity)
                        setSelectedProduct(null)
                      }}
                      disabled={activeStock <= 0}
                      className={styles.btnAddToCartLarge}
                      style={{ marginTop: '12px' }}
                    >
                      <ShoppingCart size={20} />
                      <span>{activeStock > 0 ? 'AGREGAR AL CARRO' : 'AGOTADO'}</span>
                    </button>
                  </div>

                  {/* Ficha Técnica / Especificaciones Técnicas */}
                  {modalSpecs.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', marginTop: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,42,61,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff2a3d' }}>
                          <FileText size={13} />
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          Ficha Técnica & Especificaciones
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {modalSpecs.map((s, idx) => (
                          <div key={idx} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '9px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#8e8e9f', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{s.key}</span>
                            <span style={{ color: '#f5f5f7', fontSize: '0.85rem', fontWeight: 600 }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

                    {/* BNPL Teaser in Cart */}
                    <div style={{ background: 'rgba(234, 88, 12, 0.08)', border: '1px solid rgba(234, 88, 12, 0.25)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span>Hasta <strong>3 cuotas sin interés de {formatPrice(calculateInstallmentAmount(cartTotal, 3))}</strong></span>
                      <span style={{ background: '#ea580c', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>BNPL</span>
                    </div>

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
                  <CreditCard size={22} style={{ color: '#ff2a3d' }} />
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
                    <div>
                      <h4 className={styles.checkoutSectionTitle}>
                        <User size={18} style={{ color: '#ff2a3d' }} /> Datos de Contacto
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
                          <label>Correo Electrónico</label>
                          <input 
                            type="email" 
                            placeholder="correo@ejemplo.com" 
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          />
                        </div>

                        <div className={`${styles.formField} ${styles.fullCol}`}>
                          <label>Modalidad de Envío *</label>
                          <div className={styles.shippingCardsGrid}>
                            <div 
                              className={`${styles.shippingCard} ${customerInfo.deliveryType === 'santiago' ? styles.shippingCardActive : ''}`}
                              onClick={() => setCustomerInfo({ ...customerInfo, deliveryType: 'santiago' })}
                            >
                              <div className={styles.shippingCardIcon}><Truck size={20} style={{ color: '#ff2a3d' }} /></div>
                              <div className={styles.shippingCardText}>
                                <strong>Envío Express RM</strong>
                                <small>Santiago y comunas aledañas</small>
                              </div>
                              {customerInfo.deliveryType === 'santiago' && <span className={styles.shippingCheck}>✓</span>}
                            </div>

                            <div 
                              className={`${styles.shippingCard} ${customerInfo.deliveryType === 'starken' ? styles.shippingCardActive : ''}`}
                              onClick={() => setCustomerInfo({ ...customerInfo, deliveryType: 'starken' })}
                            >
                              <div className={styles.shippingCardIcon}><Package size={20} style={{ color: '#ff2a3d' }} /></div>
                              <div className={styles.shippingCardText}>
                                <strong>Por Pagar Regiones</strong>
                                <small>Starken / Chilexpress a todo Chile</small>
                              </div>
                              {customerInfo.deliveryType === 'starken' && <span className={styles.shippingCheck}>✓</span>}
                            </div>
                          </div>
                        </div>

                        {/* Banner Plazo de Entrega */}
                        <div className={styles.fullCol} style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Truck size={20} style={{ color: '#60a5fa', flexShrink: 0 }} />
                          <div style={{ fontSize: '0.8rem', color: '#bfdbfe', lineHeight: 1.4 }}>
                            <strong>Plazo de Entrega Estimado:</strong> <span style={{ color: '#fff', fontWeight: 600 }}>{deliveryTimeframe}</span>. Todos los pedidos cuentan con código de seguimiento.
                          </div>
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
                            placeholder="Ej: Providencia, Viña del Mar, Concepción..." 
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                            required
                          />
                        </div>

                        <div className={`${styles.formField} ${styles.fullCol}`}>
                          <label>Notas adicionales de despacho (opcional)</label>
                          <textarea 
                            rows={2} 
                            placeholder="Instrucciones para el repartidor, horarios de preferencia..." 
                            value={customerInfo.notes}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
                            if (!customerInfo.address.trim()) {
                              alert('Por favor ingresa tu dirección de envío')
                              return
                            }
                            setCheckoutStep('payment')
                          }}
                          className={styles.btnAddToCartLarge}
                          style={{ width: 'auto', padding: '12px 28px', fontSize: '0.95rem' }}
                        >
                          <span>Continuar al Pago</span>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Summary Col */}
                    <div className={styles.checkoutOrderSummary}>
                      <h4 className={styles.checkoutSectionTitle}>
                        <ShoppingBag size={18} style={{ color: '#ff2a3d' }} /> Resumen ({cartCount})
                      </h4>
                      {cart.map((item) => (
                        <div key={item.id} className={styles.summaryItemRow}>
                          <div className={styles.summaryItemName}>
                            <span>{item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                            <small style={{ color: '#71717a' }}>{item.quantity} un. x {formatPrice(item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price)}</small>
                          </div>
                          <span style={{ color: '#fff', fontWeight: 600 }}>
                            {formatPrice((item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price) * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className={styles.summaryTotalRow}>
                        <span>Total</span>
                        <span style={{ color: '#ff2a3d' }}>{formatPrice(cartTotal)} CLP</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 2: SELECCIÓN DE MÉTODO DE PAGO */}
                {checkoutStep === 'payment' && (
                  <div className={styles.checkoutGrid}>
                    <div>
                      <h4 className={styles.checkoutSectionTitle}>
                        <CreditCard size={18} style={{ color: '#ff2a3d' }} /> Selecciona tu Método de Pago
                      </h4>

                      <div className={styles.paymentMethodsGrid} style={{ gridTemplateColumns: '1fr' }}>

                        {/* 1. BANCA.ME BNPL */}
                        <div 
                          className={`${styles.paymentMethodCard} ${paymentMethod === 'bancame' ? styles.paymentMethodCardActive : ''}`}
                          onClick={() => setPaymentMethod('bancame')}
                        >
                          <div className={styles.paymentMethodTop}>
                            <div className={styles.paymentIconWrap} style={{ background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c' }}>
                              <CreditCard size={18} />
                            </div>
                            <span className={styles.paymentBadgePill} style={{ background: 'rgba(234, 88, 12, 0.2)', color: '#fdba74' }}>
                              3 a 12 Cuotas con RUT
                            </span>
                          </div>
                          <h5 className={styles.paymentMethodName}>Banca.me BNPL (Compra Ahora, Paga en Cuotas)</h5>
                          <p className={styles.paymentMethodDesc}>
                            Paga en 3, 6 o 12 cuotas mensuales con tu RUT y tarjeta de débito/transferencia. Sin tarjeta de crédito.
                          </p>
                        </div>

                        {/* 2. TRANSFERENCIA BANCARIA */}
                        <div 
                          className={`${styles.paymentMethodCard} ${paymentMethod === 'transfer' ? styles.paymentMethodCardActive : ''}`}
                          onClick={() => setPaymentMethod('transfer')}
                        >
                          <div className={styles.paymentMethodTop}>
                            <div className={styles.paymentIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                              <Building2 size={18} />
                            </div>
                            <span className={styles.paymentBadgePill} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                              Transferencia Directa
                            </span>
                          </div>
                          <h5 className={styles.paymentMethodName}>Transferencia Bancaria</h5>
                          <p className={styles.paymentMethodDesc}>
                            Transfiere directamente a nuestra Cuenta BancoEstado o Santander y envía tu comprobante por WhatsApp.
                          </p>
                        </div>

                        {/* 3. WHATSAPP DIRECTO */}
                        <div 
                          className={`${styles.paymentMethodCard} ${paymentMethod === 'whatsapp' ? styles.paymentMethodCardActive : ''}`}
                          onClick={() => setPaymentMethod('whatsapp')}
                        >
                          <div className={styles.paymentMethodTop}>
                            <div className={styles.paymentIconWrap} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                              <MessageCircle size={18} />
                            </div>
                            <span className={styles.paymentBadgePill} style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }}>
                              Atención Directa
                            </span>
                          </div>
                          <h5 className={styles.paymentMethodName}>Pedido Asistido por WhatsApp</h5>
                          <p className={styles.paymentMethodDesc}>
                            Coordina y confirma directamente con el artista tu pedido, datos de despacho y consultas técnicas.
                          </p>
                        </div>
                      </div>

                      {/* PAYMENT DETAILS BLOCK ACCORDING TO SELECTION */}

                      {/* BANCA.ME BNPL DETAILS */}
                      {paymentMethod === 'bancame' && (
                        <div className={styles.bnplDetailsBox} style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Simulador de Cuotas Banca.me</strong>
                            <span style={{ fontSize: '0.75rem', color: '#fdba74' }}>Aprobación con RUT en 1 min</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#e5e7eb', margin: 0 }}>
                            Paga tu primera cuota hoy y el resto en cuotas fijas mensuales con débito o transferencia:
                          </p>
                          <div className={styles.bnplInstallmentsRow}>
                            <div className={styles.bnplInstallmentPill}>
                              <span className={styles.bnplInstallmentCount}>3 cuotas de</span>
                              <span className={styles.bnplInstallmentValue}>{formatPrice(calculateInstallmentAmount(cartTotal, 3))}</span>
                            </div>
                            <div className={styles.bnplInstallmentPill}>
                              <span className={styles.bnplInstallmentCount}>6 cuotas de</span>
                              <span className={styles.bnplInstallmentValue}>{formatPrice(calculateInstallmentAmount(cartTotal, 6))}</span>
                            </div>
                            <div className={styles.bnplInstallmentPill}>
                              <span className={styles.bnplInstallmentCount}>12 cuotas de</span>
                              <span className={styles.bnplInstallmentValue}>{formatPrice(calculateInstallmentAmount(cartTotal, 12))}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TRANSFERENCIA BANCARIA DETAILS */}
                      {paymentMethod === 'transfer' && (
                        <div className={styles.bankDetailsBox} style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Datos para Transferencia</strong>
                            <button type="button" onClick={handleCopyBankDetails} className={styles.copyBankBtn}>
                              {copyFeedback ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                              <span>{copyFeedback ? '¡Copiado!' : 'Copiar Datos'}</span>
                            </button>
                          </div>
                          <div className={styles.bankDetailRow}>
                            <span className={styles.bankDetailLabel}>Banco:</span>
                            <span className={styles.bankDetailValue}>Banco Estado</span>
                          </div>
                          <div className={styles.bankDetailRow}>
                            <span className={styles.bankDetailLabel}>Tipo de Cuenta:</span>
                            <span className={styles.bankDetailValue}>Cuenta Vista / RUT</span>
                          </div>
                          <div className={styles.bankDetailRow}>
                            <span className={styles.bankDetailLabel}>N° de Cuenta:</span>
                            <span className={styles.bankDetailValue}>19.823.419-5</span>
                          </div>
                          <div className={styles.bankDetailRow}>
                            <span className={styles.bankDetailLabel}>Titular:</span>
                            <span className={styles.bankDetailValue}>InkedSouh Tattoo Studio</span>
                          </div>
                          <div className={styles.bankDetailRow}>
                            <span className={styles.bankDetailLabel}>RUT:</span>
                            <span className={styles.bankDetailValue}>19.823.419-5</span>
                          </div>
                          <div className={styles.bankDetailRow}>
                            <span className={styles.bankDetailLabel}>Correo comprobante:</span>
                            <span className={styles.bankDetailValue}>pagos@inkedsouh.com</span>
                          </div>
                        </div>
                      )}

                      {/* ERROR BANNER */}
                      {bancameError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                          <span>{bancameError}</span>
                        </div>
                      )}

                      {/* SANDBOX / SIMULATOR INTERACTIVE PANEL */}
                      {simulationData && (
                        <div className={styles.simulationBox}>
                          <div className={styles.simulationHeader}>
                            <h5 className={styles.simulationTitle}>
                              <Zap size={16} /> Entorno de Pruebas Banca.me (Sandbox)
                            </h5>
                            <span className={styles.simulationBadge}>Modo Simulación</span>
                          </div>
                          <p className={styles.simulationText}>
                            Sesión creada para la orden <strong>#{simulationData.orderNumber}</strong>. En producción con tu clave <code>BANCAME_SECRET_KEY</code> se despliega el widget oficial. Puedes simular la respuesta crediticia ahora:
                          </p>
                          <div className={styles.simulationTokenWrap}>
                            Token de Sesión: {simulationData.widgetToken}
                          </div>
                          <div className={styles.simulationActions}>
                            <button 
                              type="button" 
                              onClick={handleSimulateBancameSuccess}
                              disabled={orderProcessing}
                              className={styles.simulationBtnApprove}
                            >
                              <CheckCircle2 size={15} /> Simular Aprobación y Pago
                            </button>
                            <button 
                              type="button" 
                              onClick={handleSimulateBancameReject}
                              disabled={orderProcessing}
                              className={styles.simulationBtnReject}
                            >
                              <X size={15} /> Simular Rechazo de Crédito
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSimulationData(null)}
                              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Cerrar Panel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* BOTONES DE NAVEGACIÓN */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSimulationData(null)
                            setBancameError(null)
                            setCheckoutStep('details')
                          }}
                          className={styles.btnSecondary}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px' }}
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
                          style={{ width: 'auto', padding: '12px 28px', fontSize: '0.95rem' }}
                        >
                          {orderProcessing ? (
                            <>
                              <RefreshCw size={16} className={styles.spin} />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <span>
                                {paymentMethod === 'whatsapp' && 'Finalizar por WhatsApp'}
                                {paymentMethod === 'transfer' && 'Confirmar Pedido y Datos de Pago'}
                                {paymentMethod === 'bancame' && 'Pagar en Cuotas con Banca.me'}
                              </span>
                              <Check size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Summary Col */}
                    <div className={styles.checkoutOrderSummary}>
                      <h4 className={styles.checkoutSectionTitle}>
                        <ShoppingBag size={18} style={{ color: '#ff2a3d' }} /> Resumen del Pedido
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: '#a1a1aa', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <div><strong>Cliente:</strong> {customerInfo.name}</div>
                        <div><strong>Teléfono:</strong> {customerInfo.phone}</div>
                        <div><strong>Dirección:</strong> {customerInfo.address}, {customerInfo.city}</div>
                        <div style={{ marginTop: '4px', color: '#60a5fa' }}><strong>Plazo estimado:</strong> {deliveryTimeframe}</div>
                      </div>
                      {cart.map((item) => (
                        <div key={item.id} className={styles.summaryItemRow}>
                          <div className={styles.summaryItemName}>
                            <span>{item.name} {item.variantName ? `(${item.variantName})` : ''}</span>
                            <small style={{ color: '#71717a' }}>{item.quantity} un.</small>
                          </div>
                          <span style={{ color: '#fff', fontWeight: 600 }}>
                            {formatPrice((item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price) * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className={styles.summaryTotalRow}>
                        <span>Total Final</span>
                        <span style={{ color: '#ff2a3d' }}>{formatPrice(cartTotal)} CLP</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: CONFIRMACIÓN EXITOSA */}
                {checkoutStep === 'success' && submittedOrder && (
                  <div className={styles.orderSuccessBox}>
                    <div className={styles.successIconWrap}>
                      <CheckCircle2 size={36} />
                    </div>

                    <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                      ¡Pedido Registrado con Éxito!
                    </h3>

                    <div className={styles.orderNumberBadge}>
                      Orden #{submittedOrder.orderNumber}
                    </div>

                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                      {submittedOrder.paymentMethod === 'whatsapp' && (
                        'Se ha generado tu orden y abierto la conversación por WhatsApp para coordinar los detalles finales de tu entrega.'
                      )}
                      {submittedOrder.paymentMethod === 'transfer' && (
                        'Tu orden ha sido registrada. Realiza la transferencia bancaria con el número de orden en el asunto y envíanos el comprobante para procesar tu despacho.'
                      )}
                      {submittedOrder.paymentMethod === 'bancame' && (
                        submittedOrder.status?.includes('Aprobado')
                          ? '¡Tu pago en cuotas con Banca.me ha sido aprobado exitosamente! Hemos recibido la confirmación y estamos preparando tu despacho.'
                          : 'Tu solicitud de cuotas con Banca.me BNPL ha sido registrada. Recibirás las notificaciones de cuotas en tu correo electrónico.'
                      )}
                    </p>

                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.82rem', color: '#bfdbfe', maxWidth: '480px' }}>
                      <Truck size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px', color: '#60a5fa' }} />
                      <strong>Plazo estimado de entrega:</strong> {deliveryTimeframe}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button 
                        type="button" 
                        className={styles.checkoutBtnNext} 
                        style={{ background: '#27272a', color: '#fff' }}
                        onClick={() => {
                          setCheckoutOpen(false)
                          setCheckoutStep('details')
                        }}
                      >
                        Cerrar y seguir comprando
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

