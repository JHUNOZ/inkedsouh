/**
 * Utilidades para manejo de especificaciones técnicas, variantes y combos/promociones de productos
 * Compatible con HONE CATALOG y la tienda pública Inked
 */

export function parseProductSpecifications(specInput) {
  let attributes = []
  let variantConfig = {
    enabled: false,
    name: 'Calibre de las agujas',
    variants: []
  }
  let bundleConfig = {
    enabled: false,
    items: []
  }

  if (!specInput) {
    return { attributes, variantConfig, bundleConfig }
  }

  try {
    let parsed = null
    if (typeof specInput === 'string') {
      const trimmed = specInput.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        parsed = JSON.parse(trimmed)
      }
    } else if (typeof specInput === 'object') {
      parsed = specInput
    }

    if (parsed) {
      // Parse Bundle / Combo config if present
      if (parsed.bundle_config || parsed.bundleConfig) {
        const bConf = parsed.bundle_config || parsed.bundleConfig
        bundleConfig = {
          enabled: !!bConf.enabled,
          items: Array.isArray(bConf.items) ? bConf.items : []
        }
      } else if (Array.isArray(parsed.bundle_items) || Array.isArray(parsed.bundleItems)) {
        bundleConfig = {
          enabled: true,
          items: parsed.bundle_items || parsed.bundleItems || []
        }
      }

      // Caso 1: Estructura moderna con variant_config / variantConfig
      if (parsed.variant_config || parsed.variantConfig) {
        const vConf = parsed.variant_config || parsed.variantConfig
        variantConfig = {
          enabled: !!vConf.enabled,
          name: vConf.name || 'Calibre / Medida',
          variants: Array.isArray(vConf.variants) ? vConf.variants : []
        }

        const rawAttrs = parsed.attributes || parsed.specs || {}
        if (Array.isArray(rawAttrs)) {
          attributes = rawAttrs
        } else if (typeof rawAttrs === 'object') {
          attributes = Object.entries(rawAttrs).map(([key, value]) => ({ key, value }))
        }
        return { attributes, variantConfig, bundleConfig }
      }

      // Caso 2: Objeto genérico clave/valor
      if (Array.isArray(parsed)) {
        attributes = parsed
      } else if (typeof parsed === 'object') {
        // Verificar si contiene una propiedad 'variants' directamente
        if (Array.isArray(parsed.variants)) {
          variantConfig = {
            enabled: true,
            name: parsed.variant_name || parsed.variantName || 'Variedad / Medida',
            variants: parsed.variants
          }
          const { variants, variant_name, variantName, bundle_config, bundleConfig: bC, ...rest } = parsed
          attributes = Object.entries(rest).map(([key, value]) => ({ key, value }))
        } else {
          const { bundle_config, bundleConfig: bC, bundle_items, bundleItems, ...rest } = parsed
          attributes = Object.entries(rest).map(([key, value]) => ({ key, value }))
        }
      }
      return { attributes, variantConfig, bundleConfig }
    }
  } catch (err) {
    console.warn('Error parsing specifications JSON:', err)
  }

  // Caso 3: String plano línea por línea
  if (typeof specInput === 'string') {
    attributes = specInput.split('\n').map(line => {
      const [k, ...v] = line.split(':')
      return { key: k?.trim() || '', value: v.join(':')?.trim() || '' }
    }).filter(s => s.key || s.value)
  }

  return { attributes, variantConfig, bundleConfig }
}

export function serializeProductSpecifications(attributesList = [], variantConfig = null, bundleConfig = null) {
  const cleanSpecs = (attributesList || []).filter(s => s && s.key && s.key.trim() && s.value && s.value.trim())
  const attributesObj = cleanSpecs.reduce((acc, curr) => ({
    ...acc,
    [curr.key.trim()]: curr.value.trim()
  }), {})

  const hasVariants = variantConfig && variantConfig.enabled && Array.isArray(variantConfig.variants) && variantConfig.variants.length > 0
  const hasBundle = bundleConfig && bundleConfig.enabled && Array.isArray(bundleConfig.items) && bundleConfig.items.length > 0

  const payload = {}

  if (Object.keys(attributesObj).length > 0) {
    payload.attributes = attributesObj
  }

  if (hasVariants) {
    const cleanVariants = variantConfig.variants.map((v, idx) => ({
      id: v.id || `v-${idx + 1}-${Date.now()}`,
      name: (v.name || '').trim(),
      sku: (v.sku || '').trim(),
      stock: parseInt(v.stock) >= 0 ? parseInt(v.stock) : 0,
      price: v.price ? parseFloat(v.price) : null
    })).filter(v => v.name)

    payload.variant_config = {
      enabled: true,
      name: (variantConfig.name || 'Calibre / Medida').trim(),
      variants: cleanVariants
    }
  }

  if (hasBundle) {
    const cleanItems = bundleConfig.items.map(item => ({
      productId: item.productId || item.id,
      name: (item.name || '').trim(),
      sku: (item.sku || '').trim(),
      price: parseFloat(item.price) || 0,
      originalPrice: parseFloat(item.originalPrice || item.price) || 0,
      image_url: item.image_url || '',
      quantity: parseInt(item.quantity) || 1,
      variantName: item.variantName || ''
    })).filter(item => item.name || item.productId)

    payload.bundle_config = {
      enabled: true,
      items: cleanItems
    }
  }

  if (Object.keys(payload).length > 0) {
    return JSON.stringify(payload)
  }

  return null
}

export function calculateTotalVariantStock(variants = []) {
  if (!Array.isArray(variants)) return 0
  return variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
}

/**
 * Calcula el valor original acumulado y la cantidad de items de un combo
 */
export function calculateBundleTotals(items = []) {
  if (!Array.isArray(items)) return { totalOriginalPrice: 0, totalItemsCount: 0 }
  
  let totalOriginalPrice = 0
  let totalItemsCount = 0

  items.forEach(item => {
    const qty = parseInt(item.quantity) || 1
    const unitPrice = parseFloat(item.price || item.originalPrice || 0)
    totalOriginalPrice += unitPrice * qty
    totalItemsCount += qty
  })

  return { totalOriginalPrice, totalItemsCount }
}

/**
 * Calcula ahorro en pesos y porcentaje de descuento
 */
export function calculateDiscountSavings(originalPrice, promoPrice) {
  const orig = parseFloat(originalPrice) || 0
  const promo = parseFloat(promoPrice) || 0

  if (orig <= 0 || promo >= orig) {
    return { savingsAmount: 0, discountPercentage: 0 }
  }

  const savingsAmount = orig - promo
  const discountPercentage = Math.round((savingsAmount / orig) * 100)

  return { savingsAmount, discountPercentage }
}

/**
 * Comprueba si un producto es un Combo o Pack promocional
 */
export function isProductBundle(productOrSpecs) {
  if (!productOrSpecs) return false
  const specs = typeof productOrSpecs === 'object' && productOrSpecs.specifications !== undefined
    ? productOrSpecs.specifications
    : productOrSpecs

  const { bundleConfig } = parseProductSpecifications(specs)
  return !!(bundleConfig.enabled && bundleConfig.items?.length > 0)
}

export function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

/**
 * Detecta si una URL corresponde a un archivo o stream de video
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false
  const cleanUrl = url.split('?')[0].toLowerCase()
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.startsWith('data:video/')
  )
}

/**
 * Calcula cuotas estimadas para métodos BNPL (Banca.me / Cuotas)
 */
export function calculateInstallmentAmount(amount, installments = 3) {
  if (!amount || amount <= 0) return 0
  return Math.ceil(amount / installments)
}

