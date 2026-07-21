'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react'
import styles from './productos.module.css'

export default function ProductosPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    price: '',
    old_price: '',
    stock: '',
    category: 'general',
    image_url: '',
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id)
      setFormData({
        name: product.name,
        description: product.description || '',
        specifications: product.specifications || '',
        price: product.price,
        old_price: product.old_price || '',
        stock: product.stock,
        category: product.category,
        image_url: product.image_url || '',
        is_active: product.is_active
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '', description: '', specifications: '', price: '', old_price: '', 
        stock: '', category: 'general', image_url: '', is_active: true
      })
    }
    setModalOpen(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('admin_uploads')
      .upload(filePath, file)

    if (uploadError) {
      alert('Error subiendo imagen: ' + uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('admin_uploads')
        .getPublicUrl(filePath)
      
      setFormData({ ...formData, image_url: publicUrl })
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      old_price: formData.old_price ? parseFloat(formData.old_price) : null,
      stock: parseInt(formData.stock)
    }

    let error;

    if (editingId) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingId)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([payload])
      error = insertError
    }

    if (!error) {
      setModalOpen(false)
      fetchProducts()
    } else {
      alert('Error guardando producto: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) fetchProducts()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventario de Productos</h1>
          <p className={styles.subtitle}>Gestiona tu mercancía y diseños disponibles</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.btnAdd}>
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando inventario...</div>
      ) : (
        <div className={styles.grid}>
          {products.length === 0 ? (
            <div className={styles.empty}>No hay productos registrados</div>
          ) : (
            products.map(product => (
              <div key={product.id} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className={styles.cardImage} />
                  ) : (
                    <div className={styles.noImage}><ImageIcon size={32} /></div>
                  )}
                  <div className={styles.cardActions}>
                    <button onClick={() => handleOpenModal(product)} className={styles.btnEdit}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(product.id)} className={styles.btnDelete}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <div className={styles.cardPriceRow}>
                    <span className={styles.price}>${product.price}</span>
                    <span className={styles.stock}>Stock: {product.stock}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Form Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className={styles.closeModal} onClick={() => setModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Categoría</label>
                  <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={styles.input} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción General</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
              </div>

              <div className={styles.formGroup}>
                <label>Especificaciones (Talla, material, detalles)</label>
                <textarea rows="2" value={formData.specifications} onChange={e => setFormData({...formData, specifications: e.target.value})} className={styles.textarea} placeholder="Ej: Material 100% algodón. Talla M." />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Precio Actual</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio Antiguo (Opcional)</label>
                  <input type="number" step="0.01" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Stock</label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className={styles.input} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Imagen del Producto</label>
                <div className={styles.imageUploadRow}>
                  {formData.image_url && <img src={formData.image_url} alt="Preview" className={styles.imagePreview} />}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} disabled={uploading} />
                  {uploading && <span className={styles.uploadingText}>Subiendo...</span>}
                </div>
              </div>

              <div className={styles.formGroupCheckbox}>
                <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                <label htmlFor="isActive">Producto Activo (Visible en tienda)</label>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={uploading}>
                {editingId ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
