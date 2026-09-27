'use client'
import { useEffect, useState, useCallback } from 'react'
import styles from './CustomCursor.module.css'

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: -100, y: -100 })

  const moveCursor = useCallback((e) => {
    requestAnimationFrame(() => {
      setPos({ x: e.clientX, y: e.clientY })
    })
    if (!visible) setVisible(true)
  }, [visible])

  useEffect(() => {
    // Don't render on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return

    const handleMouseOver = (e) => {
      const target = e.target
      if (target.closest('a, button, input, textarea, select, .interactive, .magnetic')) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', moveCursor, { passive: true })
    window.addEventListener('mouseover', handleMouseOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [moveCursor])

  // Don't render on mobile/touch devices (SSR safe)
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  return (
    <div className={styles.cursorWrapper} style={{ opacity: visible ? 1 : 0 }}>
      <div
        className={`${styles.cursorRing} ${isHovering ? styles.hovering : ''}`}
        style={{
          transform: `translate(${pos.x - 16}px, ${pos.y - 16}px)`,
        }}
      />
      <div
        className={`${styles.cursorDot} ${isHovering ? styles.dotHidden : ''}`}
        style={{
          transform: `translate(${pos.x - 3}px, ${pos.y - 3}px)`,
        }}
      />
    </div>
  )
}
