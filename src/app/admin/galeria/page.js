'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Camera } from 'lucide-react'
import styles from './galeria.module.css'

export default function GaleriaPage() {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('instagram_cache')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setMedia(data)
    }
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    // Aquí irá la lógica de fetch a la API de Instagram o nuestro Cron endpoint
    // Simularemos un tiempo de espera
    setTimeout(() => {
      alert('Sincronización con Instagram Basic Display API pendiente de configuración de Token.')
      setSyncing(false)
    }, 2000)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Galería e Instagram</h1>
          <p className={styles.subtitle}>Sincroniza tus últimos tatuajes y reels</p>
        </div>
        <button onClick={handleSync} className={styles.btnSync} disabled={syncing}>
          <RefreshCw size={18} className={syncing ? styles.spin : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      </div>

      <div className={styles.infoBox}>
        <Camera size={24} className={styles.igIcon} />
        <div>
          <h3>Integración con Instagram Graph API</h3>
          <p>Para automatizar la importación de tus posts, necesitas agregar tu Access Token en el panel de configuración o variables de entorno.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando caché de galería...</div>
      ) : (
        <div className={styles.grid}>
          {media.length === 0 ? (
            <div className={styles.empty}>
              No hay imágenes en caché aún. Haz clic en "Sincronizar Ahora" cuando la API esté configurada.
            </div>
          ) : (
            media.map(item => (
              <div key={item.id} className={styles.card}>
                {item.media_type === 'VIDEO' ? (
                  <video src={item.media_url} autoPlay loop muted className={styles.media} />
                ) : (
                  <img src={item.media_url} alt="Instagram Post" className={styles.media} />
                )}
                <div className={styles.cardFooter}>
                  <a href={item.permalink} target="_blank" rel="noreferrer" className={styles.link}>
                    Ver en Instagram
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
