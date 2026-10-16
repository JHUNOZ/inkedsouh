'use client'
// Obsidian Liquid Glow con Destellos Rojos - Ultra Optimized for High Performance & Mobile
import { useEffect, useRef } from 'react'
import styles from './SparklesBg.module.css'

export default function SparklesBg({ count = 30 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let animId
    let isVisible = true

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches

    // Resize canvas to parent bounds
    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth || window.innerWidth
        canvas.height = parent.offsetHeight || window.innerHeight
      }
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Pause animation when hero is off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible && !animId) {
          animId = requestAnimationFrame(animate)
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(canvas)

    // Mouse tracking with throttled / smoothed coordinates
    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2
    let targetX = canvas.width / 2
    let targetY = canvas.height / 2

    const handleMouseMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
    }

    let time = 0

    // Adjusted particle count for mobile vs desktop for high frame rates
    const actualCount = isMobile ? Math.min(8, count) : count
    const sparkles = Array.from({ length: actualCount }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      size: Math.random() * 2 + 0.5,
      speedY: -Math.random() * 0.4 - 0.1,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: Math.random() * 0.02 + 0.01
    }))

    const animate = () => {
      if (!isVisible) {
        animId = null
        return
      }

      // Pearl White background fill
      ctx.fillStyle = '#FAFAFC'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Smooth mouse lerp
      if (!isMobile) {
        mouseX += (targetX - mouseX) * 0.03
        mouseY += (targetY - mouseY) * 0.03
      }

      time += 0.008

      // Orb 1: Soft Crimson glow follow
      const radius1 = Math.min(canvas.width, canvas.height) * 0.45
      const grad1 = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, radius1)
      grad1.addColorStop(0, 'rgba(225, 29, 72, 0.09)')
      grad1.addColorStop(1, 'rgba(250, 250, 252, 0)')
      ctx.fillStyle = grad1
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, radius1, 0, Math.PI * 2)
      ctx.fill()

      // Orb 2: Warm Rose / Slate floating aura
      const orb2X = canvas.width / 2 + Math.cos(time * 0.5) * canvas.width * 0.25
      const orb2Y = canvas.height / 2 + Math.sin(time * 0.3) * canvas.height * 0.25
      const radius2 = Math.min(canvas.width, canvas.height) * 0.55
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, radius2)
      grad2.addColorStop(0, 'rgba(244, 63, 94, 0.06)')
      grad2.addColorStop(1, 'rgba(250, 250, 252, 0)')
      ctx.fillStyle = grad2
      ctx.beginPath()
      ctx.arc(orb2X, orb2Y, radius2, 0, Math.PI * 2)
      ctx.fill()

      // Render sparkles (skipped if user prefers reduced motion)
      if (!prefersReducedMotion) {
        sparkles.forEach(s => {
          s.y += s.speedY
          if (s.y < -10) s.y = canvas.height + 10

          s.phase += s.blinkSpeed
          const opacity = Math.pow(Math.sin(s.phase), 8) * 0.65

          if (opacity > 0.08) {
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(225, 29, 72, ${opacity})`
            ctx.fill()
          }
        })
      }

      animId = requestAnimationFrame(animate)
    }

    // Pause animation when tab is in background
    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId)
          animId = null
        }
      } else if (isVisible && !animId) {
        animId = requestAnimationFrame(animate)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    animId = requestAnimationFrame(animate)

    return () => {
      if (animId) cancelAnimationFrame(animId)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [count])

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.container} 
    />
  )
}
