'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Edit2, Trash2, X, Image as ImageIcon, Search, 
  Layers, UploadCloud, Download, Check, AlertTriangle, 
  Eye, RefreshCw, Sliders, CheckSquare, 
  Square, Copy, Sparkles, Zap, Package, ArrowUpDown, Filter,
  Dice5, FileSpreadsheet, PlusCircle, MinusCircle, Clipboard,
  CheckCheck, HelpCircle, FileText, Tag, Ruler, Palette, Box,
  Wand2, ListPlus, SlidersHorizontal, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Gift, Flame, ShoppingBag, ArrowRight
} from 'lucide-react'
import { 
  parseProductSpecifications, 
  serializeProductSpecifications, 
  calculateTotalVariantStock, 
  calculateBundleTotals,
  calculateDiscountSavings,
  isProductBundle,
  formatCLP,
  isVideoUrl 
} from '@/lib/productUtils'
import styles from './productos.module.css'

export default function HoneCatalogPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid' | 'bulk' | 'import'
  
  // Filtering, Searching & Sorting
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'instock' | 'lowstock' | 'outofstock'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'published' | 'draft' | 'discount'
  const [sortBy, setSortBy] = useState('created_at_desc')

  // Pagination & Compact Display State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // 8, 10, 20, 50, 99999
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')

  // Toast notifications
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Help Modal for Import
  const [showImportHelp, setShowImportHelp] = useState(false)

  // Combos & Promotions Builder State
  const [comboModalOpen, setComboModalOpen] = useState(false)
  const [editingComboId, setEditingComboId] = useState(null)
  const [comboSearch, setComboSearch] = useState('')
  const [comboCategoryFilter, setComboCategoryFilter] = useState('all')
  const [selectedComboItems, setSelectedComboItems] = useState([]) // [{ productId, name, price, originalPrice, sku, image_url, quantity, stock }]
  const [comboPricingMode, setComboPricingMode] = useState('fixed') // 'fixed' | 'percent'
  const [comboPrice, setComboPrice] = useState('')
  const [comboDiscountPercent, setComboDiscountPercent] = useState(20)
  const [comboStock, setComboStock] = useState('')
  const [comboFormData, setComboFormData] = useState({
    name: '',
    sku: '',
    category: 'Promociones & Combos',
    description: '',
    badge: 'COMBO PACK',
    image_url: '',
    images: [],
    is_active: true,
    is_featured: true
  })

  // Modals & Editors
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeTabModal, setActiveTabModal] = useState('general') // 'general' | 'pricing' | 'gallery' | 'variants' | 'specs'
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [copiedSku, setCopiedSku] = useState(null)
  
  // Quick Edit Inline
  const [quickEditId, setQuickEditId] = useState(null)
  const [quickFormData, setQuickFormData] = useState({})

  // Detailed Form Data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    specifications: '',
    price: '',
    old_price: '',
    discount: 0,
    stock: 0,
    category: 'Agujas',
    image_url: '',
    images: [],
    badge: '',
    is_active: true,
    is_featured: false
  })

  // Specs Key-Value Builder
  const [specList, setSpecList] = useState([{ key: '', value: '' }])

  // Variants & Subcategories Builder
  const [variantConfig, setVariantConfig] = useState({
    enabled: false,
    name: 'Calibre de las agujas',
    variants: []
  })
  const [bulkVariantsText, setBulkVariantsText] = useState('')

  // Bulk Upload state
  const [bulkFiles, setBulkFiles] = useState([])
  const [bulkUploading, setBulkUploading] = useState(false)
  
  // Import CSV/JSON state
  const [importPreview, setImportPreview] = useState([])
  const [importing, setImporting] = useState(false)

  const fileInputRef = useRef(null)
  const bulkInputRef = useRef(null)
  const importInputRef = useRef(null)
  const searchInputRef = useRef(null)

  const supabase = createClient()

  // 100% Unique SKU Generator Engine
  const generateUniqueSKU = useCallback((catName = '') => {
    const prefix = 'INK'
    let catCode = 'CAT'
    if (catName && catName.trim().length >= 2) {
      catCode = catName.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    }
    
    let attempts = 0
    let candidate = ''
    const existingSkus = new Set(products.map(p => (p.sku || '').toUpperCase()))

    do {
      const randNum = Math.floor(1000 + Math.random() * 90000)
      const randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
      candidate = `${prefix}-${catCode}-${randNum}${randLetter}`
      attempts++
    } while (existingSkus.has(candidate) && attempts < 50)

    return candidate
  }, [products])

  useEffect(() => {
    fetchProducts()
  }, [])

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, stockFilter, statusFilter, sortBy])

  // Keyboard Shortcuts (Ctrl+K or / to search, Ctrl+N for new product)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !modalOpen) {
        e.preventDefault()
        handleOpenModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setProducts(data)
      } else if (error) {
        console.error('Error fetching products:', error)
      }
    } catch (err) {
      console.error('Fetch exception:', err)
    } finally {
      setLoading(false)
    }
  }

  // Categories extraction (including tattoo defaults)
  const defaultCategories = ['Agujas', 'Tintas', 'Cuidado', 'Máquinas', 'Fuentes & Pedales', 'Grips & Punteras', 'Kits', 'Diseños', 'Accesorios']
  const categories = ['all', ...Array.from(new Set([...defaultCategories, ...products.map(p => p.category).filter(Boolean)]))]
  const formCategories = Array.from(new Set([...defaultCategories, ...products.map(p => p.category).filter(Boolean)]))

  // Calculate Metrics
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length
  const totalInventoryValue = products.reduce((acc, p) => acc + (parseFloat(p.price || 0) * parseInt(p.stock || 0)), 0)

  // Copy SKU with confirmation
  const handleCopySku = (sku, e) => {
    if (e) e.stopPropagation()
    if (!sku) return
    navigator.clipboard.writeText(sku)
    setCopiedSku(sku)
    showToast(`SKU ${sku} copiado al portapapeles`)
    setTimeout(() => setCopiedSku(null), 2000)
  }

  // Filtered & Sorted list (Matches title, SKU, category, and variant names/measures)
  const filteredProducts = products.filter(p => {
    const { variantConfig: pVarConf } = parseProductSpecifications(p.specifications)
    const variantNamesStr = (pVarConf.variants || []).map(v => `${v.name} ${v.sku}`).join(' ')

    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
                        variantNamesStr.toLowerCase().includes(search.toLowerCase())
    
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
    
    let matchStock = true
    if (stockFilter === 'instock') matchStock = (p.stock || 0) > 0
    if (stockFilter === 'lowstock') matchStock = (p.stock || 0) > 0 && (p.stock || 0) <= 5
    if (stockFilter === 'outofstock') matchStock = (p.stock || 0) <= 0

    let matchStatus = true
    if (statusFilter === 'published') matchStatus = !!p.is_active
    if (statusFilter === 'draft') matchStatus = !p.is_active
    if (statusFilter === 'discount') matchStatus = (p.discount || 0) > 0 || ((p.old_price || 0) > (p.price || 0))
    if (statusFilter === 'variants') matchStatus = pVarConf.enabled && pVarConf.variants?.length > 0

    return matchSearch && matchCategory && matchStock && matchStatus
  }).sort((a, b) => {
    if (sortBy === 'created_at_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    if (sortBy === 'created_at_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    if (sortBy === 'price_asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
    if (sortBy === 'price_desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
    if (sortBy === 'stock_desc') return (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0)
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '')
    return 0
  })

  // Pagination calculations
  const totalItems = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedProducts = itemsPerPage >= 99999 ? filteredProducts : filteredProducts.slice(startIndex, endIndex)

  // Page Numbers Array Builder (e.g. 1, 2, 3, 4 ... N)
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  // Open Modal with full variant parsing
  const handleOpenModal = (product = null) => {
    setActiveTabModal('general')
    setBulkVariantsText('')
    if (product) {
      setEditingId(product.id)
      
      const { attributes, variantConfig: vConf } = parseProductSpecifications(product.specifications)
      setSpecList(attributes.length > 0 ? attributes : [{ key: '', value: '' }])
      setVariantConfig(vConf)

      let galleryImages = []
      if (Array.isArray(product.images)) galleryImages = product.images
      else if (typeof product.images === 'string') {
        try { galleryImages = JSON.parse(product.images) } catch { galleryImages = [] }
      }
      if (product.image_url && !galleryImages.includes(product.image_url)) {
        galleryImages = [product.image_url, ...galleryImages]
      }

      const prodCategory = product.category || 'Agujas'
      setIsCustomCategory(!formCategories.includes(prodCategory))

      setFormData({
        name: product.name || '',
        sku: product.sku || generateUniqueSKU(prodCategory),
        description: product.description || '',
        specifications: product.specifications || '',
        price: product.price || '',
        old_price: product.old_price || '',
        discount: product.discount || 0,
        stock: product.stock !== undefined ? product.stock : 0,
        category: prodCategory,
        image_url: product.image_url || '',
        images: galleryImages,
        badge: product.badge || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: !!product.is_featured
      })
    } else {
      setEditingId(null)
      setIsCustomCategory(false)
      setSpecList([{ key: '', value: '' }])
      setVariantConfig({
        enabled: false,
        name: 'Calibre de las agujas',
        variants: []
      })
      setFormData({
        name: '',
        sku: generateUniqueSKU('Agujas'),
        description: '',
        specifications: '',
        price: '',
        old_price: '',
        discount: 0,
        stock: 10,
        category: 'Agujas',
        image_url: '',
        images: [],
        badge: 'NUEVO',
        is_active: true,
        is_featured: false
      })
    }
    setModalOpen(true)
  }

  // Generate and set SKU in form
  const handleGenerateModalSku = () => {
    const newSku = generateUniqueSKU(formData.category)
    setFormData(prev => ({ ...prev, sku: newSku }))
    showToast(`SKU generado: ${newSku}`)
  }

  // =========================================================
  // COMBO & PROMO PACKS ENGINE (HONE BUNDLE BUILDER)
  // =========================================================
  
  // Total Original combined price of selected items
  const { totalOriginalPrice: comboTotalOrig, totalItemsCount: comboTotalCount } = calculateBundleTotals(selectedComboItems)

  // Calculated final price and discount
  let finalComboPrice = 0
  let finalComboDiscount = 0
  let comboSavings = 0

  if (comboPricingMode === 'fixed') {
    finalComboPrice = comboPrice !== '' ? parseFloat(comboPrice) || 0 : (comboTotalOrig > 0 ? Math.round(comboTotalOrig * 0.8) : 0)
    if (comboTotalOrig > 0 && finalComboPrice < comboTotalOrig) {
      const { savingsAmount, discountPercentage } = calculateDiscountSavings(comboTotalOrig, finalComboPrice)
      comboSavings = savingsAmount
      finalComboDiscount = discountPercentage
    }
  } else {
    finalComboDiscount = parseInt(comboDiscountPercent) || 0
    finalComboPrice = Math.round(comboTotalOrig * (1 - finalComboDiscount / 100))
    comboSavings = comboTotalOrig - finalComboPrice
  }

  // Recommended minimum stock based on included items
  const recommendedComboStock = selectedComboItems.length > 0
    ? Math.min(...selectedComboItems.map(i => Math.floor((parseInt(i.stock) || 0) / (parseInt(i.quantity) || 1))))
    : 0

  // Open Combo Modal
  const handleOpenComboModal = (product = null) => {
    setComboSearch('')
    setComboCategoryFilter('all')

    if (product) {
      setEditingComboId(product.id)
      const { bundleConfig } = parseProductSpecifications(product.specifications)
      const items = (bundleConfig.items || []).map(bItem => {
        const fullProd = products.find(p => p.id === bItem.productId)
        return {
          productId: bItem.productId || fullProd?.id || '',
          name: bItem.name || fullProd?.name || 'Producto',
          price: bItem.price !== undefined ? bItem.price : fullProd?.price || 0,
          originalPrice: bItem.originalPrice || fullProd?.price || 0,
          sku: bItem.sku || fullProd?.sku || '',
          image_url: bItem.image_url || fullProd?.image_url || '',
          quantity: bItem.quantity || 1,
          stock: fullProd?.stock !== undefined ? fullProd.stock : 10
        }
      })
      setSelectedComboItems(items)
      setComboPricingMode('fixed')
      setComboPrice(product.price ? String(product.price) : '')
      setComboDiscountPercent(product.discount || 20)
      setComboStock(product.stock !== undefined ? String(product.stock) : String(recommendedComboStock))

      let galleryImages = []
      if (Array.isArray(product.images)) galleryImages = product.images
      else if (typeof product.images === 'string') {
        try { galleryImages = JSON.parse(product.images) } catch { galleryImages = [] }
      }

      setComboFormData({
        name: product.name || '',
        sku: product.sku || generateUniqueSKU('Combos'),
        category: product.category || 'Promociones & Combos',
        description: product.description || '',
        badge: product.badge || 'COMBO PACK',
        image_url: product.image_url || '',
        images: galleryImages,
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: product.is_featured !== undefined ? product.is_featured : true
      })
    } else {
      setEditingComboId(null)
      setSelectedComboItems([])
      setComboPricingMode('fixed')
      setComboPrice('')
      setComboDiscountPercent(20)
      setComboStock('')
      setComboFormData({
        name: '',
        sku: generateUniqueSKU('Combos'),
        category: 'Promociones & Combos',
        description: '',
        badge: 'COMBO PACK',
        image_url: '',
        images: [],
        is_active: true,
        is_featured: true
      })
    }
    setComboModalOpen(true)
  }

  // Toggle Item in Combo
  const handleToggleProductInCombo = (prod) => {
    const exists = selectedComboItems.some(i => i.productId === prod.id)
    if (exists) {
      setSelectedComboItems(prev => prev.filter(i => i.productId !== prod.id))
    } else {
      const newItem = {
        productId: prod.id,
        name: prod.name,
        price: parseFloat(prod.price) || 0,
        originalPrice: parseFloat(prod.price) || 0,
        sku: prod.sku || '',
        image_url: prod.image_url || '',
        quantity: 1,
        stock: prod.stock !== undefined ? prod.stock : 10
      }
      setSelectedComboItems(prev => {
        const next = [...prev, newItem]
        if (!comboFormData.image_url && prod.image_url) {
          setComboFormData(f => ({ ...f, image_url: prod.image_url }))
        }
        return next
      })
    }
  }

  // Update Item Quantity in Combo
  const handleUpdateComboItemQty = (prodId, delta) => {
    setSelectedComboItems(prev => prev.map(item => {
      if (item.productId === prodId) {
        const newQty = Math.max(1, (item.quantity || 1) + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  // Remove Item from Combo
  const handleRemoveComboItem = (prodId) => {
    setSelectedComboItems(prev => prev.filter(i => i.productId !== prodId))
  }

  // Auto Generate Combo Name
  const handleGenerateComboName = () => {
    if (selectedComboItems.length === 0) {
      showToast('Selecciona al menos un producto primero', 'error')
      return
    }
    const names = selectedComboItems.map(i => i.name)
    const suggested = names.length <= 2 
      ? `Pack Promo: ${names.join(' + ')}`
      : `Super Combo Pack: ${names.slice(0, 2).join(' + ')} (+${names.length - 2} productos)`
    
    setComboFormData(prev => ({ ...prev, name: suggested }))
    showToast('Nombre sugerido aplicado')
  }

  // Auto Generate Description for Combo
  const handleGenerateComboDescription = () => {
    if (selectedComboItems.length === 0) {
      showToast('Selecciona al menos un producto primero', 'error')
      return
    }

    const itemsList = selectedComboItems.map(i => `• ${i.quantity}x ${i.name} (Ref: ${formatCLP(i.price)} c/u)`).join('\n')
    const desc = `🔥 ¡PROMOCIÓN EXCLUSIVA - PACK COMBO INKEDSOUH!\n\nEste combo especial incluye:\n${itemsList}\n\n💰 Valor individual total: ${formatCLP(comboTotalOrig)}\n⚡ Precio Especial Combo: ${formatCLP(finalComboPrice)}\n✨ ¡Te ahorras ${formatCLP(comboSavings)} comprando el pack completo!`

    setComboFormData(prev => ({ ...prev, description: desc }))
    showToast('Descripción automática generada')
  }

  // Submit Combo Form
  const handleSubmitCombo = async (e) => {
    e.preventDefault()

    if (selectedComboItems.length === 0) {
      showToast('Debes seleccionar al menos un producto para crear el combo', 'error')
      return
    }

    if (!comboFormData.name.trim()) {
      showToast('Ingresa un nombre para la promoción', 'error')
      return
    }

    const finalPriceVal = finalComboPrice > 0 ? finalComboPrice : comboTotalOrig
    const finalOldPriceVal = comboTotalOrig > finalPriceVal ? comboTotalOrig : (parseFloat(comboFormData.old_price) || null)
    const finalDiscountVal = finalComboDiscount > 0 ? finalComboDiscount : 0
    const finalStockVal = comboStock !== '' ? parseInt(comboStock) : recommendedComboStock

    // Collect all images from selected products + custom cover
    const collectedImages = Array.from(new Set([
      comboFormData.image_url,
      ...selectedComboItems.map(i => i.image_url).filter(Boolean),
      ...(comboFormData.images || [])
    ])).filter(Boolean)

    const bundleSpecObj = {
      enabled: true,
      items: selectedComboItems
    }

    const specsJson = serializeProductSpecifications([], null, bundleSpecObj)

    const payload = {
      name: comboFormData.name.trim(),
      sku: comboFormData.sku.trim() || generateUniqueSKU('Combos'),
      category: comboFormData.category || 'Promociones & Combos',
      description: comboFormData.description.trim() || `Combo de ${selectedComboItems.length} productos seleccionados con precio especial.`,
      specifications: specsJson,
      price: finalPriceVal,
      old_price: finalOldPriceVal,
      discount: finalDiscountVal,
      stock: finalStockVal,
      badge: comboFormData.badge || 'COMBO PACK',
      image_url: comboFormData.image_url || collectedImages[0] || null,
      images: collectedImages,
      is_active: comboFormData.is_active,
      is_featured: comboFormData.is_featured
    }

    try {
      if (editingComboId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingComboId)
        if (error) throw error
        showToast(`Combo "${comboFormData.name}" actualizado exitosamente`)
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error
        showToast(`¡Combo "${comboFormData.name}" creado y publicado!`)
      }

      setComboModalOpen(false)
      fetchProducts()
    } catch (err) {
      console.error('Error saving combo:', err)
      showToast('Error al guardar el combo: ' + err.message, 'error')
    }
  }

  // VARIANT HANDLERS (HONE PRO)
  const handleToggleVariantFeature = (checked) => {
    setVariantConfig(prev => ({
      ...prev,
      enabled: checked,
      name: prev.name || 'Calibre de las agujas',
      variants: checked && (!prev.variants || prev.variants.length === 0) ? [
        { id: `v-${Date.now()}-1`, name: '1207', sku: '1207RM', stock: 25, price: '' },
        { id: `v-${Date.now()}-2`, name: '1205', sku: '1205RM', stock: 20, price: '' },
        { id: `v-${Date.now()}-3`, name: '1209', sku: '1209RM', stock: 15, price: '' }
      ] : prev.variants
    }))
  }

  const handleAddVariant = () => {
    const nextIdx = (variantConfig.variants?.length || 0) + 1
    const newVariant = {
      id: `v-${Date.now()}-${nextIdx}`,
      name: '',
      sku: `${formData.sku ? formData.sku + '-V' + nextIdx : generateUniqueSKU(formData.category)}`,
      stock: 10,
      price: ''
    }
    setVariantConfig(prev => ({
      ...prev,
      enabled: true,
      variants: [...(prev.variants || []), newVariant]
    }))
  }

  const handleUpdateVariant = (index, field, value) => {
    const updated = [...(variantConfig.variants || [])]
    updated[index] = { ...updated[index], [field]: value }
    setVariantConfig(prev => ({
      ...prev,
      variants: updated
    }))
  }

  const handleRegenerateVariantSku = (index) => {
    const v = variantConfig.variants[index]
    const varName = v.name ? v.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : `V${index + 1}`
    const baseCode = formData.sku ? formData.sku.split('-')[0] : 'INK'
    const newSku = `${varName}`
    handleUpdateVariant(index, 'sku', newSku)
    showToast(`SKU asignado: ${newSku}`)
  }

  const handleRemoveVariant = (index) => {
    const updated = (variantConfig.variants || []).filter((_, i) => i !== index)
    setVariantConfig(prev => ({
      ...prev,
      variants: updated
    }))
  }

  const handleGenerateBulkVariants = (customText = null) => {
    const textToProcess = customText !== null ? customText : bulkVariantsText
    if (!textToProcess || !textToProcess.trim()) {
      showToast('Ingresa los calibres o medidas separados por comas', 'error')
      return
    }

    const items = textToProcess
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean)

    if (items.length === 0) return

    const existingNames = new Set((variantConfig.variants || []).map(v => v.name.trim().toLowerCase()))

    const newVariants = items
      .filter(item => !existingNames.has(item.toLowerCase()))
      .map((item, idx) => {
        const cleanItemCode = item.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        return {
          id: `v-${Date.now()}-${idx}`,
          name: item,
          sku: cleanItemCode || `VAR-${idx + 1}`,
          stock: 20,
          price: ''
        }
      })

    if (newVariants.length === 0) {
      showToast('Las opciones ya estaban en la lista', 'error')
      return
    }

    const merged = [...(variantConfig.variants || []), ...newVariants]
    setVariantConfig(prev => ({
      ...prev,
      enabled: true,
      variants: merged
    }))
    setBulkVariantsText('')
    showToast(`¡${newVariants.length} opciones agregadas con éxito!`)
  }

  const applyNeedlePreset = (presetType) => {
    if (presetType === 'RM') {
      setVariantConfig(prev => ({ ...prev, enabled: true, name: 'Calibre de las agujas' }))
      handleGenerateBulkVariants('1207, 1205, 1209, 1215, 1211, 1213, 1243, 1219, 1027')
    } else if (presetType === 'MC') {
      setVariantConfig(prev => ({ ...prev, enabled: true, name: 'Medida Magnum Curva (MC)' }))
      handleGenerateBulkVariants('1007MC, 1009MC, 1011MC, 1013MC, 1015MC')
    } else if (presetType === 'RL') {
      setVariantConfig(prev => ({ ...prev, enabled: true, name: 'Calibre Round Liner (RL)' }))
      handleGenerateBulkVariants('1003RL, 1005RL, 1007RL, 1009RL, 1203RL, 1205RL, 1207RL, 1209RL')
    } else if (presetType === 'RS') {
      setVariantConfig(prev => ({ ...prev, enabled: true, name: 'Calibre Round Shader (RS)' }))
      handleGenerateBulkVariants('1205RS, 1207RS, 1209RS, 1211RS, 1214RS')
    } else if (presetType === 'TALLAS') {
      setVariantConfig(prev => ({ ...prev, enabled: true, name: 'Talla' }))
      handleGenerateBulkVariants('S, M, L, XL, XXL')
    } else if (presetType === 'COLORES') {
      setVariantConfig(prev => ({ ...prev, enabled: true, name: 'Color / Tono' }))
      handleGenerateBulkVariants('Negro Triple Black, Dynamic Black, Blanco Nieve, Rojo Fuego, Azul Tribal')
    }
  }

  const handleSyncStockFromVariants = () => {
    const total = calculateTotalVariantStock(variantConfig.variants)
    setFormData(prev => ({ ...prev, stock: total }))
    showToast(`Stock total sincronizado a ${total} unidades`)
  }

  // Quick Inline Stock Adjust (+1 / -1)
  const handleQuickStockAdjust = async (product, delta, e) => {
    if (e) e.stopPropagation()
    const currentStock = parseInt(product.stock) || 0
    const newStock = Math.max(0, currentStock + delta)
    if (newStock === currentStock) return

    setProducts(products.map(p => p.id === product.id ? { ...p, stock: newStock } : p))

    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
      if (error) throw error
    } catch (err) {
      console.error('Stock adjust error:', err)
      fetchProducts()
      showToast('Error al actualizar stock', 'error')
    }
  }

  // Handle Spec Changes
  const handleSpecChange = (index, field, value) => {
    const updated = [...specList]
    updated[index][field] = value
    setSpecList(updated)
  }

  const addSpecRow = () => {
    setSpecList([...specList, { key: '', value: '' }])
  }

  const removeSpecRow = (index) => {
    const updated = specList.filter((_, i) => i !== index)
    setSpecList(updated.length ? updated : [{ key: '', value: '' }])
  }

  // Upload Multiple Images to Product Gallery
  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(10)
    
    const uploadedUrls = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15)
      const fileName = `${cleanName}_${Date.now()}_${i}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin_uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('admin_uploads')
          .getPublicUrl(filePath)
        
        uploadedUrls.push(publicUrl)
      }
      setUploadProgress(Math.round(((i + 1) / files.length) * 100))
    }

    if (uploadedUrls.length > 0) {
      const updatedGallery = [...(formData.images || []), ...uploadedUrls]
      const mainImage = formData.image_url || uploadedUrls[0]
      setFormData(prev => ({
        ...prev,
        images: updatedGallery,
        image_url: mainImage
      }))
      showToast(`${uploadedUrls.length} imagen(es) agregada(s)`)
    } else {
      showToast('Error al subir imágenes', 'error')
    }

    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const setAsPrimaryImage = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }))
    showToast('Imagen principal seleccionada')
  }

  const removeGalleryImage = (url) => {
    const newImages = (formData.images || []).filter(img => img !== url)
    let newMain = formData.image_url
    if (newMain === url) {
      newMain = newImages[0] || ''
    }
    setFormData(prev => ({
      ...prev,
      images: newImages,
      image_url: newMain
    }))
  }

  // Calculate discount percentage automatically
  const handlePriceChange = (priceVal, oldPriceVal) => {
    const p = parseFloat(priceVal) || 0
    const op = parseFloat(oldPriceVal) || 0
    let discount = 0
    if (op > p && op > 0) {
      discount = Math.round(((op - p) / op) * 100)
    }
    setFormData(prev => ({
      ...prev,
      price: priceVal,
      old_price: oldPriceVal,
      discount: discount
    }))
  }

  // Save Detailed Product (with Variants & Specifications)
  const handleSubmitProduct = async (e) => {
    e.preventDefault()

    const specsString = serializeProductSpecifications(specList, variantConfig)

    // Calculate final stock
    let finalStock = parseInt(formData.stock) || 0
    if (variantConfig.enabled && variantConfig.variants && variantConfig.variants.length > 0) {
      const variantTotal = calculateTotalVariantStock(variantConfig.variants)
      if (variantTotal > 0) {
        finalStock = variantTotal
      }
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku?.trim() || generateUniqueSKU(formData.category),
      description: formData.description?.trim() || null,
      specifications: specsString,
      price: parseFloat(formData.price) || 0,
      old_price: formData.old_price ? parseFloat(formData.old_price) : null,
      discount: parseInt(formData.discount) || 0,
      stock: finalStock,
      category: formData.category || 'Agujas',
      image_url: formData.image_url || (formData.images && formData.images[0]) || null,
      images: formData.images || [],
      badge: formData.badge?.trim() || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId)
        
        if (error) throw error
        showToast('Producto actualizado exitosamente con variantes')
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload])
        
        if (error) throw error
        showToast('Producto creado y sincronizado en la tienda')
      }

      setModalOpen(false)
      fetchProducts()
    } catch (err) {
      console.error('Submit error:', err)
      showToast('Error al guardar: ' + (err.message || 'Verifica la conexión'), 'error')
    }
  }

  // Quick Inline Edit Handlers
  const startQuickEdit = (product) => {
    setQuickEditId(product.id)
    setQuickFormData({
      name: product.name,
      sku: product.sku || generateUniqueSKU(product.category),
      price: product.price,
      stock: product.stock,
      category: product.category,
      is_active: product.is_active
    })
  }

  const saveQuickEdit = async (id) => {
    try {
      const payload = {
        name: quickFormData.name,
        sku: quickFormData.sku,
        price: parseFloat(quickFormData.price) || 0,
        stock: parseInt(quickFormData.stock) || 0,
        category: quickFormData.category,
        is_active: quickFormData.is_active
      }

      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (error) throw error
      
      setProducts(products.map(p => p.id === id ? { ...p, ...payload } : p))
      setQuickEditId(null)
      showToast('Edición rápida guardada')
    } catch (err) {
      showToast('Error al actualizar: ' + err.message, 'error')
    }
  }

  // Toggle active single
  const handleToggleActive = async (product) => {
    const nextState = !product.is_active
    const { error } = await supabase.from('products').update({ is_active: nextState }).eq('id', product.id)
    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: nextState } : p))
      showToast(nextState ? 'Producto publicado en tienda' : 'Producto archivado como borrador')
    }
  }

  // Duplicate Product
  const handleDuplicate = async (product) => {
    try {
      const duplicatePayload = {
        name: `${product.name} (Copia)`,
        sku: generateUniqueSKU(product.category),
        description: product.description,
        specifications: product.specifications,
        price: product.price,
        old_price: product.old_price,
        discount: product.discount,
        stock: product.stock,
        category: product.category,
        image_url: product.image_url,
        images: product.images,
        badge: 'COPIA',
        is_active: false,
        is_featured: false
      }

      const { error } = await supabase.from('products').insert([duplicatePayload])
      if (error) throw error
      showToast('Producto duplicado como borrador')
      fetchProducts()
    } catch (err) {
      showToast('Error al duplicar: ' + err.message, 'error')
    }
  }

  // Delete Product
  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) {
        setProducts(products.filter(p => p.id !== id))
        setSelectedIds(selectedIds.filter(item => item !== id))
        showToast('Producto eliminado')
      } else {
        showToast('Error al eliminar', 'error')
      }
    }
  }

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    const pageIds = paginatedProducts.map(p => p.id)
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id))
    if (allPageSelected) {
      setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)))
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])))
    }
  }

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Execute Bulk Action
  const handleExecuteBulkAction = async () => {
    if (selectedIds.length === 0) {
      showToast('Selecciona al menos un producto', 'error')
      return
    }

    if (!bulkAction) return

    try {
      if (bulkAction === 'activate') {
        await supabase.from('products').update({ is_active: true }).in('id', selectedIds)
        setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, is_active: true } : p))
        showToast(`${selectedIds.length} productos publicados`)
      } else if (bulkAction === 'deactivate') {
        await supabase.from('products').update({ is_active: false }).in('id', selectedIds)
        setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, is_active: false } : p))
        showToast(`${selectedIds.length} productos ocultados`)
      } else if (bulkAction === 'delete') {
        if (confirm(`¿Eliminar definitivamente los ${selectedIds.length} productos seleccionados?`)) {
          await supabase.from('products').delete().in('id', selectedIds)
          setProducts(products.filter(p => !selectedIds.includes(p.id)))
          setSelectedIds([])
          showToast(`${selectedIds.length} productos eliminados`)
        }
      } else if (bulkAction === 'discount10') {
        for (const id of selectedIds) {
          const item = products.find(p => p.id === id)
          if (item) {
            const currentPrice = parseFloat(item.price) || 0
            const newOldPrice = item.old_price || currentPrice
            const newPrice = Math.round(currentPrice * 0.9)
            await supabase.from('products').update({ price: newPrice, old_price: newOldPrice, discount: 10 }).eq('id', id)
          }
        }
        showToast('Descuento de 10% aplicado a lote')
        fetchProducts()
      } else if (bulkAction === 'generatesku') {
        for (const id of selectedIds) {
          const item = products.find(p => p.id === id)
          if (item) {
            const freshSku = generateUniqueSKU(item.category)
            await supabase.from('products').update({ sku: freshSku }).eq('id', id)
          }
        }
        showToast(`SKUs regenerados para ${selectedIds.length} productos`)
        fetchProducts()
      }
      setSelectedIds([])
      setBulkAction('')
    } catch (err) {
      showToast('Error en acción por lote: ' + err.message, 'error')
    }
  }

  // Bulk Upload File Handler with stable preservation
  const handleBulkFilesSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const rows = files.map((file, idx) => {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      const cleanTitle = baseName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      return {
        id: `bulk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        preview: URL.createObjectURL(file),
        name: cleanTitle,
        category: 'Cuidado',
        price: '15000',
        stock: '10',
        sku: generateUniqueSKU('Cuidado'),
        status: 'pending'
      }
    })

    setBulkFiles(prev => [...prev, ...rows])
  }

  const updateBulkRow = (id, field, value) => {
    setBulkFiles(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row))
  }

  const regenerateBulkRowSku = (id, category) => {
    const fresh = generateUniqueSKU(category)
    setBulkFiles(prev => prev.map(row => row.id === id ? { ...row, sku: fresh } : row))
    showToast(`Nuevo SKU: ${fresh}`)
  }

  const removeBulkRow = (id) => {
    setBulkFiles(prev => prev.filter(row => row.id !== id))
  }

  const processBulkUpload = async () => {
    if (bulkFiles.length === 0) return

    setBulkUploading(true)
    let completedCount = 0

    for (let i = 0; i < bulkFiles.length; i++) {
      const row = bulkFiles[i]
      try {
        setBulkFiles(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'uploading' } : r))

        const fileExt = row.file.name.split('.').pop()
        const cleanName = row.file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15)
        const fileName = `${cleanName}_bulk_${Date.now()}_${i}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('admin_uploads')
          .upload(filePath, row.file, { cacheControl: '3600', upsert: true })

        let publicUrl = ''
        if (!uploadError) {
          const { data } = supabase.storage.from('admin_uploads').getPublicUrl(filePath)
          publicUrl = data.publicUrl
        }

        const productPayload = {
          name: row.name.trim() || 'Nuevo Producto',
          sku: row.sku || generateUniqueSKU(row.category),
          category: row.category || 'General',
          price: parseFloat(row.price) || 0,
          stock: parseInt(row.stock) || 0,
          image_url: publicUrl || null,
          images: publicUrl ? [publicUrl] : [],
          is_active: true,
          description: `Producto catalogado con HONE CATALOG.`,
          badge: 'NUEVO'
        }

        const { error: insertError } = await supabase.from('products').insert([productPayload])

        if (insertError) throw insertError

        setBulkFiles(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done' } : r))
        completedCount++
      } catch (err) {
        console.error('Error on bulk item', i, err)
        setBulkFiles(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r))
      }
    }

    setBulkUploading(false)
    showToast(`¡Proceso completado! ${completedCount} productos creados`)
    fetchProducts()
    setTimeout(() => {
      setBulkFiles([])
      setViewMode('table')
    }, 1200)
  }

  // Import CSV / JSON
  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        let parsed = []
        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(text)
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim())
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          parsed = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim())
            const obj = {}
            headers.forEach((h, idx) => {
              obj[h] = values[idx] || ''
            })
            return obj
          })
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map(item => ({
            name: item.name || item.titulo || item.nombre || 'Producto Importado',
            sku: item.sku || generateUniqueSKU(item.category || item.categoria),
            price: parseFloat(item.price || item.precio) || 10000,
            stock: parseInt(item.stock) || 5,
            category: item.category || item.categoria || 'General',
            description: item.description || item.descripcion || '',
            image_url: item.image_url || item.imagen || null,
            is_active: true
          }))
          setImportPreview(formatted)
          setViewMode('import')
          showToast(`${formatted.length} productos listos para importar`)
        } else {
          showToast('El archivo no contiene productos válidos', 'error')
        }
      } catch (err) {
        showToast('Error al leer archivo: ' + err.message, 'error')
      }
    }
    reader.readAsText(file)
  }

  const executeImport = async () => {
    if (importPreview.length === 0) return
    setImporting(true)
    try {
      const { error } = await supabase.from('products').insert(importPreview)
      if (error) throw error
      showToast(`${importPreview.length} productos importados con éxito`)
      setImportPreview([])
      setViewMode('table')
      fetchProducts()
    } catch (err) {
      showToast('Error en importación: ' + err.message, 'error')
    } finally {
      setImporting(false)
    }
  }

  // Export Catalogue as JSON/CSV
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `HONE_CATALOG_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showToast('Catálogo exportado exitosamente en JSON')
  }

  return (
    <div className={styles.container}>
      {/* Toast Alert */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.honeBrand}>HONE CATALOG</span>
            <span className={styles.versionBadge}>HONE V1.0</span>
            <span className={styles.shortcutTip}>Atajo: Ctrl+K / Ctrl+N</span>
          </div>
          <h1 className={styles.title}>Catálogo & Gestor de Inventario</h1>
          <p className={styles.subtitle}>
            Generador de SKU único aleatorio, edición en línea, subidas masivas y sincronización instantánea con tienda web.
          </p>
        </div>

        <div className={styles.topActions}>
          {/* Import Button with (?) helper */}
          <div className={styles.importBtnGroup}>
            <label className={styles.btnSecondary} title="Importar Catálogo (CSV / JSON)">
              <FileSpreadsheet size={16} />
              <span>Importar</span>
              <input 
                type="file" 
                ref={importInputRef} 
                accept=".csv,.json" 
                onChange={handleImportFileSelect} 
                style={{ display: 'none' }} 
              />
            </label>
            <button 
              type="button" 
              onClick={() => setShowImportHelp(true)} 
              className={styles.btnHelpQuestion}
              title="¿Cómo funciona el botón Importar?"
            >
              <HelpCircle size={15} />
            </button>
          </div>

          <button onClick={handleExportJSON} className={styles.btnSecondary} title="Exportar Catálogo en JSON">
            <Download size={16} />
            <span>Exportar</span>
          </button>

          <button 
            onClick={() => setViewMode(viewMode === 'bulk' ? 'table' : 'bulk')} 
            className={`${styles.btnSecondary} ${viewMode === 'bulk' ? styles.btnActive : ''}`}
          >
            <UploadCloud size={16} />
            <span>Carga Masiva</span>
          </button>

          <button 
            type="button"
            onClick={() => handleOpenComboModal()} 
            className={styles.btnComboAdd}
            title="Crear Pack Promocional o Combo con Descuento"
          >
            <Gift size={18} />
            <span>Crear Combo / Promo</span>
          </button>

          <button onClick={() => handleOpenModal()} className={styles.btnAdd}>
            <Plus size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Bar */}
      <div className={styles.metricsBar}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Productos</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{totalProducts}</span>
            <Package size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Activos en Tienda</span>
          <div className={styles.metricValueWrap}>
            <span className={`${styles.metricValue} ${styles.textSuccess}`}>{activeProducts}</span>
            <Eye size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Agotados / Bajo Stock</span>
          <div className={styles.metricValueWrap}>
            <span className={`${styles.metricValue} ${outOfStockCount > 0 ? styles.textDanger : styles.textWarning}`}>
              {outOfStockCount} / {lowStockCount}
            </span>
            <AlertTriangle size={18} className={styles.metricIcon} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Valor en Inventario</span>
          <div className={styles.metricValueWrap}>
            <span className={styles.metricValue}>{formatCLP(totalInventoryValue)}</span>
            <Sparkles size={18} className={styles.metricIcon} />
          </div>
        </div>
      </div>

      {/* IMPORT PREVIEW VIEW */}
      {viewMode === 'import' && (
        <div className={styles.bulkContainer}>
          <div className={styles.bulkHeader}>
            <div>
              <h3>Importador de Catálogo ({importPreview.length} artículos detectados)</h3>
              <p>Revisa la vista previa antes de sincronizar con tu base de datos de Supabase.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={styles.btnSecondary} onClick={() => setViewMode('table')}>
                Cancelar
              </button>
              <button className={styles.btnAdd} onClick={executeImport} disabled={importing}>
                {importing ? <RefreshCw size={16} className={styles.spin} /> : <Zap size={16} />}
                <span>{importing ? 'Importando...' : 'Confirmar e Importar Todos'}</span>
              </button>
            </div>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>SKU Generado</th>
                  <th>Categoría</th>
                  <th>Precio (CLP)</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong style={{ color: '#fff' }}>{item.name}</strong></td>
                    <td><span className={styles.skuTagInline}>{item.sku}</span></td>
                    <td><span className={styles.categoryBadge}>{item.category}</span></td>
                    <td><span style={{ color: '#4ade80', fontWeight: 600 }}>{formatCLP(item.price)}</span></td>
                    <td><span>{item.stock} un.</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BULK UPLOAD VIEW */}
      {viewMode === 'bulk' && (
        <div className={styles.bulkContainer}>
          <div className={styles.bulkHeader}>
            <div>
              <h3>Carga Masiva de Productos (Drag & Drop Inteligente)</h3>
              <p>Arrastra varias fotos. El motor HONE generará filas con títulos y SKUs únicos automáticos sin desordenar tu lista.</p>
            </div>
            <button className={styles.btnSecondary} onClick={() => setViewMode('table')}>
              Cerrar Carga Masiva
            </button>
          </div>

          <div 
            className={styles.dropzone}
            onClick={() => bulkInputRef.current?.click()}
          >
            <UploadCloud size={48} className={styles.dropIcon} />
            <h4>Haz clic o arrastra tus fotos aquí</h4>
            <p>PNG, JPG, WEBP — Soporta subida masiva simultánea</p>
            <input 
              type="file" 
              ref={bulkInputRef} 
              multiple 
              accept="image/*" 
              onChange={handleBulkFilesSelect} 
              style={{ display: 'none' }} 
            />
          </div>

          {bulkFiles.length > 0 && (
            <div className={styles.bulkTableWrap}>
              <div className={styles.bulkTableActions}>
                <span>{bulkFiles.length} productos listos para publicar</span>
                <button 
                  onClick={processBulkUpload} 
                  disabled={bulkUploading} 
                  className={styles.btnAdd}
                >
                  {bulkUploading ? <RefreshCw size={16} className={styles.spin} /> : <Zap size={16} />}
                  <span>{bulkUploading ? 'Publicando...' : 'Publicar Todo el Lote'}</span>
                </button>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Foto</th>
                      <th>Nombre del Producto</th>
                      <th>SKU & Regenerar</th>
                      <th>Categoría</th>
                      <th>Precio (CLP)</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkFiles.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <img src={row.preview} alt="preview" className={styles.bulkThumb} />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={row.name} 
                            onChange={(e) => updateBulkRow(row.id, 'name', e.target.value)} 
                            className={styles.inlineInput} 
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input 
                              type="text" 
                              value={row.sku} 
                              onChange={(e) => updateBulkRow(row.id, 'sku', e.target.value)} 
                              className={styles.inlineInput} 
                              style={{ width: '130px' }}
                            />
                            <button 
                              type="button" 
                              onClick={() => regenerateBulkRowSku(row.id, row.category)} 
                              className={styles.btnGenIcon} 
                              title="Regenerar SKU Aleatorio"
                            >
                              <Dice5 size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={row.category} 
                            onChange={(e) => updateBulkRow(row.id, 'category', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '120px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.price} 
                            onChange={(e) => updateBulkRow(row.id, 'price', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '100px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.stock} 
                            onChange={(e) => updateBulkRow(row.id, 'stock', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td>
                          {row.status === 'pending' && <span className={styles.tagPending}>Listo</span>}
                          {row.status === 'uploading' && <span className={styles.tagUploading}>Subiendo...</span>}
                          {row.status === 'done' && <span className={styles.tagDone}><Check size={12} /> Publicado</span>}
                          {row.status === 'error' && <span className={styles.tagError}>Error</span>}
                        </td>
                        <td>
                          <button onClick={() => removeBulkRow(row.id)} className={styles.btnActionIcon} title="Quitar">
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Filter & View Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Buscar por nombre, SKU o categoría (Ctrl+K)..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.clearSearchBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.selectWrapper}>
            <Filter size={14} />
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.select}
            >
              <option value="all">Todas las Categorías</option>
              {categories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">Todos los Estados</option>
              <option value="published">Solo Publicados</option>
              <option value="draft">Solo Borradores</option>
              <option value="discount">Con Descuento / Oferta</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select 
              value={stockFilter} 
              onChange={(e) => setStockFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">Todo el Inventario</option>
              <option value="instock">Con Stock disponible</option>
              <option value="lowstock">Bajo Stock (≤ 5)</option>
              <option value="outofstock">Agotados (0)</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <ArrowUpDown size={14} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.select}
            >
              <option value="created_at_desc">Más recientes</option>
              <option value="created_at_asc">Más antiguos</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="stock_desc">Mayor Stock</option>
              <option value="name_asc">Nombre A-Z</option>
            </select>
          </div>

          {/* View Mode Toggle: Lista (Tabla) vs Galería (Cuadrícula) */}
          <div className={styles.viewModeToggle}>
            <button 
              type="button"
              onClick={() => setViewMode('table')} 
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              title="Vista Lista / Tabla WP"
            >
              <Layers size={16} />
              <span>Lista</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('grid')} 
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              title="Vista Cuadrícula / Fotos"
            >
              <ImageIcon size={16} />
              <span>Fotos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Selector */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkActionBar}>
          <div className={styles.bulkSelectCount}>
            <CheckSquare size={16} />
            <span>{selectedIds.length} producto(s) seleccionado(s)</span>
          </div>

          <div className={styles.bulkActionControls}>
            <select 
              value={bulkAction} 
              onChange={(e) => setBulkAction(e.target.value)}
              className={styles.select}
            >
              <option value="">Acciones por Lote...</option>
              <option value="activate">Publicar en tienda</option>
              <option value="deactivate">Ocultar de tienda</option>
              <option value="generatesku">Generar nuevos SKUs aleatorios</option>
              <option value="discount10">Aplicar 10% Descuento</option>
              <option value="delete">Eliminar definitivamente</option>
            </select>

            <button onClick={handleExecuteBulkAction} className={styles.btnExecute}>
              Aplicar
            </button>
            
            <button onClick={() => setSelectedIds([])} className={styles.btnCancelSelect}>
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* PRODUCTS DISPLAY */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <RefreshCw size={28} className={styles.spin} />
          <p>Sincronizando HONE CATALOG...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={52} className={styles.emptyIcon} />
          <h3>No se encontraron productos</h3>
          <p>Prueba con otros términos de búsqueda o añade tu primer artículo.</p>
          <button onClick={() => handleOpenModal()} className={styles.btnAdd}>
            <Plus size={16} />
            Crear Producto
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (WP STYLE) */
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <button onClick={handleSelectAll} className={styles.checkboxBtn}>
                    {paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id)) ? (
                      <CheckSquare size={18} className={styles.checkedIcon} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th style={{ width: '60px' }}>Img</th>
                <th>Nombre del Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock Rápido</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id)
                const isQuickEditing = quickEditId === product.id

                if (isQuickEditing) {
                  return (
                    <tr key={product.id} className={styles.quickEditRow}>
                      <td colSpan="9">
                        <div className={styles.quickEditContainer}>
                          <div className={styles.quickEditHeader}>
                            <strong>Edición Rápida: {product.name}</strong>
                            <button onClick={() => setQuickEditId(null)} className={styles.btnActionIcon}><X size={16} /></button>
                          </div>
                          <div className={styles.quickEditGrid}>
                            <div className={styles.formGroup}>
                              <label>Nombre</label>
                              <input 
                                type="text" 
                                value={quickFormData.name} 
                                onChange={e => setQuickFormData({ ...quickFormData, name: e.target.value })} 
                                className={styles.input} 
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>SKU</label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                  type="text" 
                                  value={quickFormData.sku} 
                                  onChange={e => setQuickFormData({ ...quickFormData, sku: e.target.value })} 
                                  className={styles.input} 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setQuickFormData({ ...quickFormData, sku: generateUniqueSKU(quickFormData.category) })}
                                  className={styles.btnGenSku}
                                  title="Generar SKU Aleatorio"
                                >
                                  <Dice5 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Precio (CLP)</label>
                              <input 
                                type="number" 
                                value={quickFormData.price} 
                                onChange={e => setQuickFormData({ ...quickFormData, price: e.target.value })} 
                                className={styles.input} 
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Stock</label>
                              <input 
                                type="number" 
                                value={quickFormData.stock} 
                                onChange={e => setQuickFormData({ ...quickFormData, stock: e.target.value })} 
                                className={styles.input} 
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Categoría</label>
                              <input 
                                type="text" 
                                value={quickFormData.category} 
                                onChange={e => setQuickFormData({ ...quickFormData, category: e.target.value })} 
                                className={styles.input} 
                              />
                            </div>
                            <div className={styles.quickEditCheckboxWrap}>
                              <input 
                                type="checkbox" 
                                id={`quick-active-${product.id}`}
                                checked={quickFormData.is_active} 
                                onChange={e => setQuickFormData({ ...quickFormData, is_active: e.target.checked })} 
                              />
                              <label htmlFor={`quick-active-${product.id}`}>Publicado en tienda</label>
                            </div>
                          </div>
                          <div className={styles.quickEditActions}>
                            <button onClick={() => setQuickEditId(null)} className={styles.btnSecondary}>Cancelar</button>
                            <button onClick={() => saveQuickEdit(product.id)} className={styles.btnAdd}>Guardar Cambios</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={product.id} className={`${isSelected ? styles.rowSelected : ''}`}>
                    <td>
                      <button onClick={() => handleToggleSelect(product.id)} className={styles.checkboxBtn}>
                        {isSelected ? <CheckSquare size={18} className={styles.checkedIcon} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td>
                      <div className={styles.thumbWrapper}>
                        {product.image_url ? (
                          isVideoUrl(product.image_url) ? (
                            <video src={product.image_url} autoPlay muted loop playsInline className={styles.productThumb} />
                          ) : (
                            <img src={product.image_url} alt={product.name} className={styles.productThumb} />
                          )
                        ) : (
                          <div className={styles.thumbPlaceholder}><ImageIcon size={18} /></div>
                        )}
                        {product.images && product.images.length > 1 && (
                          <span className={styles.galleryBadge}>+{product.images.length - 1}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.productTitleCol}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={styles.productName}>{product.name}</span>
                          {isProductBundle(product) && <span className={styles.comboBadgePill}>🎁 COMBO PACK</span>}
                          {product.badge && !isProductBundle(product) && <span className={styles.badgePill}>{product.badge}</span>}
                        </div>
                        {(() => {
                          const { variantConfig: itemVars } = parseProductSpecifications(product.specifications)
                          if (itemVars.enabled && itemVars.variants && itemVars.variants.length > 0) {
                            return (
                              <div className={styles.variantBadgeRow}>
                                <span className={styles.variantBadge}>
                                  ⚡ {itemVars.variants.length} {itemVars.name || 'Variantes'}:
                                </span>
                                <span className={styles.variantListText} title={itemVars.variants.map(v => v.name).join(', ')}>
                                  {itemVars.variants.slice(0, 5).map(v => v.name).join(', ')}
                                  {itemVars.variants.length > 5 ? ` +${itemVars.variants.length - 5}` : ''}
                                </span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </td>
                    <td>
                      <div className={styles.skuActionRow}>
                        <span className={styles.skuText}>{product.sku || 'SIN SKU'}</span>
                        {product.sku && (
                          <button 
                            onClick={(e) => handleCopySku(product.sku, e)} 
                            className={styles.copySkuBtn}
                            title="Copiar SKU"
                          >
                            {copiedSku === product.sku ? <CheckCheck size={12} color="#4ade80" /> : <Clipboard size={12} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>{product.category || 'General'}</span>
                    </td>
                    <td>
                      <div className={styles.priceColumn}>
                        <span className={styles.priceMain}>{formatCLP(product.price)}</span>
                        {product.old_price > product.price && (
                          <span className={styles.priceOld}>{formatCLP(product.old_price)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {/* Fast stock controls */}
                      <div className={styles.fastStockControl}>
                        <button 
                          onClick={(e) => handleQuickStockAdjust(product, -1, e)} 
                          className={styles.stockIncBtn} 
                          title="Restar 1 de stock"
                          disabled={product.stock <= 0}
                        >
                          <MinusCircle size={15} />
                        </button>
                        <span className={`
                          ${styles.stockIndicator} 
                          ${product.stock <= 0 ? styles.stockRed : product.stock <= 5 ? styles.stockYellow : styles.stockGreen}
                        `}>
                          {product.stock <= 0 ? '0 un.' : `${product.stock} un.`}
                        </span>
                        <button 
                          onClick={(e) => handleQuickStockAdjust(product, 1, e)} 
                          className={styles.stockIncBtn} 
                          title="Añadir 1 de stock"
                        >
                          <PlusCircle size={15} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleActive(product)}
                        className={`${styles.statusToggle} ${product.is_active ? styles.statusActive : styles.statusInactive}`}
                        title={product.is_active ? 'Visible en tienda (Click para ocultar)' : 'Oculto (Click para publicar)'}
                      >
                        <span className={styles.statusDot}></span>
                        {product.is_active ? 'Publicado' : 'Borrador'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actionButtonsRow}>
                        <button onClick={() => startQuickEdit(product)} className={styles.btnActionIcon} title="Edición Rápida">
                          <Sliders size={15} />
                        </button>
                        <button 
                          onClick={() => isProductBundle(product) ? handleOpenComboModal(product) : handleOpenModal(product)} 
                          className={styles.btnActionIcon} 
                          title={isProductBundle(product) ? "Editar Combo Pack" : "Editor Completo"}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDuplicate(product)} className={styles.btnActionIcon} title="Duplicar">
                          <Copy size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className={`${styles.btnActionIcon} ${styles.btnDeleteIcon}`} title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW (VISOR POR FOTOS / TARJETAS) */
        <div className={styles.grid}>
          {paginatedProducts.map((product) => {
            const { variantConfig: itemVars } = parseProductSpecifications(product.specifications)
            const isBundle = isProductBundle(product)
            return (
              <div key={product.id} className={styles.gridCard}>
                <div className={styles.gridCardMedia}>
                  {product.image_url ? (
                    isVideoUrl(product.image_url) ? (
                      <video src={product.image_url} autoPlay muted loop playsInline className={styles.gridCardImg} />
                    ) : (
                      <img src={product.image_url} alt={product.name} className={styles.gridCardImg} />
                    )
                  ) : (
                    <div className={styles.noImagePlaceholder}><ImageIcon size={32} /></div>
                  )}
                  
                  {isBundle ? (
                    <span className={styles.comboBadgePill} style={{ position: 'absolute', top: 10, left: 10, zIndex: 4 }}>
                      🎁 COMBO PACK
                    </span>
                  ) : product.badge ? (
                    <span className={styles.gridBadge}>{product.badge}</span>
                  ) : null}
                  {product.stock <= 0 && <span className={styles.gridAgotado}>AGOTADO</span>}

                  <div className={styles.gridCardOverlay}>
                    <button 
                      onClick={() => isBundle ? handleOpenComboModal(product) : handleOpenModal(product)} 
                      className={styles.gridOverlayBtn} 
                      title={isBundle ? "Editar Combo Pack" : "Editar"}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDuplicate(product)} className={styles.gridOverlayBtn} title="Duplicar">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className={`${styles.gridOverlayBtn} ${styles.btnDeleteIcon}`} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.gridCardBody}>
                  <div className={styles.gridCardCategoryRow}>
                    <span className={styles.categoryBadge}>{product.category}</span>
                    <span className={product.stock <= 0 ? styles.stockRed : styles.stockGreen}>
                      {product.stock} en stock
                    </span>
                  </div>
                  <h3 className={styles.gridCardTitle}>{product.name}</h3>

                  {itemVars.enabled && itemVars.variants?.length > 0 && (
                    <div style={{ marginTop: '2px', marginBottom: '4px' }}>
                      <span className={styles.variantBadge}>
                        ⚡ {itemVars.variants.length} Medidas ({itemVars.name})
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div className={styles.gridCardPriceRow}>
                      <span className={styles.priceMain}>{formatCLP(product.price)}</span>
                      {product.old_price > product.price && (
                        <span className={styles.priceOld}>{formatCLP(product.old_price)}</span>
                      )}
                    </div>
                    <span className={styles.skuTagInline}>{product.sku || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PAGINATION & COMPACT LIST CONTROLS */}
      {filteredProducts.length > 0 && (
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            <span>
              Mostrando <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> a <strong>{endIndex}</strong> de <strong>{totalItems}</strong> productos
            </span>
            <div className={styles.perPageSelectWrap}>
              <span>• Ver por página:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className={styles.perPageSelect}
              >
                <option value={8}>8 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
                <option value={50}>50 por pág.</option>
                <option value={99999}>Todos ({totalItems})</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationNav}>
              <button 
                type="button"
                className={styles.pageNavBtn}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              {getPageNumbers().map((pageNum, idx) => {
                if (pageNum === '...') {
                  return <span key={`dots-${idx}`} className={styles.pageBtnDots}>...</span>
                }
                const isCurrent = currentPage === pageNum
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    className={`${styles.pageBtn} ${isCurrent ? styles.pageBtnActive : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                    title={`Ir a página ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button 
                type="button"
                className={styles.pageNavBtn}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick "Cargar Más" shortcut button if not showing all and there are more pages */}
      {totalPages > 1 && currentPage < totalPages && itemsPerPage < 99999 && (
        <div className={styles.loadMoreWrap}>
          <button 
            type="button"
            className={styles.btnLoadMore}
            onClick={() => {
              setItemsPerPage(prev => prev + 10)
            }}
          >
            <Plus size={16} />
            <span>Cargar 10 productos más ({totalItems - endIndex} restantes)</span>
          </button>
        </div>
      )}

      {/* HELP MODAL: ¿CÓMO FUNCIONA EL BOTÓN IMPORTAR? */}
      {showImportHelp && (
        <div className={styles.modalOverlay} onClick={() => setShowImportHelp(false)}>
          <div className={styles.helpModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} style={{ color: '#ff2a3d' }} />
                <h3 className={styles.modalTitle}>¿Cómo funciona el botón Importar?</h3>
              </div>
              <button className={styles.closeModal} onClick={() => setShowImportHelp(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.helpModalContent}>
              <p>
                El botón <strong>Importar</strong> te permite cargar catálogos completos en segundos desde un archivo <strong>.CSV</strong> (Excel) o <strong>.JSON</strong> sin tener que ingresar producto por producto.
              </p>

              <div className={styles.helpSection}>
                <h4>Formatos Soportados</h4>
                <ul>
                  <li><strong>Archivos .JSON:</strong> Array de objetos con las propiedades del producto.</li>
                  <li><strong>Archivos .CSV:</strong> Tabla separada por comas con cabecera en la primera fila.</li>
                </ul>
              </div>

              <div className={styles.helpSection}>
                <h4>Columnas recomendadas para tu archivo:</h4>
                <div className={styles.codeBox}>
                  <code>name, price, stock, category, sku, description, image_url</code>
                </div>
              </div>

              <div className={styles.helpSection}>
                <h4>Características inteligentes de HONE CATALOG:</h4>
                <ul>
                  <li>Si no incluyes el <strong>SKU</strong>, el sistema lo <strong>autogenerará de forma aleatoria y única</strong>.</li>
                  <li>Antes de guardar, verás una <strong>pantalla de previsualización</strong> con todos los datos detectados.</li>
                  <li>Al hacer clic en <em>&quot;Confirmar e Importar Todos&quot;</em>, se sincronizarán inmediatamente con la tienda web.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setShowImportHelp(false)} className={styles.btnAdd}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOPHISTICATED PRODUCT MODAL (WP STYLE DETAIL VIEW) */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalSub}>HONE CATALOG Pro Engine</span>
                <h2 className={styles.modalTitle}>{editingId ? 'Editar Ficha de Producto' : 'Crear Nuevo Producto'}</h2>
              </div>
              <button className={styles.closeModal} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className={styles.modalTabs}>
              <button 
                type="button"
                className={`${styles.modalTab} ${activeTabModal === 'general' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('general')}
              >
                <FileText size={15} />
                <span>1. Datos Básicos & SKU</span>
              </button>
              <button 
                type="button"
                className={`${styles.modalTab} ${activeTabModal === 'pricing' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('pricing')}
              >
                <Tag size={15} />
                <span>2. Precio & Inventario</span>
              </button>
              <button 
                type="button"
                className={`${styles.modalTab} ${activeTabModal === 'gallery' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('gallery')}
              >
                <ImageIcon size={15} />
                <span>3. Galería ({formData.images?.length || 0})</span>
              </button>
              <button 
                type="button"
                className={`${styles.modalTab} ${activeTabModal === 'variants' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('variants')}
                style={{ position: 'relative' }}
              >
                <SlidersHorizontal size={15} />
                <span>4. Variantes & Medidas {variantConfig.enabled && variantConfig.variants?.length > 0 ? `(${variantConfig.variants.length})` : '(Opcional)'}</span>
                {variantConfig.enabled && variantConfig.variants?.length > 0 && (
                  <span style={{ width: '7px', height: '7px', background: '#ff2a3d', borderRadius: '50%', display: 'inline-block', marginLeft: '6px' }}></span>
                )}
              </button>
              <button 
                type="button"
                className={`${styles.modalTab} ${activeTabModal === 'specs' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('specs')}
              >
                <Box size={15} />
                <span>5. Ficha Técnica</span>
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className={styles.modalForm}>
              {/* TAB 1: GENERAL */}
              {activeTabModal === 'general' && (
                <div className={styles.tabContent}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 2 }}>
                      <label>Nombre del Producto *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej: Cartuchos RM Cartridge Por Unidad Variedad Medidas RM Tatuajes"
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>
                    
                    {/* SKU Generator Feature */}
                    <div className={styles.formGroup} style={{ flex: 1.5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Código SKU Único</label>
                        <button 
                          type="button" 
                          onClick={handleGenerateModalSku} 
                          className={styles.btnGenSkuAction}
                          title="Generar SKU Único Aleatorio"
                        >
                          <Dice5 size={13} />
                          <span>Generar Aleatorio</span>
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          type="text" 
                          required
                          placeholder="INK-AGU-4910A"
                          value={formData.sku} 
                          onChange={e => setFormData({ ...formData, sku: e.target.value })} 
                          className={styles.input} 
                        />
                        <button 
                          type="button" 
                          onClick={() => handleCopySku(formData.sku)} 
                          className={styles.copySkuBtnModal}
                          title="Copiar SKU"
                        >
                          <Clipboard size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Categoría del Producto *</label>
                      <select 
                        value={isCustomCategory ? '__custom__' : (formCategories.includes(formData.category) ? formData.category : '__custom__')}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true)
                          } else {
                            setIsCustomCategory(false)
                            setFormData({ ...formData, category: e.target.value })
                          }
                        }}
                        className={styles.modalSelect}
                      >
                        {formCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="__custom__">➕ Otra Categoría (Escribir personalizada)...</option>
                      </select>

                      {isCustomCategory && (
                        <div style={{ marginTop: '8px' }}>
                          <input 
                            type="text" 
                            required
                            placeholder="Escribe el nombre de la categoría (Ej: Guantes de Nitrilo)"
                            value={formData.category} 
                            onChange={e => setFormData({ ...formData, category: e.target.value })} 
                            className={styles.input} 
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Quick Category Chips */}
                      <div className={styles.categoryQuickChips}>
                        <span style={{ fontSize: '0.72rem', color: '#8e8e9f', marginRight: '2px' }}>Rápido:</span>
                        {['Agujas', 'Tintas', 'Cuidado', 'Máquinas', 'Fuentes & Pedales', 'Grips & Punteras', 'Kits', 'Diseños'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`${styles.categoryChipBtn} ${formData.category === cat && !isCustomCategory ? styles.categoryChipBtnActive : ''}`}
                            onClick={() => {
                              setIsCustomCategory(false)
                              setFormData(prev => ({ ...prev, category: cat }))
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Etiqueta / Badge Promocional (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ej: NUEVO, OFERTA, EXCLUSIVO"
                        value={formData.badge} 
                        onChange={e => setFormData({ ...formData, badge: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Descripción Completa del Producto</label>
                    <textarea 
                      rows="4" 
                      placeholder="Describe los beneficios, características técnicas, medidas o recomendaciones para tatuadores..."
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      className={styles.textarea} 
                    />
                  </div>

                  <div className={styles.formRowCheckboxes}>
                    <div className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        id="modal-active"
                        checked={formData.is_active} 
                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                      />
                      <label htmlFor="modal-active">Publicado y visible en la tienda web</label>
                    </div>

                    <div className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        id="modal-featured"
                        checked={formData.is_featured} 
                        onChange={e => setFormData({ ...formData, is_featured: e.target.checked })} 
                      />
                      <label htmlFor="modal-featured">Destacar en la Página de Inicio</label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & INVENTORY */}
              {activeTabModal === 'pricing' && (
                <div className={styles.tabContent}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Precio Normal (CLP) *</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="1290"
                        value={formData.price} 
                        onChange={e => handlePriceChange(e.target.value, formData.old_price)} 
                        className={styles.input} 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Precio Anterior / Tachado (Opcional)</label>
                      <input 
                        type="number" 
                        placeholder="1890"
                        value={formData.old_price} 
                        onChange={e => handlePriceChange(formData.price, e.target.value)} 
                        className={styles.input} 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Descuento Calculado</label>
                      <div className={styles.discountBadgeDisplay}>
                        {formData.discount > 0 ? `${formData.discount}% de Descuento` : 'Sin descuento'}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Quick Chips for 1-Click Discounts */}
                  <div className={styles.pricingQuickChips}>
                    <span style={{ fontSize: '0.74rem', color: '#8e8e9f' }}>Descuento rápido:</span>
                    {[
                      { label: '5% OFF', val: 5 },
                      { label: '10% OFF', val: 10 },
                      { label: '15% OFF', val: 15 },
                      { label: '20% OFF', val: 20 },
                      { label: '30% OFF', val: 30 },
                      { label: '50% OFF', val: 50 },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        className={styles.pricingChipBtn}
                        onClick={() => {
                          const baseP = parseFloat(formData.old_price || formData.price) || 0
                          if (baseP > 0) {
                            const newP = Math.round(baseP * (1 - d.val / 100))
                            setFormData(prev => ({
                              ...prev,
                              old_price: prev.old_price ? prev.old_price : prev.price,
                              price: newP,
                              discount: d.val
                            }))
                          }
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.pricingChipBtn}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          price: prev.old_price || prev.price,
                          old_price: '',
                          discount: 0
                        }))
                      }}
                    >
                      Sin Descuento
                    </button>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        Stock disponible
                        {variantConfig.enabled && variantConfig.variants?.length > 0 && (
                          <span style={{ color: '#4ade80', fontSize: '0.8rem', marginLeft: '6px' }}>
                            (Suma de variantes: {calculateTotalVariantStock(variantConfig.variants)} un.)
                          </span>
                        )}
                      </label>
                      <input 
                        type="number" 
                        required 
                        placeholder="51"
                        value={formData.stock} 
                        onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GALLERY & MULTI-IMAGE */}
              {activeTabModal === 'gallery' && (
                <div className={styles.tabContent}>
                  <div className={styles.galleryUploadArea}>
                    <div className={styles.galleryUploadHeader}>
                      <div>
                        <h4>Galería Multimedia del Producto (Fotos & Videos)</h4>
                        <p>Sube fotos o videos MP4/WEBM. Los videos se reproducirán automáticamente en bucle silenciado.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className={styles.btnSecondary}
                        disabled={uploading}
                      >
                        <UploadCloud size={16} />
                        <span>{uploading ? 'Subiendo...' : 'Añadir Fotos / Videos'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        accept="image/*,video/*" 
                        onChange={handleMultipleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                    </div>

                    {uploading && (
                      <div className={styles.progressBarWrapper}>
                        <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}

                    <div className={styles.galleryGrid}>
                      {(formData.images || []).length === 0 ? (
                        <div className={styles.emptyGallery}>
                          <ImageIcon size={36} />
                          <p>Aún no has subido fotos para este producto.</p>
                        </div>
                      ) : (
                        formData.images.map((url, idx) => {
                          const isPrimary = formData.image_url === url || (!formData.image_url && idx === 0)
                          const isVideo = isVideoUrl(url)
                          return (
                            <div key={idx} className={`${styles.galleryItem} ${isPrimary ? styles.galleryItemPrimary : ''}`}>
                              {isVideo ? (
                                <video src={url} autoPlay muted loop playsInline className={styles.galleryImg} />
                              ) : (
                                <img src={url} alt="gallery" className={styles.galleryImg} />
                              )}
                              {isPrimary && <span className={styles.primaryBadge}>Principal</span>}
                              {isVideo && (
                                <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', zIndex: 3 }}>
                                  VIDEO
                                </span>
                              )}
                              
                              <div className={styles.galleryActions}>
                                {!isPrimary && (
                                  <button 
                                    type="button" 
                                    onClick={() => setAsPrimaryImage(url)} 
                                    className={styles.btnSetPrimary}
                                    title="Marcar como foto de portada"
                                  >
                                    Hacer Portada
                                  </button>
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => removeGalleryImage(url)} 
                                  className={styles.btnRemoveImg}
                                  title="Eliminar foto"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: VARIANTES & SUBCATEGORÍAS (HONE PRO) */}
              {activeTabModal === 'variants' && (
                <div className={styles.tabContent}>
                  <div className={styles.variantSection}>
                    
                    {/* Switch principal para activar variantes */}
                    <div className={styles.variantToggleCard}>
                      <div className={styles.variantToggleInfo}>
                        <div className={styles.variantToggleIcon}>
                          <SlidersHorizontal size={22} />
                        </div>
                        <div>
                          <h4 className={styles.variantToggleTitle}>Habilitar Variantes / Subcategorías de Producto</h4>
                          <p className={styles.variantToggleDesc}>
                            Permite a los clientes seleccionar calibre de agujas, medidas, tallas o colores antes de agregar al carrito.
                          </p>
                        </div>
                      </div>
                      <label className={styles.switchToggle}>
                        <input 
                          type="checkbox" 
                          checked={variantConfig.enabled}
                          onChange={(e) => handleToggleVariantFeature(e.target.checked)}
                        />
                        <span className={styles.switchSlider}></span>
                      </label>
                    </div>

                    {variantConfig.enabled && (
                      <div className={styles.variantPanel}>
                        {/* Card 1: Nombre de la Variedad / Subcategoría */}
                        <div className={styles.variantCard}>
                          <div className={styles.variantCardHeader}>
                            <span className={styles.variantCardTitle}>
                              <Tag size={16} color="#ff2a3d" />
                              1. ¿De qué se trata la variedad o subcategoría? *
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#8e8e9f' }}>
                              Aparecerá en la tienda como título sobre los botones de selección
                            </span>
                          </div>

                          <input 
                            type="text"
                            required
                            placeholder="Ej: Calibre de las agujas, Medidas, Talla, Color..."
                            value={variantConfig.name}
                            onChange={(e) => setVariantConfig({ ...variantConfig, name: e.target.value })}
                            className={styles.input}
                          />

                          {/* Sugerencias rápidas con 1 clic */}
                          <div className={styles.variantChipsRow}>
                            <span style={{ fontSize: '0.75rem', color: '#8e8e9f', marginRight: '4px' }}>Sugerencias rápidas:</span>
                            <button 
                              type="button" 
                              onClick={() => setVariantConfig({ ...variantConfig, name: 'Calibre de las agujas' })}
                              className={styles.variantChipBtn}
                            >
                              💉 Calibre de las agujas
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setVariantConfig({ ...variantConfig, name: 'Medidas de Cartuchos' })}
                              className={styles.variantChipBtn}
                            >
                              📐 Medidas de Cartuchos
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setVariantConfig({ ...variantConfig, name: 'Talla' })}
                              className={styles.variantChipBtn}
                            >
                              👕 Talla
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setVariantConfig({ ...variantConfig, name: 'Color / Tono' })}
                              className={styles.variantChipBtn}
                            >
                              🎨 Color
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setVariantConfig({ ...variantConfig, name: 'Presentación / ml' })}
                              className={styles.variantChipBtn}
                            >
                              🧪 Presentación
                            </button>
                          </div>
                        </div>

                        {/* Card 2: Generador Rápido en Lote (Fast Bulk Creator) */}
                        <div className={styles.variantCard}>
                          <div className={styles.variantCardHeader}>
                            <span className={styles.variantCardTitle}>
                              <Wand2 size={16} color="#ff8591" />
                              2. Creador Rápido en Lote (Medidas & Variedades)
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#4ade80' }}>
                              ¡Añade múltiples calibres al instante!
                            </span>
                          </div>

                          <div className={styles.variantBulkBox}>
                            <div className={styles.variantBulkRow}>
                              <input 
                                type="text"
                                placeholder="Escribe o pega medidas separadas por coma: 1207, 1205, 1209, 1215, 1211..."
                                value={bulkVariantsText}
                                onChange={(e) => setBulkVariantsText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleGenerateBulkVariants()
                                  }
                                }}
                                className={styles.input}
                              />
                              <button 
                                type="button" 
                                onClick={() => handleGenerateBulkVariants()}
                                className={styles.btnAdd}
                                style={{ whiteSpace: 'nowrap' }}
                              >
                                <Zap size={14} />
                                <span>Generar</span>
                              </button>
                            </div>

                            <div className={styles.variantPresetsRow}>
                              <span>Plantillas de agujas rápidas:</span>
                              <button 
                                type="button" 
                                onClick={() => applyNeedlePreset('RM')}
                                className={styles.variantPresetBtn}
                                title="Cargar calibres RM (1207, 1205, 1209, 1215, 1211, 1213, 1243, 1219, 1027)"
                              >
                                + Agujas RM
                              </button>
                              <button 
                                type="button" 
                                onClick={() => applyNeedlePreset('MC')}
                                className={styles.variantPresetBtn}
                                title="Cargar medidas Magnum Curva MC (1007MC, 1009MC, 1011MC, 1013MC, 1015MC)"
                              >
                                + Agujas MC
                              </button>
                              <button 
                                type="button" 
                                onClick={() => applyNeedlePreset('RL')}
                                className={styles.variantPresetBtn}
                                title="Cargar calibres Round Liner (1003RL, 1005RL, 1007RL, 1009RL, 1203RL...)"
                              >
                                + Agujas RL
                              </button>
                              <button 
                                type="button" 
                                onClick={() => applyNeedlePreset('RS')}
                                className={styles.variantPresetBtn}
                                title="Cargar calibres Round Shader (1205RS, 1207RS, 1209RS, 1211RS...)"
                              >
                                + Agujas RS
                              </button>
                              <button 
                                type="button" 
                                onClick={() => applyNeedlePreset('TALLAS')}
                                className={styles.variantPresetBtn}
                                title="Cargar tallas S, M, L, XL, XXL"
                              >
                                + Tallas Ropa
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Tabla de Variantes Configuradas */}
                        <div className={styles.variantCard}>
                          <div className={styles.variantCardHeader}>
                            <span className={styles.variantCardTitle}>
                              <ListPlus size={16} color="#ff2a3d" />
                              3. Lista de Medidas / Variantes ({variantConfig.variants?.length || 0})
                            </span>
                            <button 
                              type="button" 
                              onClick={handleAddVariant} 
                              className={styles.btnSecondary}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Plus size={14} /> Añadir Manual
                            </button>
                          </div>

                          {/* Summary & Sync Bar */}
                          {variantConfig.variants?.length > 0 && (
                            <div className={styles.variantSummaryBar}>
                              <span>
                                <strong>{variantConfig.variants.length}</strong> medidas registradas • Stock acumulado:{' '}
                                <strong>{calculateTotalVariantStock(variantConfig.variants)}</strong> unidades
                              </span>
                              <button 
                                type="button" 
                                onClick={handleSyncStockFromVariants}
                                className={styles.btnVariantSync}
                                title="Copiar la suma de stock de las variantes al stock principal del producto"
                              >
                                <RefreshCw size={12} /> Sincronizar Stock Base
                              </button>
                            </div>
                          )}

                          {(!variantConfig.variants || variantConfig.variants.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8e8e9f' }}>
                              <Package size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                              <p>Aún no has agregado medidas o variantes para este producto.</p>
                              <p style={{ fontSize: '0.8rem', color: '#636366' }}>
                                Usa el creador rápido de arriba o haz clic en &quot;Añadir Manual&quot;.
                              </p>
                            </div>
                          ) : (
                            <div className={styles.tableResponsive} style={{ background: 'rgba(0,0,0,0.3)' }}>
                              <table className={styles.variantItemsTable}>
                                <thead>
                                  <tr>
                                    <th style={{ width: '130px' }}>Medida / Opción *</th>
                                    <th style={{ width: '160px' }}>SKU de Variante</th>
                                    <th style={{ width: '100px' }}>Stock</th>
                                    <th style={{ width: '130px' }}>Precio (CLP)</th>
                                    <th style={{ width: '90px' }}>Estado</th>
                                    <th style={{ width: '50px', textAlign: 'center' }}>Quitar</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {variantConfig.variants.map((v, idx) => {
                                    const vStock = parseInt(v.stock) || 0
                                    return (
                                      <tr key={v.id || idx}>
                                        <td>
                                          <input 
                                            type="text" 
                                            required
                                            placeholder="Ej: 1207 o 1007MC"
                                            value={v.name}
                                            onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                                            className={styles.inlineInput}
                                            style={{ fontWeight: 600, color: '#ff8591' }}
                                          />
                                        </td>
                                        <td>
                                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <input 
                                              type="text" 
                                              placeholder="1207RM"
                                              value={v.sku}
                                              onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                                              className={styles.inlineInput}
                                              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                            />
                                            <button 
                                              type="button" 
                                              onClick={() => handleRegenerateVariantSku(idx)}
                                              className={styles.btnGenIcon}
                                              style={{ width: '28px', height: '28px' }}
                                              title="Generar código de SKU para esta medida"
                                            >
                                              <Dice5 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                        <td>
                                          <input 
                                            type="number" 
                                            min="0"
                                            value={v.stock !== undefined ? v.stock : 0}
                                            onChange={(e) => handleUpdateVariant(idx, 'stock', parseInt(e.target.value) || 0)}
                                            className={styles.inlineInput}
                                          />
                                        </td>
                                        <td>
                                          <input 
                                            type="number" 
                                            placeholder={`Hereda ($${formData.price || 0})`}
                                            value={v.price || ''}
                                            onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                                            className={styles.inlineInput}
                                          />
                                        </td>
                                        <td>
                                          {vStock > 0 ? (
                                            <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>
                                              ● {vStock} un.
                                            </span>
                                          ) : (
                                            <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>
                                              ✕ Agotado
                                            </span>
                                          )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <button 
                                            type="button" 
                                            onClick={() => handleRemoveVariant(idx)}
                                            className={styles.btnActionIcon}
                                            title="Eliminar esta medida"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: SPECIFICATIONS */}
              {activeTabModal === 'specs' && (
                <div className={styles.tabContent}>
                  <div className={styles.specsHeader}>
                    <div>
                      <h4>Ficha Técnica / Atributos Dinámicos</h4>
                      <p>Añade especificaciones como Dimensiones, Ingredientes, Materiales, Esterilización, etc.</p>
                    </div>
                    <button type="button" onClick={addSpecRow} className={styles.btnSecondary}>
                      <Plus size={14} /> Añadir Atributo
                    </button>
                  </div>

                  <div className={styles.specsList}>
                    {specList.map((spec, index) => (
                      <div key={index} className={styles.specRow}>
                        <input 
                          type="text" 
                          placeholder="Propiedad (ej: Material, Esterilización, Contenido)"
                          value={spec.key} 
                          onChange={(e) => handleSpecChange(index, 'key', e.target.value)} 
                          className={styles.input} 
                          style={{ flex: 1 }}
                        />
                        <input 
                          type="text" 
                          placeholder="Valor (ej: Acero Quirúrgico 316L, Gas EO, 10 un.)"
                          value={spec.value} 
                          onChange={(e) => handleSpecChange(index, 'value', e.target.value)} 
                          className={styles.input} 
                          style={{ flex: 2 }}
                        />
                        <button type="button" onClick={() => removeSpecRow(index)} className={styles.btnActionIcon}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnAdd} disabled={uploading}>
                  {editingId ? 'Guardar Cambios en Catálogo' : 'Crear y Publicar en Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMBO & PROMOTIONS BUILDER MODAL (HONE BUNDLE ENGINE)     */}
      {/* ========================================================= */}
      {comboModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setComboModalOpen(false)}>
          <div className={styles.comboModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.comboModalHeader}>
              <div>
                <span className={styles.comboModalSub}>HONE BUNDLE & PROMOTIONS ENGINE</span>
                <h2 className={styles.comboModalTitle}>
                  {editingComboId ? 'Editar Pack Promocional / Combo' : 'Crear Nueva Promoción o Pack Combo'}
                </h2>
              </div>
              <button className={styles.closeModal} onClick={() => setComboModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCombo} className={styles.modalForm} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className={styles.comboModalBody}>
                {/* Left Column: Product Selector & Tray */}
                <div className={styles.comboPickerCol}>
                  <div className={styles.comboColTitle}>
                    <ShoppingBag size={18} color="#f59e0b" />
                    <span>1. Selecciona los productos incluidos en el pack</span>
                  </div>

                  {/* Search & Category Filter */}
                  <div className={styles.comboPickerSearchWrap}>
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o SKU..."
                      value={comboSearch}
                      onChange={(e) => setComboSearch(e.target.value)}
                      className={styles.comboPickerSearch}
                    />
                    <select
                      value={comboCategoryFilter}
                      onChange={(e) => setComboCategoryFilter(e.target.value)}
                      className={styles.select}
                      style={{ maxWidth: '160px' }}
                    >
                      <option value="all">Todas las Categorías</option>
                      {categories.filter(c => c !== 'all' && c !== 'Promociones & Combos').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Products Picker List */}
                  <div className={styles.comboPickerList}>
                    {products
                      .filter(p => {
                        // Don't show combos in their own picker list
                        if (editingComboId && p.id === editingComboId) return false
                        const matchCat = comboCategoryFilter === 'all' || p.category === comboCategoryFilter
                        const matchSearch = (p.name || '').toLowerCase().includes(comboSearch.toLowerCase()) || 
                                            (p.sku || '').toLowerCase().includes(comboSearch.toLowerCase())
                        return matchCat && matchSearch
                      })
                      .map(p => {
                        const isSelected = selectedComboItems.some(item => item.productId === p.id)
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => handleToggleProductInCombo(p)}
                            className={`${styles.comboProductItem} ${isSelected ? styles.comboProductItemSelected : ''}`}
                          >
                            <div className={styles.comboProductInfo}>
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className={styles.comboProductThumb} />
                              ) : (
                                <div className={styles.comboProductThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon size={16} color="#636366" />
                                </div>
                              )}
                              <div className={styles.comboProductText}>
                                <span className={styles.comboProductName}>{p.name}</span>
                                <div className={styles.comboProductMeta}>
                                  <span>{p.category}</span>
                                  <span>• SKU: {p.sku || 'N/A'}</span>
                                  <span>• Stock: {p.stock || 0} un.</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={styles.comboProductPrice}>{formatCLP(p.price)}</span>
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => {}} 
                                style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* Tray: Selected Items with Quantity Stepper */}
                  <div className={styles.comboSelectedTray}>
                    <div className={styles.comboSelectedHeader}>
                      <span>Artículos en el pack ({selectedComboItems.length})</span>
                      <span style={{ color: '#fff' }}>Total Normal: {formatCLP(comboTotalOrig)}</span>
                    </div>

                    {selectedComboItems.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#8e8e9f', textAlign: 'center', margin: '8px 0' }}>
                        Haz clic en los productos de arriba para agregarlos a este pack promocional.
                      </p>
                    ) : (
                      <div className={styles.comboSelectedList}>
                        {selectedComboItems.map((item) => (
                          <div key={item.productId} className={styles.comboSelectedRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              {item.image_url && <img src={item.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />}
                              <span style={{ fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className={styles.comboStepper}>
                                <button 
                                  type="button" 
                                  onClick={() => handleUpdateComboItemQty(item.productId, -1)}
                                  className={styles.comboStepBtn}
                                  title="Restar cantidad"
                                >
                                  -
                                </button>
                                <span className={styles.comboStepQty}>{item.quantity || 1}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleUpdateComboItemQty(item.productId, 1)}
                                  className={styles.comboStepBtn}
                                  title="Sumar cantidad"
                                >
                                  +
                                </button>
                              </div>

                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4ade80' }}>
                                {formatCLP((item.price || 0) * (item.quantity || 1))}
                              </span>

                              <button 
                                type="button" 
                                onClick={() => handleRemoveComboItem(item.productId)}
                                className={styles.btnActionIcon}
                                style={{ padding: '2px' }}
                                title="Quitar del pack"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Pricing, Name & Publish */}
                <div className={styles.comboFormCol}>
                  <div className={styles.comboColTitle}>
                    <Flame size={18} color="#ff2a3d" />
                    <span>2. Precios Especiales & Publicación</span>
                  </div>

                  {/* Pricing Card */}
                  <div className={styles.comboPricingCard}>
                    <div className={styles.comboPricingHeader}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Modo de Precio Promocional:</span>
                      <div className={styles.comboModeToggle}>
                        <button 
                          type="button"
                          className={`${styles.comboModeBtn} ${comboPricingMode === 'fixed' ? styles.comboModeBtnActive : ''}`}
                          onClick={() => setComboPricingMode('fixed')}
                        >
                          Precio Fijo
                        </button>
                        <button 
                          type="button"
                          className={`${styles.comboModeBtn} ${comboPricingMode === 'percent' ? styles.comboModeBtnActive : ''}`}
                          onClick={() => setComboPricingMode('percent')}
                        >
                          % Descuento
                        </button>
                      </div>
                    </div>

                    {comboPricingMode === 'fixed' ? (
                      <div className={styles.formGroup}>
                        <label style={{ color: '#fff', fontSize: '0.82rem' }}>Precio Especial del Combo (CLP) *</label>
                        <input 
                          type="number"
                          required
                          placeholder={comboTotalOrig > 0 ? String(Math.round(comboTotalOrig * 0.8)) : '19990'}
                          value={comboPrice}
                          onChange={(e) => setComboPrice(e.target.value)}
                          className={styles.input}
                          style={{ borderColor: '#f59e0b', fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}
                        />
                      </div>
                    ) : (
                      <div className={styles.formGroup}>
                        <label style={{ color: '#fff', fontSize: '0.82rem' }}>Porcentaje de Descuento (%) *</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="range"
                            min="5"
                            max="90"
                            step="5"
                            value={comboDiscountPercent}
                            onChange={(e) => setComboDiscountPercent(Number(e.target.value))}
                            style={{ flex: 1, accentColor: '#f59e0b' }}
                          />
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', minWidth: '48px' }}>
                            {comboDiscountPercent}% OFF
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Live Savings Calculation */}
                    <div className={styles.comboSavingsBreakdown}>
                      <div className={styles.comboSavingsRow}>
                        <span>Valor normal individual:</span>
                        <span style={{ textDecoration: comboSavings > 0 ? 'line-through' : 'none' }}>{formatCLP(comboTotalOrig)}</span>
                      </div>
                      <div className={styles.comboSavingsRow}>
                        <span>Precio Final Combo:</span>
                        <strong style={{ color: '#4ade80', fontSize: '0.95rem' }}>{formatCLP(finalComboPrice)}</strong>
                      </div>
                      {comboSavings > 0 && (
                        <div className={styles.comboSavingsHighlight}>
                          <span>💰 ¡Ahorro total para el cliente!</span>
                          <span>{formatCLP(comboSavings)} ({finalComboDiscount}% OFF)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Combo Form Information */}
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Nombre del Pack / Combo *</label>
                      <button 
                        type="button" 
                        onClick={handleGenerateComboName}
                        className={styles.btnGenSkuAction}
                        title="Generar nombre a partir de los productos seleccionados"
                      >
                        <Sparkles size={13} />
                        <span>Sugerir Nombre</span>
                      </button>
                    </div>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: Pack Máquina Rotativa + Fuente + 20 Cartuchos RM"
                      value={comboFormData.name}
                      onChange={(e) => setComboFormData({ ...comboFormData, name: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 1.2 }}>
                      <label>Código SKU de Promoción</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input 
                          type="text"
                          required
                          value={comboFormData.sku}
                          onChange={(e) => setComboFormData({ ...comboFormData, sku: e.target.value })}
                          className={styles.input}
                        />
                        <button 
                          type="button" 
                          onClick={() => setComboFormData(prev => ({ ...prev, sku: generateUniqueSKU('Combos') }))}
                          className={styles.btnGenSkuAction}
                          title="Generar SKU único"
                        >
                          <Dice5 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>
                        Stock Disponible
                        <span style={{ color: '#f59e0b', fontSize: '0.72rem', display: 'block' }}>
                          (Mínimo según items: {recommendedComboStock} un.)
                        </span>
                      </label>
                      <input 
                        type="number"
                        placeholder={String(recommendedComboStock)}
                        value={comboStock}
                        onChange={(e) => setComboStock(e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Badge o Etiqueta Visual</label>
                      <input 
                        type="text"
                        placeholder="COMBO PACK"
                        value={comboFormData.badge}
                        onChange={(e) => setComboFormData({ ...comboFormData, badge: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Foto de Portada (Opcional URL)</label>
                      <input 
                        type="text"
                        placeholder="Hereda automáticamente de los productos"
                        value={comboFormData.image_url}
                        onChange={(e) => setComboFormData({ ...comboFormData, image_url: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Descripción & Detalle del Pack</label>
                      <button 
                        type="button" 
                        onClick={handleGenerateComboDescription}
                        className={styles.btnGenSkuAction}
                        title="Generar resumen con lista de productos y ahorros"
                      >
                        <FileText size={13} />
                        <span>Generar Resumen</span>
                      </button>
                    </div>
                    <textarea 
                      rows="3"
                      placeholder="Explica qué incluye la oferta, ahorro y ventajas..."
                      value={comboFormData.description}
                      onChange={(e) => setComboFormData({ ...comboFormData, description: e.target.value })}
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formRowCheckboxes}>
                    <div className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        id="combo-active"
                        checked={comboFormData.is_active} 
                        onChange={e => setComboFormData({ ...comboFormData, is_active: e.target.checked })} 
                      />
                      <label htmlFor="combo-active">Visible en tienda online</label>
                    </div>

                    <div className={styles.checkboxItem}>
                      <input 
                        type="checkbox" 
                        id="combo-featured"
                        checked={comboFormData.is_featured} 
                        onChange={e => setComboFormData({ ...comboFormData, is_featured: e.target.checked })} 
                      />
                      <label htmlFor="combo-featured">Destacar en Inicio (Ofertas)</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combo Modal Footer */}
              <div className={styles.modalFooter} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#121219' }}>
                <button type="button" onClick={() => setComboModalOpen(false)} className={styles.btnSecondary}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnComboAdd} style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                  <Gift size={18} />
                  <span>{editingComboId ? 'Guardar Cambios del Combo' : 'Crear y Publicar Combo Pack'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
