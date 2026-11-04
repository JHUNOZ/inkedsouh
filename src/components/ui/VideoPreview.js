'use client'
import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import styles from './VideoPreview.module.css'

// Global sequential queue so multiple 4K/1080p phone videos never decode at the same time
const decodeQueue = []
let isDecoding = false

function processNextInQueue() {
  if (isDecoding || decodeQueue.length === 0) return
  isDecoding = true
  const task = decodeQueue.shift()
  task(() => {
    // Small pause between video frame extractions to keep scrolling at 60/120fps
    setTimeout(() => {
      isDecoding = false
      processNextInQueue()
    }, 60)
  })
}

function enqueueVideoFrame(task) {
  decodeQueue.push(task)
  processNextInQueue()
}

export default function VideoPreview({
  src,
  className = '',
  style,
  showBadge = true,
  maxDimension = 420
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !src) return

    let cancelled = false
    let cleanupVideo = null

    const startExtraction = () => {
      enqueueVideoFrame((done) => {
        if (cancelled) {
          done()
          return
        }

        // Detached video element — never added to the DOM, so zero layout/compositor cost
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.preload = 'metadata'

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

        // Timeout fallback in case a video URL is slow or unsupported
        const timeoutId = setTimeout(finish, 5000)

        const drawFrame = () => {
          clearTimeout(timeoutId)
          if (cancelled) {
            finish()
            return
          }

          const canvas = canvasRef.current
          if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
            const vw = video.videoWidth
            const vh = video.videoHeight

            // Target lightweight thumbnail resolution (3:4 default aspect or container aspect)
            const rect = container.getBoundingClientRect()
            const boxW = rect.width || 320
            const boxH = rect.height || 420
            const scale = Math.min(1, maxDimension / Math.max(boxW, boxH))
            const cw = Math.max(160, Math.round(boxW * scale * (window.devicePixelRatio > 1 ? 1.25 : 1)))
            const ch = Math.max(160, Math.round(boxH * scale * (window.devicePixelRatio > 1 ? 1.25 : 1)))

            canvas.width = cw
            canvas.height = ch

            // Compute object-fit: cover crop from source video
            const videoRatio = vw / vh
            const canvasRatio = cw / ch
            let sx = 0
            let sy = 0
            let sw = vw
            let sh = vh

            if (videoRatio > canvasRatio) {
              sw = vh * canvasRatio
              sx = (vw - sw) * 0.5
            } else {
              sh = vw / canvasRatio
              sy = (vh - sh) * 0.5
            }

            const ctx = canvas.getContext('2d', { alpha: false })
            if (ctx) {
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch)
              setReady(true)
            }
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
            // Seek slightly into the video (0.15s) to avoid black fade-in frames
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

        video.src = src
      })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          startExtraction()
        }
      },
      { rootMargin: '250px' }
    )

    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      if (cleanupVideo) cleanupVideo()
    }
  }, [src, maxDimension])

  return (
    <div ref={containerRef} className={`${styles.wrapper} ${className}`} style={style}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${ready ? styles.canvasReady : ''}`}
      />
      {!ready && (
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.skeletonIcon}>
            <Play size={24} fill="currentColor" />
          </div>
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
