'use client'
// Página de productos real sincronizada con Supabase y Carrito
import { useState, useEffect } from 'react'
import { ShoppingBag, ShoppingCart, Plus, Minus, X, Search } from 'lucide-react'
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

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)
  const getDiscountedPrice = (price, discount) => Math.round(price * (1 - (discount || 0) / 100))

  const addToCart = (product) => {
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

  // Filtrar productos reales
  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === 'Todos' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <SectionTitle subtitle="Cuida y protege tu arte">PRODUCTOS</SectionTitle>

          {/* Barra de búsqueda y filtros */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar productos..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filters}>
              {['Todos', ...PRODUCT_CATEGORIES].map((cat) => (
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

          {/* Grid de productos reales de Supabase */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '60px' }}>Cargando catálogo...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)', maxWidth: '600px', margin: '40px auto' }}>
              <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5, color: 'var(--color-red)' }} />
              <h3>Aún no tenemos productos disponibles</h3>
              <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '8px' }}>
                Los productos publicados por el administrador en el panel aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((product) => (
                <div key={product.id} className={styles.card}>
                  <div className={styles.cardImage}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ShoppingBag size={36} />
                    )}

                    {product.discount > 0 && (
                      <span className={styles.discountBadge}>-{product.discount}%</span>
                    )}
                    {product.stock <= 0 && (
                      <div className={styles.outOfStock}>AGOTADO</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.cardCategory}>{product.category}</span>
                    <h3 className={styles.cardName}>{product.name}</h3>
                    <p className={styles.cardDesc}>{product.description || 'Sin descripción.'}</p>
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
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <span className={product.stock > 0 ? styles.stockLabel : styles.stockOut}>
                      {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón flotante del carrito */}
        {cartCount > 0 && (
          <button className={styles.cartFloat} onClick={() => setCartOpen(true)}>
            <ShoppingCart size={22} />
            <span className={styles.cartBadge}>{cartCount}</span>
          </button>
        )}

        {/* Overlay del carrito */}
        {cartOpen && (
          <div className={styles.cartOverlay} onClick={() => setCartOpen(false)}>
            <div className={styles.cartPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.cartHeader}>
                <h3 className={styles.cartTitle}>
                  <ShoppingCart size={20} /> Tu Carrito
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
                      <span>Total</span>
                      <strong>{formatPrice(cartTotal)}</strong>
                    </div>
                    <BubbleButton fullWidth>
                      Ir al Pago
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
