'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Edit2, Trash2, X, Image as ImageIcon, Search, 
  Layers, UploadCloud, Download, Check, AlertTriangle, 
  Eye, RefreshCw, Sliders, ChevronDown, CheckSquare, 
  Square, Copy, Sparkles, Zap, Package, ArrowUpDown, Filter
} from 'lucide-react'
import styles from './productos.module.css'

export default function HoneCatalogPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid' | 'bulk'
  
  // Filtering, Searching & Sorting
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'instock' | 'lowstock' | 'outofstock'
  const [sortBy, setSortBy] = useState('created_at_desc')
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')

  // Toast notifications
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Modals & Editors
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeTabModal, setActiveTabModal] = useState('general') // 'general' | 'pricing' | 'gallery' | 'specs'
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
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
    category: 'Cuidado',
    image_url: '',
    images: [],
    badge: '',
    is_active: true,
    is_featured: false
  })

  // Specs Key-Value Builder
  const [specList, setSpecList] = useState([{ key: '', value: '' }])

  // Bulk Upload state
  const [bulkFiles, setBulkFiles] = useState([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const fileInputRef = useRef(null)
  const bulkInputRef = useRef(null)

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

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

  // Categories extraction
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

  // Calculate Metrics
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length
  const totalInventoryValue = products.reduce((acc, p) => acc + (parseFloat(p.price || 0) * parseInt(p.stock || 0)), 0)

  const formatCLP = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)

  // Filtered & Sorted list
  const filteredProducts = products.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.category || '').toLowerCase().includes(search.toLowerCase())
    
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
    
    let matchStock = true
    if (stockFilter === 'instock') matchStock = (p.stock || 0) > 0
    if (stockFilter === 'lowstock') matchStock = (p.stock || 0) > 0 && (p.stock || 0) <= 5
    if (stockFilter === 'outofstock') matchStock = (p.stock || 0) <= 0

    return matchSearch && matchCategory && matchStock
  }).sort((a, b) => {
    if (sortBy === 'created_at_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    if (sortBy === 'created_at_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    if (sortBy === 'price_asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
    if (sortBy === 'price_desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
    if (sortBy === 'stock_desc') return (parseInt(b.stock) || 0) - (parseInt(a.stock) || 0)
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '')
    return 0
  })

  // Open Modal
  const handleOpenModal = (product = null) => {
    setActiveTabModal('general')
    if (product) {
      setEditingId(product.id)
      
      // Parse specifications
      let parsedSpecs = [{ key: '', value: '' }]
      if (product.specifications) {
        try {
          if (product.specifications.startsWith('{') || product.specifications.startsWith('[')) {
            const obj = JSON.parse(product.specifications)
            if (Array.isArray(obj)) parsedSpecs = obj
            else parsedSpecs = Object.entries(obj).map(([k, v]) => ({ key: k, value: v }))
          } else {
            // Split by lines or commas
            parsedSpecs = product.specifications.split('\n').map(line => {
              const [k, ...v] = line.split(':')
              return { key: k?.trim() || '', value: v.join(':')?.trim() || '' }
            }).filter(s => s.key || s.value)
          }
        } catch {
          parsedSpecs = [{ key: 'Detalles', value: product.specifications }]
        }
      }
      if (parsedSpecs.length === 0) parsedSpecs = [{ key: '', value: '' }]
      setSpecList(parsedSpecs)

      let galleryImages = []
      if (Array.isArray(product.images)) galleryImages = product.images
      else if (typeof product.images === 'string') {
        try { galleryImages = JSON.parse(product.images) } catch { galleryImages = [] }
      }
      if (product.image_url && !galleryImages.includes(product.image_url)) {
        galleryImages = [product.image_url, ...galleryImages]
      }

      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        specifications: product.specifications || '',
        price: product.price || '',
        old_price: product.old_price || '',
        discount: product.discount || 0,
        stock: product.stock !== undefined ? product.stock : 0,
        category: product.category || 'Cuidado',
        image_url: product.image_url || '',
        images: galleryImages,
        badge: product.badge || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_featured: !!product.is_featured
      })
    } else {
      setEditingId(null)
      setSpecList([{ key: '', value: '' }])
      setFormData({
        name: '',
        sku: `INK-${Math.floor(1000 + Math.random() * 9000)}`,
        description: '',
        specifications: '',
        price: '',
        old_price: '',
        discount: 0,
        stock: 10,
        category: 'Cuidado',
        image_url: '',
        images: [],
        badge: 'NUEVO',
        is_active: true,
        is_featured: false
      })
    }
    setModalOpen(true)
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
      showToast(`${uploadedUrls.length} imagen(es) subida(s) con éxito`)
    } else {
      showToast('Error al subir imágenes', 'error')
    }

    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const setAsPrimaryImage = (url) => {
    setFormData(prev => ({
      ...prev,
      image_url: url
    }))
    showToast('Imagen principal actualizada')
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

  // Save Detailed Product
  const handleSubmitProduct = async (e) => {
    e.preventDefault()

    // Format specifications as clean JSON or text
    const cleanSpecs = specList.filter(s => s.key.trim() && s.value.trim())
    const specsString = cleanSpecs.length > 0 
      ? JSON.stringify(cleanSpecs.reduce((acc, curr) => ({ ...acc, [curr.key.trim()]: curr.value.trim() }), {}))
      : (formData.specifications || '')

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku?.trim() || null,
      description: formData.description?.trim() || null,
      specifications: specsString || null,
      price: parseFloat(formData.price) || 0,
      old_price: formData.old_price ? parseFloat(formData.old_price) : null,
      discount: parseInt(formData.discount) || 0,
      stock: parseInt(formData.stock) || 0,
      category: formData.category || 'General',
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
        showToast('Producto actualizado exitosamente')
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload])
        
        if (error) throw error
        showToast('Producto creado exitosamente')
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
      sku: product.sku || '',
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
      showToast(nextState ? 'Producto publicado' : 'Producto ocultado')
    }
  }

  // Duplicate Product
  const handleDuplicate = async (product) => {
    try {
      const duplicatePayload = {
        name: `${product.name} (Copia)`,
        sku: `INK-${Math.floor(1000 + Math.random() * 9000)}`,
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
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
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
        showToast(`${selectedIds.length} productos activados`)
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
      }
      setSelectedIds([])
      setBulkAction('')
    } catch (err) {
      showToast('Error en acción por lote: ' + err.message, 'error')
    }
  }

  // Bulk Upload File Handler
  const handleBulkFilesSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const rows = files.map((file, idx) => {
      // Clean filename for title
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      const cleanTitle = baseName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      return {
        id: `temp-${idx}-${Date.now()}`,
        file,
        preview: URL.createObjectURL(file),
        name: cleanTitle,
        category: 'Cuidado',
        price: '15000',
        stock: '10',
        sku: `INK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending' // 'pending' | 'uploading' | 'done' | 'error'
      }
    })

    setBulkFiles(rows)
  }

  const updateBulkRow = (id, field, value) => {
    setBulkFiles(bulkFiles.map(row => row.id === id ? { ...row, [field]: value } : row))
  }

  const removeBulkRow = (id) => {
    setBulkFiles(bulkFiles.filter(row => row.id !== id))
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
          sku: row.sku || null,
          category: row.category || 'General',
          price: parseFloat(row.price) || 0,
          stock: parseInt(row.stock) || 0,
          image_url: publicUrl || null,
          images: publicUrl ? [publicUrl] : [],
          is_active: true,
          description: `Producto añadido mediante HONE CATALOG Carga Masiva.`,
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
    showToast(`¡Lote procesado! ${completedCount} productos creados`)
    fetchProducts()
    setTimeout(() => {
      setBulkFiles([])
      setViewMode('table')
    }, 1500)
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

      {/* Top Banner & Title */}
      <div className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.honeBrand}>HONE CATALOG</span>
            <span className={styles.versionBadge}>PRO v3.4 WP-SYNC</span>
          </div>
          <h1 className={styles.title}>Gestor de Catálogo e Inventario</h1>
          <p className={styles.subtitle}>
            Control masivo, subida múltiple de archivos, edición rápida y sincronización instantánea con la tienda web.
          </p>
        </div>

        <div className={styles.topActions}>
          <button onClick={handleExportJSON} className={styles.btnSecondary} title="Exportar Catálogo en JSON">
            <Download size={16} />
            <span>Exportar</span>
          </button>

          <button onClick={() => setViewMode(viewMode === 'bulk' ? 'table' : 'bulk')} className={`${styles.btnSecondary} ${viewMode === 'bulk' ? styles.btnActive : ''}`}>
            <UploadCloud size={16} />
            <span>Carga Masiva</span>
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
          <span className={styles.metricLabel}>Activos en Web</span>
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

      {/* BULK UPLOAD VIEW */}
      {viewMode === 'bulk' && (
        <div className={styles.bulkContainer}>
          <div className={styles.bulkHeader}>
            <div>
              <h3>Carga Masiva de Productos (Estilo WP)</h3>
              <p>Arrastra varias fotos a la vez. Cada imagen generará una fila editable para publicar tu catálogo en segundos.</p>
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
            <h4>Haz clic o arrastra tus archivos de imagen aquí</h4>
            <p>PNG, JPG, WEBP — Soporta subida múltiple simultánea</p>
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
                <span>{bulkFiles.length} productos listos para procesar</span>
                <button 
                  onClick={processBulkUpload} 
                  disabled={bulkUploading} 
                  className={styles.btnAdd}
                >
                  {bulkUploading ? <RefreshCw size={16} className={styles.spin} /> : <Zap size={16} />}
                  <span>{bulkUploading ? 'Subiendo y Publicando...' : 'Publicar Todo el Lote'}</span>
                </button>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Foto</th>
                      <th>Nombre del Producto</th>
                      <th>SKU</th>
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
                          <input 
                            type="text" 
                            value={row.sku} 
                            onChange={(e) => updateBulkRow(row.id, 'sku', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '110px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={row.category} 
                            onChange={(e) => updateBulkRow(row.id, 'category', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '130px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.price} 
                            onChange={(e) => updateBulkRow(row.id, 'price', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '110px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={row.stock} 
                            onChange={(e) => updateBulkRow(row.id, 'stock', e.target.value)} 
                            className={styles.inlineInput} 
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td>
                          {row.status === 'pending' && <span className={styles.tagPending}>Pendiente</span>}
                          {row.status === 'uploading' && <span className={styles.tagUploading}>Subiendo...</span>}
                          {row.status === 'done' && <span className={styles.tagDone}><Check size={12} /> Listo</span>}
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
            type="text" 
            placeholder="Buscar por nombre, SKU o categoría..." 
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
              <option value="created_at_desc">Más recientes primero</option>
              <option value="created_at_asc">Más antiguos</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="stock_desc">Mayor Stock</option>
              <option value="name_asc">Nombre A-Z</option>
            </select>
          </div>

          <div className={styles.viewModeToggle}>
            <button 
              onClick={() => setViewMode('table')} 
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              title="Vista Lista / Tabla WP"
            >
              <Layers size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              title="Vista Cuadrícula"
            >
              <ImageIcon size={16} />
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
          <p>Cargando catálogo inteligente...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={52} className={styles.emptyIcon} />
          <h3>No se encontraron productos</h3>
          <p>Prueba con otros términos de búsqueda o añade tu primer artículo con HONE CATALOG.</p>
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
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare size={18} className={styles.checkedIcon} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th style={{ width: '60px' }}>Img</th>
                <th>Nombre / SKU</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id)
                const isQuickEditing = quickEditId === product.id

                if (isQuickEditing) {
                  return (
                    <tr key={product.id} className={styles.quickEditRow}>
                      <td colSpan="8">
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
                              <input 
                                type="text" 
                                value={quickFormData.sku} 
                                onChange={e => setQuickFormData({ ...quickFormData, sku: e.target.value })} 
                                className={styles.input} 
                              />
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
                              <label htmlFor={`quick-active-${product.id}`}>Publicado en web</label>
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
                          <img src={product.image_url} alt={product.name} className={styles.productThumb} />
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
                        <span className={styles.productName}>{product.name}</span>
                        <div className={styles.skuTag}>
                          <span>SKU: {product.sku || 'N/A'}</span>
                          {product.badge && <span className={styles.badgePill}>{product.badge}</span>}
                        </div>
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
                      <div className={styles.stockCol}>
                        <span className={`
                          ${styles.stockIndicator} 
                          ${product.stock <= 0 ? styles.stockRed : product.stock <= 5 ? styles.stockYellow : styles.stockGreen}
                        `}>
                          {product.stock <= 0 ? 'Agotado' : `${product.stock} un.`}
                        </span>
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
                        <button onClick={() => handleOpenModal(product)} className={styles.btnActionIcon} title="Editor Completo">
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
        /* GRID VIEW */
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.gridCard}>
              <div className={styles.gridCardMedia}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className={styles.gridCardImg} />
                ) : (
                  <div className={styles.noImagePlaceholder}><ImageIcon size={32} /></div>
                )}
                
                {product.badge && <span className={styles.gridBadge}>{product.badge}</span>}
                {product.stock <= 0 && <span className={styles.gridAgotado}>AGOTADO</span>}

                <div className={styles.gridCardOverlay}>
                  <button onClick={() => handleOpenModal(product)} className={styles.gridOverlayBtn} title="Editar">
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
                    {product.stock} disponibles
                  </span>
                </div>
                <h3 className={styles.gridCardTitle}>{product.name}</h3>
                <div className={styles.gridCardPriceRow}>
                  <span className={styles.priceMain}>{formatCLP(product.price)}</span>
                  {product.old_price > product.price && (
                    <span className={styles.priceOld}>{formatCLP(product.old_price)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SOPHISTICATED PRODUCT MODAL (WP STYLE DETAIL VIEW) */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalSub}>HONE CATALOG Pro Editor</span>
                <h2 className={styles.modalTitle}>{editingId ? 'Editar Ficha de Producto' : 'Crear Nuevo Producto'}</h2>
              </div>
              <button className={styles.closeModal} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className={styles.modalTabs}>
              <button 
                className={`${styles.modalTab} ${activeTabModal === 'general' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('general')}
              >
                1. Datos Generales
              </button>
              <button 
                className={`${styles.modalTab} ${activeTabModal === 'pricing' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('pricing')}
              >
                2. Precio e Inventario
              </button>
              <button 
                className={`${styles.modalTab} ${activeTabModal === 'gallery' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('gallery')}
              >
                3. Galería Multimedia ({formData.images?.length || 0})
              </button>
              <button 
                className={`${styles.modalTab} ${activeTabModal === 'specs' ? styles.modalTabActive : ''}`}
                onClick={() => setActiveTabModal('specs')}
              >
                4. Especificaciones y Atributos
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
                        placeholder="Ej: Bálsamo Regenerador 100ml"
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>Código SKU / Referencia</label>
                      <input 
                        type="text" 
                        placeholder="INK-4029"
                        value={formData.sku} 
                        onChange={e => setFormData({ ...formData, sku: e.target.value })} 
                        className={styles.input} 
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Categoría</label>
                      <input 
                        type="text" 
                        list="categoriesList"
                        placeholder="Cuidado, Ropa, Arte, Accesorios..."
                        value={formData.category} 
                        onChange={e => setFormData({ ...formData, category: e.target.value })} 
                        className={styles.input} 
                      />
                      <datalist id="categoriesList">
                        {categories.filter(c => c !== 'all').map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Etiqueta / Badge Promocional</label>
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
                      placeholder="Describe los beneficios, ingredientes, modo de uso o detalles artísticos..."
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
                        placeholder="18000"
                        value={formData.price} 
                        onChange={e => handlePriceChange(e.target.value, formData.old_price)} 
                        className={styles.input} 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Precio Anterior / Tachado (Opcional)</label>
                      <input 
                        type="number" 
                        placeholder="22000"
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

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Stock Disponible en Bodega</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="15"
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
                        <h4>Galería de Imágenes del Producto</h4>
                        <p>Sube múltiples fotos. La foto con borde rojo es la miniatura principal en la tienda.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className={styles.btnSecondary}
                        disabled={uploading}
                      >
                        <UploadCloud size={16} />
                        <span>{uploading ? 'Subiendo...' : 'Añadir Fotos'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        accept="image/*" 
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
                          return (
                            <div key={idx} className={`${styles.galleryItem} ${isPrimary ? styles.galleryItemPrimary : ''}`}>
                              <img src={url} alt="gallery" className={styles.galleryImg} />
                              {isPrimary && <span className={styles.primaryBadge}>Principal</span>}
                              
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

              {/* TAB 4: SPECIFICATIONS */}
              {activeTabModal === 'specs' && (
                <div className={styles.tabContent}>
                  <div className={styles.specsHeader}>
                    <div>
                      <h4>Ficha Técnica / Atributos Dinámicos</h4>
                      <p>Añade especificaciones como Dimensiones, Ingredientes, Tallas, Materiales, etc.</p>
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
                          placeholder="Propiedad (ej: Material, Talla, Contenido)"
                          value={spec.key} 
                          onChange={(e) => handleSpecChange(index, 'key', e.target.value)} 
                          className={styles.input} 
                          style={{ flex: 1 }}
                        />
                        <input 
                          type="text" 
                          placeholder="Valor (ej: 100% Orgánico, M, 250ml)"
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
    </div>
  )
}
