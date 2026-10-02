/**
 * Utilidades para manejo de especificaciones técnicas y variantes / subcategorías de productos
 * Compatible con HONE CATALOG y la tienda pública Inked
 */

export function parseProductSpecifications(specInput) {
  let attributes = []
  let variantConfig = {
    enabled: false,
    name: 'Calibre de las agujas',
    variants: []
  }

  if (!specInput) {
    return { attributes, variantConfig }
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
        return { attributes, variantConfig }
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
          const { variants, variant_name, variantName, ...rest } = parsed
          attributes = Object.entries(rest).map(([key, value]) => ({ key, value }))
        } else {
          attributes = Object.entries(parsed).map(([key, value]) => ({ key, value }))
        }
      }
      return { attributes, variantConfig }
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

  return { attributes, variantConfig }
}

export function serializeProductSpecifications(attributesList = [], variantConfig = null) {
  const cleanSpecs = (attributesList || []).filter(s => s && s.key && s.key.trim() && s.value && s.value.trim())
  const attributesObj = cleanSpecs.reduce((acc, curr) => ({
    ...acc,
    [curr.key.trim()]: curr.value.trim()
  }), {})

  const hasVariants = variantConfig && variantConfig.enabled && Array.isArray(variantConfig.variants) && variantConfig.variants.length > 0

  if (hasVariants) {
    const cleanVariants = variantConfig.variants.map((v, idx) => ({
      id: v.id || `v-${idx + 1}-${Date.now()}`,
      name: (v.name || '').trim(),
      sku: (v.sku || '').trim(),
      stock: parseInt(v.stock) >= 0 ? parseInt(v.stock) : 0,
      price: v.price ? parseFloat(v.price) : null
    })).filter(v => v.name)

    return JSON.stringify({
      attributes: attributesObj,
      variant_config: {
        enabled: true,
        name: (variantConfig.name || 'Calibre / Medida').trim(),
        variants: cleanVariants
      }
    })
  }

  if (Object.keys(attributesObj).length > 0) {
    return JSON.stringify(attributesObj)
  }

  return null
}

export function calculateTotalVariantStock(variants = []) {
  if (!Array.isArray(variants)) return 0
  return variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
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
