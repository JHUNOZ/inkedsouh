'use client'
// Página de galería — Feed de Instagram
import { useState } from 'react'
import { X, Heart, MessageCircle, ExternalLink } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import styles from './galeria.module.css'

export default function GaleriaPage() {
  const [lightbox, setLightbox] = useState(null)

  // Posts de Instagram placeholder
  const posts = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    likes: Math.floor(Math.random() * 300) + 50,
    comments: Math.floor(Math.random() * 30) + 3,
  }))

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.header}>
          <SectionTitle subtitle="Nuestro trabajo en Instagram">GALERÍA</SectionTitle>
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

        {/* Grid */}
        <div className={styles.grid}>
          {posts.map((post) => (
            <div
              key={post.id}
              className={styles.gridItem}
              onClick={() => setLightbox(post)}
            >
              <div className={styles.placeholder} />
              <div className={styles.overlay}>
                <div className={styles.stats}>
                  <span className={styles.stat}><Heart size={16} /> {post.likes}</span>
                  <span className={styles.stat}><MessageCircle size={16} /> {post.comments}</span>
                </div>
              </div>
              <div className={styles.neonBorder} />
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className={styles.lightbox} onClick={() => setLightbox(null)}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
              <X size={28} />
            </button>
            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.lightboxImage} />
              <div className={styles.lightboxInfo}>
                <div className={styles.lightboxStats}>
                  <span><Heart size={18} /> {lightbox.likes}</span>
                  <span><MessageCircle size={18} /> {lightbox.comments}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
