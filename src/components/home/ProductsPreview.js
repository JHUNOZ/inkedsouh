'use client'
import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import BubbleButton from '@/components/ui/BubbleButton'
import { parseProductSpecifications, calculateTotalVariantStock, isVideoUrl } from '@/lib/productUtils'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import styles from './ProductsPreview.module.css'

export default function ProductsPreview() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0)

  const getDiscountedPrice = (price, discount) =>
    Math.round(price * (1 - (discount || 0) / 100))

  useEffect(() => {
    async function loadProducts() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, discount, stock, image_url, category, badge, specifications')
          .eq('is_active', true)
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
      transition: { staggerChildren: 0.12 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
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
          <SectionTitle subtitle="Insumos profesionales para tatuadores">PRODUCTOS</SectionTitle>
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
            {products.map((product) => {
              const { variantConfig } = parseProductSpecifications(product.specifications)
              const hasVariants = variantConfig.enabled && variantConfig.variants && variantConfig.variants.length > 0
              const totalStock = hasVariants ? calculateTotalVariantStock(variantConfig.variants) : product.stock

              return (
                <Link key={product.id} href="/productos" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <motion.div 
                    className={`${styles.card} interactive`}
                    variants={itemVars}
                    whileHover={{ scale: 1.03 }}
                  >
                    {product.badge && (
                      <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ff2a3d', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, zIndex: 2 }}>
                        {product.badge}
                      </span>
                    )}

                    {product.discount > 0 && (
                      <span className={styles.discountBadge}>-{product.discount}%</span>
                    )}
                    <div className={styles.cardImage}>
                      {product.image_url ? (
                        isVideoUrl(product.image_url) ? (
                          <video 
                            src={product.image_url} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            preload="none"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <img src={product.image_url} alt={product.name} loading="lazy" />
                        )
                      ) : (
                        <ShoppingBag size={32} />
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <span className={styles.cardCategory}>{product.category}</span>
                      <h3 className={styles.cardName}>{product.name}</h3>

                      {hasVariants && (
                        <span style={{ display: 'inline-block', fontSize: '0.72rem', color: '#ff8591', background: 'rgba(255,42,61,0.12)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>
                          ⚡ {variantConfig.variants.length} Medidas ({variantConfig.name || 'Calibre'})
                        </span>
                      )}

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
                      <span className={styles.stock}>
                        {totalStock > 0 ? `${totalStock} disponibles` : 'Agotado'}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </motion.div>
        )}

        <motion.div 
          className={styles.btnWrap}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <BubbleButton href="/productos" variant="outline">
            Ver Catálogo
          </BubbleButton>
        </motion.div>
      </div>
    </section>
  )
}
