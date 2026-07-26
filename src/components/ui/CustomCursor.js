'use client'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import styles from './CustomCursor.module.css'

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)
  
  // Motion values for raw mouse position
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  // Spring physics for smooth movement
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    // Hide default cursor globally
    document.body.style.cursor = 'none'

    // Disable if touch device
    if (window.matchMedia('(pointer: coarse)').matches) return

    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16) // Offset by half the width of the ring
      cursorY.set(e.clientY - 16)
    }

    const handleMouseOver = (e) => {
      const target = e.target
      if (
        target.closest('a, button, input, textarea, select, .interactive, .magnetic')
      ) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
      document.body.style.cursor = 'auto'
    }
  }, [cursorX, cursorY])

  // Don't render on mobile/touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  return (
    <div className={styles.cursorWrapper}>
      <motion.div
        className={styles.cursorRing}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isHovering ? 2.5 : 1,
          backgroundColor: isHovering ? 'rgba(255, 42, 61, 0.1)' : 'transparent',
          borderColor: isHovering ? 'transparent' : 'rgba(255, 42, 61, 0.5)',
          mixBlendMode: isHovering ? 'normal' : 'difference'
        }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className={styles.cursorDot}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ duration: 0.2 }}
      />
    </div>
  )
}
