'use client'
// Obsidian Liquid Glow con Destellos Rojos — Pre-rendered GPU Offscreen Textures for 60/120fps
import { useEffect, useRef } from 'react'
import styles from './SparklesBg.module.css'

function createOrbTexture(colorInner, colorOuter, size = 128) {
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const oCtx = offscreen.getContext('2d')
  if (!oCtx) return null
  const half = size / 2
  const grad = oCtx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, colorInner)
  grad.addColorStop(1, colorOuter)
  oCtx.fillStyle = grad
  oCtx.fillRect(0, 0, size, size)
  return offscreen
}

export default function SparklesBg({ count = 30 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return

    let animId = null
    let isVisible = true
    let width = 800
    let height = 600

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let isSmallScreen = window.innerWidth < 768

    // Pre-render radial gradients once into lightweight offscreen textures
    const orb1Tex = createOrbTexture('rgba(225, 29, 72, 0.10)', 'rgba(250, 250, 252, 0)')
    const orb2Tex = createOrbTexture('rgba(244, 63, 94, 0.065)', 'rgba(250, 250, 252, 0)')

    const resize = () => {
      const parent = canvas.parentElement
      width = (parent && parent.offsetWidth) || window.innerWidth
      height = (parent && parent.offsetHeight) || window.innerHeight
      canvas.width = width
      canvas.height = height
      isSmallScreen = window.innerWidth < 768
    }
    resize()

    let resizeTimer = null
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 100)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // Mouse tracking (works on all PCs including hybrid touchscreen laptops)
    let mouseX = width / 2
    let mouseY = height / 2
    let targetX = width / 2
    let targetY = height / 2

    const handlePointerMove = (e) => {
      if (e.pointerType === 'touch') return
      const rect = canvas.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    let time = 0
    let lastFrameTime = 0

    const actualCount = isSmallScreen ? Math.min(8, count) : Math.min(28, count)
    const sparkles = Array.from({ length: actualCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      speedY: -Math.random() * 0.35 - 0.1,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: Math.random() * 0.02 + 0.01
    }))

    const drawFrame = (now = 0) => {
      if (!isVisible) {
        animId = null
        return
      }

      // On mobile screens, throttle to ~30fps to keep touch scrolling ultra-responsive
      if (isSmallScreen && now - lastFrameTime < 32) {
        animId = requestAnimationFrame(drawFrame)
        return
      }
      lastFrameTime = now

      ctx.fillStyle = '#FAFAFC'
      ctx.fillRect(0, 0, width, height)

      // Smooth mouse lerp
      mouseX += (targetX - mouseX) * 0.06
      mouseY += (targetY - mouseY) * 0.06
      time += 0.008

      const minDim = Math.min(width, height)

      // Orb 1: Soft Crimson glow following cursor
      if (orb1Tex) {
        const r1 = minDim * 0.48
        ctx.drawImage(orb1Tex, mouseX - r1, mouseY - r1, r1 * 2, r1 * 2)
      }

      // Orb 2: Warm Rose floating aura
      if (orb2Tex) {
        const orb2X = width * 0.5 + Math.cos(time * 0.5) * width * 0.22
        const orb2Y = height * 0.5 + Math.sin(time * 0.3) * height * 0.22
        const r2 = minDim * 0.55
        ctx.drawImage(orb2Tex, orb2X - r2, orb2Y - r2, r2 * 2, r2 * 2)
      }

      // Render sparkles
      if (!prefersReducedMotion) {
        for (let i = 0; i < sparkles.length; i++) {
          const s = sparkles[i]
          s.y += s.speedY
          if (s.y < -10) {
            s.y = height + 10
            s.x = Math.random() * width
          }
          s.phase += s.blinkSpeed
          const sSin = Math.sin(s.phase)
          if (sSin > 0.5) {
            const opacity = Math.pow(sSin, 8) * 0.65
            if (opacity > 0.08) {
              ctx.fillStyle = `rgba(225, 29, 72, ${opacity.toFixed(2)})`
              ctx.beginPath()
              ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(drawFrame)
      } else {
        animId = null
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible && !animId && !prefersReducedMotion) {
          animId = requestAnimationFrame(drawFrame)
        }
      },
      { threshold: 0.02 }
    )
    observer.observe(canvas)

    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId)
          animId = null
        }
      } else if (isVisible && !animId && !prefersReducedMotion) {
        animId = requestAnimationFrame(drawFrame)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Initial render
    drawFrame(0)

    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (resizeTimer) clearTimeout(resizeTimer)
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [count])

  return <canvas ref={canvasRef} className={styles.container} aria-hidden="true" />
}
