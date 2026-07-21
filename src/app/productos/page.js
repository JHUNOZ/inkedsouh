'use client'
// Página de productos con carrito lateral
import { useState } from 'react'
import { ShoppingBag, ShoppingCart, Plus, Minus, X, Filter, Search } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import styles from './productos.module.css'

export default function ProductosPage() {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [search, setSearch] = useState('')

  // Productos placeholder
  const products = [
    { id: 1, name: 'Crema Cicatrizante Tattoo', description: 'Crema especial para el cuidado post-tatuaje.', price: 12990, discount: 0, stock: 25, category: 'Cuidado', image: null },
    { id: 2, name: 'Film Protector Premium', description: 'Film transparente de segunda piel para proteger tu tatuaje nuevo.', price: 8990, discount: 10, stock: 50, category: 'Cuidado', image: null },
    { id: 3, name: 'Kit Aftercare Completo', description: 'Kit completo con crema, jabón y film protector.', price: 24990, discount: 15, stock: 15, category: 'Kits', image: null },
    { id: 4, name: 'Jabón Antibacterial Tattoo', description: 'Jabón suave sin fragancia para limpieza del tatuaje.', price: 6990, discount: 0, stock: 30, category: 'Cuidado', image: null },
    { id: 5, name: 'Diseño Personalizado Digital', description: 'Diseño exclusivo digital a medida según tus ideas.', price: 35000, discount: 0, stock: 99, category: 'Diseños', image: null },
    { id: 6, name: 'Bálsamo Hidratante', description: 'Bálsamo natural para mantener tu tatuaje vibrante.', price: 9990, discount: 5, stock: 0, category: 'Cuidado', image: null }
  ]

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)
  const getDiscountedPrice = (price, discount) => Math.round(price * (1 - discount / 100))

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

  // Filtrar productos
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

          {/* Grid de productos */}
          <div className={styles.grid}>
            {filtered.map((product) => (
              <div key={product.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <ShoppingBag size={36} />
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
                  <p className={styles.cardDesc}>{product.description}</p>
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
