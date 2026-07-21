'use client'
// Preview de productos (productos de prueba editables desde admin)
import { useEffect, useRef } from 'react'
import { ShoppingBag } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import styles from './ProductsPreview.module.css'

export default function ProductsPreview() {
  const sectionRef = useRef(null)

  // Productos de prueba (se reemplazarán desde Supabase)
  const products = [
    { id: 1, name: 'Producto de Prueba 1', price: 12990, discount: 0, stock: 25, category: 'Cuidado' },
    { id: 2, name: 'Producto de Prueba 2', price: 8990, discount: 10, stock: 50, category: 'Cuidado' },
    { id: 3, name: 'Producto de Prueba 3', price: 24990, discount: 15, stock: 15, category: 'Kits' },
    { id: 4, name: 'Producto de Prueba 4', price: 6990, discount: 0, stock: 30, category: 'Accesorios' },
  ]

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)

  const getDiscountedPrice = (price, discount) =>
    Math.round(price * (1 - discount / 100))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.08 }
    )
    const items = sectionRef.current?.querySelectorAll('.reveal, .reveal-scale')
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="productos-preview" ref={sectionRef}>
      <div className={styles.inner}>
        <div className="reveal">
          <SectionTitle subtitle="Cuida y protege tu arte">PRODUCTOS</SectionTitle>
        </div>

        <p className={`${styles.hint} reveal`}>
          Productos de prueba — Editables desde el panel de administración
        </p>

        {/* Grid de productos */}
        <div className={styles.grid}>
          {products.map((product, i) => (
            <div key={product.id} className={`${styles.card} reveal-scale reveal-delay-${Math.min(i + 1, 4)}`}>
              {product.discount > 0 && (
                <span className={styles.discountBadge}>-{product.discount}%</span>
              )}
              <div className={styles.cardImage}>
                <ShoppingBag size={32} />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardCategory}>{product.category}</span>
                <h3 className={styles.cardName}>{product.name}</h3>
                <div className={styles.cardPricing}>
                  {product.discount > 0 ? (
                    <>
                      <span className={styles.price}>
                        {formatPrice(getDiscountedPrice(product.price, product.discount))}
                      </span>
                      <span className={styles.priceOld}>{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                  )}
                </div>
                <span className={styles.stock}>{product.stock} disponibles</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`${styles.btnWrap} reveal`}>
          <BubbleButton href="/productos" variant="outline">
            Ver Catálogo
          </BubbleButton>
        </div>
      </div>
    </section>
  )
}
