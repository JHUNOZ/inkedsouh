'use client'
// Gestión de productos del admin (CRUD completo, stock, descuentos)
import { useState } from 'react'
import { Plus, Edit2, Trash2, Package, X, Image as ImageIcon } from 'lucide-react'
import BubbleButton from '@/components/ui/BubbleButton'
import { MOCK_PRODUCTOS } from '@/lib/mockData'
import mainStyles from '../main.module.css'
import localStyles from '../reservas/reservas.module.css' // Usamos estilos de modales

export default function ProductosAdmin() {
  const [products, setProducts] = useState(MOCK_PRODUCTOS)
  const [modal, setModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [formData, setFormData] = useState({ name: '', price: '', discount: 0, stock: 0, category: 'Cuidado', description: '' })
  
  // Categorías inferidas de mockData o default
  const categories = ['Cuidado', 'Kits', 'Diseños', 'Merch', 'Otros']

  const openNew = () => {
    setEditProduct(null)
    setFormData({ name: '', price: '', discount: 0, stock: 0, category: 'Cuidado', description: '' })
    setModal(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setFormData({ 
      name: product.name, 
      price: product.price, 
      discount: product.discount, 
      stock: product.stock, 
      category: product.category || 'Cuidado', 
      description: '' 
    })
    setModal(true)
  }

  const handleSave = () => {
    if (editProduct) {
      setProducts(products.map(p => p.id === editProduct.id ? { 
        ...p, 
        ...formData, 
        isSoldOut: formData.stock <= 0 
      } : p))
    } else {
      setProducts([...products, { 
        id: Date.now().toString(), 
        ...formData, 
        isSoldOut: formData.stock <= 0 
      }])
    }
    setModal(false)
  }

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className={mainStyles.title}>Catálogo e Inventario</h1>
          <p className={mainStyles.subtitle}>Gestiona tus productos, precios, descuentos y stock</p>
        </div>
        <BubbleButton size="small" onClick={openNew}>
          <Plus size={16} /> Nuevo Producto
        </BubbleButton>
      </div>

      {/* Tabla de productos */}
      <div className={mainStyles.section} style={{ padding: 0, overflow: 'hidden' }}>
        <div className={mainStyles.table}>
          <div className={mainStyles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 1fr' }}>
            <span>Producto</span>
            <span>Precio</span>
            <span>Descuento</span>
            <span>Stock</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {products.map((p) => (
            <div key={p.id} className={mainStyles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 1fr' }}>
              <div className={mainStyles.clientCell} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ImageIcon size={18} color="#555" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={mainStyles.clientName}>{p.name}</span>
                  <span className={mainStyles.clientEmail}>{p.category}</span>
                </div>
              </div>
              <span>{p.price}</span>
              <span style={{ color: p.discount > 0 ? '#22c55e' : '#888' }}>
                {p.discount > 0 ? `-${p.discount}%` : '—'}
              </span>
              <span style={{ color: p.stock <= 0 ? '#ef4444' : p.stock < 10 ? '#f59e0b' : '#888' }}>
                {p.stock} un.
              </span>
              <span className={`${mainStyles.status} ${p.stock > 0 ? mainStyles.status_activo : mainStyles.status_cancelada}`}>
                {p.stock > 0 ? 'Disponible' : 'Agotado'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => openEdit(p)} 
                  title="Editar" 
                  className={`${localStyles.actionBtn} ${localStyles.btnView}`}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(p.id)} 
                  title="Eliminar" 
                  className={`${localStyles.actionBtn} ${localStyles.btnCancel}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de creación/edición */}
      {modal && (
        <div className={localStyles.modalOverlay} onClick={() => setModal(false)}>
          <div className={localStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={localStyles.modalHeader}>
              <h3 className={localStyles.modalTitle}>{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className={localStyles.closeBtn} onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            
            <div className={localStyles.modalBody}>
              {/* Sección subir imagen */}
              <div style={{ marginBottom: '20px', border: '1px dashed #2A2A2A', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                <ImageIcon size={32} color="#888" style={{ marginBottom: '10px' }} />
                <p style={{ color: '#888', fontSize: '0.85rem' }}>Haz clic para subir o arrastra la imagen del producto aquí</p>
              </div>

              <div className={localStyles.detailRow}>
                <span>Nombre del Producto</span>
                <input className={localStyles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Crema Cicatrizante" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className={localStyles.detailRow}>
                  <span>Precio Base</span>
                  <input className={localStyles.input} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ej: $15.000" />
                </div>
                <div className={localStyles.detailRow}>
                  <span>Descuento %</span>
                  <input className={localStyles.input} type="number" min="0" max="100" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className={localStyles.detailRow}>
                  <span>Unidades en Stock</span>
                  <input className={localStyles.input} type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
                <div className={localStyles.detailRow}>
                  <span>Categoría</span>
                  <select className={localStyles.input} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(cat => (
                      <option key={cat} value={cat} style={{ background: '#141414' }}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={localStyles.modalFooter}>
              <button className={`${localStyles.btn} ${localStyles.btnGhost}`} onClick={() => setModal(false)}>Cancelar</button>
              <button className={`${localStyles.btn} ${localStyles.btnPrimary}`} onClick={handleSave}>Guardar Producto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
