'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './CustomCursor.module.css'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    // Ocultar cursor default en el body
    document.body.style.cursor = 'none'
    
    // Es posible que algunos elementos interactivos sigan mostrando el cursor pointer.
    // Esto se solucionará con una regla CSS global, pero por si acaso.

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100

    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }
      // Actualizar variables globales para el Spotlight Effect
      document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`)
    }

    const handleMouseOver = (e) => {
      if (e.target.closest('a, button, input, textarea, select, .interactive')) {
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleMouseOver)

    let animId
    const animateRing = () => {
      // Movimiento suave del anillo (Lerp)
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }
      animId = requestAnimationFrame(animateRing)
    }
    animateRing()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
      cancelAnimationFrame(animId)
      document.body.style.cursor = 'auto'
    }
  }, [])

  return (
    <div className={styles.cursorWrapper}>
      <div ref={ringRef} className={`${styles.ring} ${isHovering ? styles.ringHover : ''}`} />
      <div ref={dotRef} className={`${styles.dot} ${isHovering ? styles.dotHover : ''}`} />
    </div>
  )
}
