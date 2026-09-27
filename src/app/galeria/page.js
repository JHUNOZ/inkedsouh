'use client'
// Página de galería pública sincronizada con Supabase e Instagram
import { useState, useEffect } from 'react'
import { X, Heart, MessageCircle, ExternalLink, Image as ImageIcon } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import { createClient } from '@/lib/supabase/client'
import styles from './galeria.module.css'

export default function GaleriaPage() {
  const [lightbox, setLightbox] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('instagram_cache')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPosts(data || [])
      } catch (err) {
        console.error('Error al cargar la galería:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.header}>
          <SectionTitle subtitle="Nuestro trabajo y portafolio">GALERÍA MULTIMEDIA</SectionTitle>
          <a
            href="https://www.instagram.com/inked.tto/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.igBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Seguir @inked.tto
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Grid de Galería Real */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '60px' }}>Cargando galería...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)', maxWidth: '600px', margin: '40px auto' }}>
            <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.5, color: 'var(--color-red)' }} />
            <h3>Aún no tenemos elementos en la galería</h3>
            <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '8px' }}>
              El administrador actualizará el contenido pronto. Sigue nuestras redes sociales para estar al día.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <div
                key={post.id}
                className={styles.gridItem}
                onClick={() => setLightbox(post)}
              >
                {post.media_type === 'VIDEO' ? (
                  <video src={post.media_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={post.media_url} alt="Portafolio InkedSouh" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                
                <div className={styles.overlay}>
                  <div className={styles.stats}>
                    <span className={styles.stat}><Heart size={16} /> Ver</span>
                  </div>
                </div>
                <div className={styles.neonBorder} />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div className={styles.lightbox} onClick={() => setLightbox(null)}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
              <X size={28} />
            </button>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              {lightbox.media_type === 'VIDEO' ? (
                <video src={lightbox.media_url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh' }} />
              ) : (
                <img src={lightbox.media_url} alt="Detalle Tatuaje" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
