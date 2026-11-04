'use client'
import { useEffect, useRef } from 'react'
import styles from './CustomCursor.module.css'

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], .interactive, .magnetic'

export default function CustomCursor() {
  const wrapperRef = useRef(null)
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    if (!wrapper || !ring || !dot) return

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let isVisible = false
    let isHovering = false
    let isPressed = false
    let rafId = null

    const updateRing = () => {
      const dx = mouseX - ringX
      const dy = mouseY - ringY

      ringX += dx * 0.24
      ringY += dy * 0.24

      const scale = isPressed ? 0.85 : isHovering ? 1.75 : 1
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`

      // Continue loop only while ring is catching up to cursor
      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        rafId = requestAnimationFrame(updateRing)
      } else {
        ringX = mouseX
        ringY = mouseY
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`
        rafId = null
      }
    }

    const startRaf = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateRing)
      }
    }

    const onPointerMove = (e) => {
      // Hide cursor on touch inputs (mobile/tablet finger taps)
      if (e.pointerType === 'touch') {
        if (isVisible) {
          isVisible = false
          wrapper.style.opacity = '0'
        }
        return
      }

      mouseX = e.clientX
      mouseY = e.clientY

      // First move: snap ring directly to cursor so it doesn't fly in from (-100, -100)
      if (!isVisible) {
        ringX = mouseX
        ringY = mouseY
        isVisible = true
        wrapper.style.opacity = '1'
      }

      // Instant zero-latency update for inner dot
      const dotScale = isHovering ? 0 : isPressed ? 0.75 : 1
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`

      startRaf()
    }

    const onMouseOver = (e) => {
      const target = e.target
      const nextHover = Boolean(
        target && typeof target.closest === 'function' && target.closest(INTERACTIVE_SELECTOR)
      )
      if (nextHover !== isHovering) {
        isHovering = nextHover
        ring.classList.toggle(styles.hovering, isHovering)
        dot.classList.toggle(styles.dotHidden, isHovering)
        const dotScale = isHovering ? 0 : isPressed ? 0.75 : 1
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`
        startRaf()
      }
    }

    const onPointerDown = (e) => {
      if (e.pointerType === 'touch') return
      isPressed = true
      const dotScale = isHovering ? 0 : 0.75
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`
      startRaf()
    }

    const onPointerUp = (e) => {
      if (e.pointerType === 'touch') return
      isPressed = false
      const dotScale = isHovering ? 0 : 1
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`
      startRaf()
    }

    const onMouseLeaveWindow = () => {
      isVisible = false
      wrapper.style.opacity = '0'
    }

    const onTouchStart = () => {
      if (isVisible) {
        isVisible = false
        wrapper.style.opacity = '0'
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('mouseover', onMouseOver, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    document.addEventListener('mouseleave', onMouseLeaveWindow, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('mouseleave', onMouseLeaveWindow)
      window.removeEventListener('touchstart', onTouchStart)
    }
  }, [])

  return (
    <div ref={wrapperRef} className={styles.cursorWrapper} aria-hidden="true">
      <div ref={ringRef} className={styles.cursorRing} />
      <div ref={dotRef} className={styles.cursorDot} />
    </div>
  )
}
