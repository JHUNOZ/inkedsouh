'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'
import styles from './configuracion.module.css'

export default function ConfiguracionPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .order('section', { ascending: true })
    
    if (data) {
      setConfigs(data)
    }
    setLoading(false)
  }

  const handleUpdate = async (id, newValue) => {
    setSaving(true)
    const { error } = await supabase
      .from('site_config')
      .update({ value: newValue })
      .eq('id', id)
      
    if (!error) {
      alert('¡Guardado exitosamente!')
    } else {
      alert('Error al guardar: ' + error.message)
    }
    setSaving(false)
  }

  const handleChange = (id, value) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, value } : c))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración Web</h1>
        <p className={styles.subtitle}>Modifica los textos principales que ven tus clientes</p>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Cargando textos...</p>
      ) : (
        <div className={styles.grid}>
          {configs.map((config) => (
            <div key={config.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{config.key_name.replace(/_/g, ' ').toUpperCase()}</span>
                <span className={styles.badge}>{config.section}</span>
              </div>
              
              <div className={styles.formGroup}>
                <label>Texto actual:</label>
                {config.value.length > 50 ? (
                  <textarea 
                    className={styles.input} 
                    rows="4"
                    value={config.value}
                    onChange={(e) => handleChange(config.id, e.target.value)}
                  />
                ) : (
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={config.value}
                    onChange={(e) => handleChange(config.id, e.target.value)}
                  />
                )}
              </div>

              <button 
                className={styles.btnSave} 
                onClick={() => handleUpdate(config.id, config.value)}
                disabled={saving}
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambio'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
