'use client'
import { useState, useEffect } from 'react'
import { 
  ShoppingBag, ShoppingCart, Plus, Minus, X, Search, 
  Eye, Check, ChevronLeft, ChevronRight, Sparkles, Tag, ShieldCheck 
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import styles from './productos.module.css'

export default function ProductosPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')

  // Product Quickview / Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('Error al cargar productos:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0)
  const getDiscountedPrice = (price, discount) => Math.round(price * (1 - (discount || 0) / 100))

  const addToCart = (product, e) => {
    if (e) e.stopPropagation()
    if (product.stock <= 0) return
    const existing = cart.find((item) => item.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) return
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
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
    const matchCategory = activeCategory === 'Todos' || p.category === activeCategory
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.description || '').toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  // Open Product Modal
  const openDetailModal = (product) => {
    setSelectedProduct(product)
    setActiveImageIdx(0)
  }

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

  // Parse specifications
  const getProductSpecs = (product) => {
    if (!product?.specifications) return []
    try {
      if (product.specifications.startsWith('{') || product.specifications.startsWith('[')) {
        const obj = JSON.parse(product.specifications)
        if (Array.isArray(obj)) return obj
        return Object.entries(obj).map(([k, v]) => ({ key: k, value: v }))
      }
    } catch {}
    return product.specifications.split('\n').map(l => {
      const [k, ...v] = l.split(':')
      return { key: k?.trim() || '', value: v.join(':')?.trim() || '' }
    }).filter(s => s.key || s.value)
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionTitle subtitle="Cuida y protege tu arte con productos profesionales">
            CATÁLOGO & PRODUCTOS
          </SectionTitle>

          {/* Barra de búsqueda y filtros dinámicos */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar productos por nombre o tipo..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: '#888', background: 'none', border: 'none' }}>
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

                return (
                  <div key={product.id} className={styles.card} onClick={() => openDetailModal(product)} style={{ cursor: 'pointer' }}>
                    <div className={styles.cardImage}>
                      {mainImage ? (
                        <img src={mainImage} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ShoppingBag size={36} />
                      )}

                      {/* Badges */}
                      {product.badge && (
                        <span className={styles.discountBadge} style={{ background: '#ff2a3d', left: '12px', right: 'auto' }}>
                          {product.badge}
                        </span>
                      )}

                      {product.discount > 0 && (
                        <span className={styles.discountBadge}>-{product.discount}%</span>
                      )}
                      
                      {product.stock <= 0 && (
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
                      <p className={styles.cardDesc}>{product.description || 'Sin descripción detallada.'}</p>
                      
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
                          onClick={(e) => addToCart(product, e)}
                          disabled={product.stock <= 0}
                          title="Añadir al Carrito"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      <span className={product.stock > 0 ? styles.stockLabel : styles.stockOut}>
                        {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock disponible'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Product Quickview / Lightbox Modal */}
        {selectedProduct && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div 
              style={{
                background: '#0e0e13',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                maxWidth: '850px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                padding: '28px',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProduct(null)} 
                style={{ position: 'absolute', top: '16px', right: '16px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              {/* Left Gallery Lightbox */}
              <div>
                {(() => {
                  const modalImgs = getProductImages(selectedProduct)
                  const currentImg = modalImgs[activeImageIdx] || selectedProduct.image_url
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '14px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {currentImg ? (
                          <img src={currentImg} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><ShoppingBag size={48} /></div>
                        )}
                        {selectedProduct.badge && (
                          <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ff2a3d', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                            {selectedProduct.badge}
                          </span>
                        )}
                      </div>

                      {/* Thumbnails row */}
                      {modalImgs.length > 1 && (
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {modalImgs.map((imgUrl, idx) => (
                            <img 
                              key={idx} 
                              src={imgUrl} 
                              alt="thumb" 
                              onClick={() => setActiveImageIdx(idx)}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: activeImageIdx === idx ? '2px solid #ff2a3d' : '1px solid rgba(255,255,255,0.1)'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Right Product Info */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#ff2a3d', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px' }}>
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.sku && (
                      <span style={{ color: '#888', fontSize: '0.75rem' }}>• SKU: {selectedProduct.sku}</span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                    {selectedProduct.name}
                  </h2>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
                      {formatPrice(selectedProduct.discount > 0 ? getDiscountedPrice(selectedProduct.price, selectedProduct.discount) : selectedProduct.price)}
                    </span>
                    {selectedProduct.old_price > selectedProduct.price && (
                      <span style={{ fontSize: '1rem', color: '#888', textDecoration: 'line-through' }}>
                        {formatPrice(selectedProduct.old_price)}
                      </span>
                    )}
                    {selectedProduct.discount > 0 && (
                      <span style={{ background: 'rgba(255,42,61,0.2)', color: '#ff8591', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        {selectedProduct.discount}% OFF
                      </span>
                    )}
                  </div>

                  <p style={{ color: '#c7c7cc', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
                    {selectedProduct.description || 'Producto premium seleccionado y testeado por tatuadores profesionales.'}
                  </p>

                  {/* Dynamic Specifications */}
                  {(() => {
                    const specs = getProductSpecs(selectedProduct)
                    if (specs.length === 0) return null
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                          Especificaciones Técnicas
                        </strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                          {specs.map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: '#888' }}>{s.key}:</span>
                              <span style={{ color: '#e5e5e7', fontWeight: 500 }}>{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>Disponibilidad:</span>
                    <strong style={{ color: selectedProduct.stock > 0 ? '#4ade80' : '#f87171', fontSize: '0.88rem' }}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} en stock` : 'Agotado temporalmente'}
                    </strong>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct)
                      setSelectedProduct(null)
                    }}
                    disabled={selectedProduct.stock <= 0}
                    style={{
                      background: 'linear-gradient(135deg, #ff2a3d 0%, #b80c1d 100%)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedProduct.stock > 0 ? 'pointer' : 'not-allowed',
                      opacity: selectedProduct.stock > 0 ? 1 : 0.4
                    }}
                  >
                    <ShoppingCart size={18} />
                    <span>Añadir al Carrito</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                          <span className={styles.cartItemPrice}>
                            {formatPrice(item.discount > 0 ? getDiscountedPrice(item.price, item.discount) : item.price)}
                          </span>
                        </div>
                        <div className={styles.cartItemActions}>
                          <button onClick={() => updateQuantity(item.id, -1)} className={styles.qtyBtn}>
                            <Minus size={14} />
                          </button>
                          <span className={styles.qtyNum}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className={styles.qtyBtn}>
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
                    <BubbleButton fullWidth>
                      Continuar con el Pedido
                    </BubbleButton>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
