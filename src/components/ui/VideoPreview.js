'use client'
import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { getOptimizedVideoAssets } from '@/lib/productUtils'
import styles from './VideoPreview.module.css'

// In-memory cache of extracted thumbnail data URLs so a video is never decoded twice
const frameCache = new Map()

// Global sequential queue so multiple videos never decode at the same time
const decodeQueue = []
let isDecoding = false

function processNextInQueue() {
  if (isDecoding || decodeQueue.length === 0) return
  isDecoding = true
  const task = decodeQueue.shift()
  task(() => {
    setTimeout(() => {
      isDecoding = false
      processNextInQueue()
    }, 120)
  })
}

function enqueueVideoFrame(task) {
  decodeQueue.push(task)
  processNextInQueue()
}

export default function VideoPreview({
  src,
  poster = null,
  alt = 'Vista previa de video',
  className = '',
  style,
  showBadge = true,
  maxDimension = 360
}) {
  const { posterUrl: mappedPoster, videoUrl } = getOptimizedVideoAssets(src, poster)
  const initialThumb = mappedPoster || (src ? frameCache.get(src) : null) || null

  const containerRef = useRef(null)
  const [thumbSrc, setThumbSrc] = useState(initialThumb)

  useEffect(() => {
    const resolved = mappedPoster || (src ? frameCache.get(src) : null) || null
    if (resolved) {
      setThumbSrc(resolved)
      return
    }

    const container = containerRef.current
    const targetUrl = videoUrl || src
    if (!container || !targetUrl) return

    // Never auto-download/decode raw QuickTime .MOV files on the client for thumbnails
    // (raw iPhone .MOV files are often 50MB+ 4K 10-bit HEVC without faststart)
    const cleanLower = targetUrl.split('?')[0].toLowerCase()
    if (cleanLower.endsWith('.mov')) {
      return
    }

    let cancelled = false
    let cleanupVideo = null
    let idleTimer = null
    let isInView = false

    const startExtractionWhenScrollIdle = () => {
      if (cancelled || !isInView) return
      if (idleTimer) clearTimeout(idleTimer)

      // Wait until the user has completely stopped scrolling for 800ms
      idleTimer = setTimeout(() => {
        if (cancelled || !isInView) return
        window.removeEventListener('scroll', onScrollActivity)

        enqueueVideoFrame((done) => {
          if (cancelled) {
            done()
            return
          }

          if (frameCache.has(src)) {
            setThumbSrc(frameCache.get(src))
            done()
            return
          }

          const video = document.createElement('video')
          video.muted = true
          video.playsInline = true
          video.preload = 'metadata'
          video.crossOrigin = 'anonymous'

          let finished = false
          const finish = () => {
            if (finished) return
            finished = true
            try {
              video.pause()
              video.removeAttribute('src')
              video.load()
            } catch {}
            done()
          }

          cleanupVideo = finish
          const timeoutId = setTimeout(finish, 4000)

          const drawFrame = () => {
            clearTimeout(timeoutId)
            if (cancelled) {
              finish()
              return
            }

            if (video.videoWidth > 0 && video.videoHeight > 0) {
              try {
                const vw = video.videoWidth
                const vh = video.videoHeight
                const scale = Math.min(1, maxDimension / Math.max(vw, vh))
                const cw = Math.max(160, Math.round(vw * scale))
                const ch = Math.max(160, Math.round(vh * scale))

                const offscreen = document.createElement('canvas')
                offscreen.width = cw
                offscreen.height = ch
                const ctx = offscreen.getContext('2d', { alpha: false })
                if (ctx) {
                  ctx.drawImage(video, 0, 0, cw, ch)
                  const dataUrl = offscreen.toDataURL('image/jpeg', 0.78)
                  frameCache.set(src, dataUrl)
                  setThumbSrc(dataUrl)
                }
              } catch {}
            }
            finish()
          }

          video.addEventListener('seeked', drawFrame, { once: true })
          video.addEventListener(
            'loadeddata',
            () => {
              if (cancelled) {
                finish()
                return
              }
              try {
                if (video.duration > 0.2) {
                  video.currentTime = 0.15
                } else {
                  drawFrame()
                }
              } catch {
                drawFrame()
              }
            },
            { once: true }
          )
          video.addEventListener('error', () => {
            clearTimeout(timeoutId)
            finish()
          }, { once: true })

          video.src = targetUrl
        })
      }, 800)
    }

    const onScrollActivity = () => {
      if (isInView) {
        startExtractionWhenScrollIdle()
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting
        if (isInView) {
          observer.disconnect()
          window.addEventListener('scroll', onScrollActivity, { passive: true })
          startExtractionWhenScrollIdle()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('scroll', onScrollActivity)
      if (idleTimer) clearTimeout(idleTimer)
      if (cleanupVideo) cleanupVideo()
    }
  }, [src, mappedPoster, videoUrl, maxDimension])

  return (
    <div ref={containerRef} className={`${styles.wrapper} ${className}`} style={style}>
      {thumbSrc ? (
        <img
          src={thumbSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={styles.posterImg}
        />
      ) : (
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.skeletonIcon}>
            <Play size={24} fill="currentColor" />
          </div>
          <span className={styles.skeletonLabel}>VIDEO REEL</span>
        </div>
      )}
      {showBadge && (
        <div className={styles.playBadge} aria-hidden="true">
          <Play size={13} fill="currentColor" />
          <span>VIDEO</span>
        </div>
      )}
    </div>
  )
}
