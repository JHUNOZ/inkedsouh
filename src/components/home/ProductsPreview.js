'use client'
import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import styles from './ProductsPreview.module.css'

export default function ProductsPreview() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price)

  const getDiscountedPrice = (price, discount) =>
    Math.round(price * (1 - discount / 100))

  useEffect(() => {
    async function loadProducts() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        // Try to fetch real products, fallback to empty array if error
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(4)
          .order('created_at', { ascending: false })
          
        if (error) {
          console.error("Error fetching products", error)
          setProducts([])
        } else {
          setProducts(data || [])
        }
      } catch (err) {
        console.error("Supabase client error", err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } }
  }

  return (
    <section className={styles.section} id="productos-preview">
      <div className={styles.inner}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <SectionTitle subtitle="Cuida y protege tu arte">PRODUCTOS</SectionTitle>
        </motion.div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ShoppingBag size={48} className={styles.emptyIcon} />
            <p>Aún no tenemos productos disponibles</p>
          </motion.div>
        ) : (
          <motion.div 
            className={styles.grid}
            variants={containerVars}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {products.map((product) => (
              <motion.div 
                key={product.id} 
                className={`${styles.card} interactive`}
                variants={itemVars}
                whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
                style={{ perspective: 1000 }}
              >
                {product.discount > 0 && (
                  <span className={styles.discountBadge}>-{product.discount}%</span>
                )}
                <div className={styles.cardImage}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <ShoppingBag size={32} />
                  )}
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
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div 
          className={styles.btnWrap}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <BubbleButton href="/productos" variant="outline">
            Ver Catálogo
          </BubbleButton>
        </motion.div>
      </div>
    </section>
  )
}
