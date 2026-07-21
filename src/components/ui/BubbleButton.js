'use client'
import { useRef, useEffect } from 'react'
import styles from './BubbleButton.module.css'

export default function BubbleButton({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  onClick,
  href,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const btnRef = useRef(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn || disabled) return

    let isHovering = false
    let mouseX = 0
    let mouseY = 0
    let btnX = 0
    let btnY = 0

    const onMouseMove = (e) => {
      const rect = btn.getBoundingClientRect()
      // Para el glow (relativo al botón)
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      btn.style.setProperty('--x', `${x}px`)
      btn.style.setProperty('--y', `${y}px`)

      // Para el magnetismo (relativo al centro)
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX = (e.clientX - centerX) * 0.3 // fuerza magnética
      mouseY = (e.clientY - centerY) * 0.3
    }

    const onMouseEnter = () => { isHovering = true }
    const onMouseLeave = () => { 
      isHovering = false 
      mouseX = 0
      mouseY = 0
    }

    btn.addEventListener('mousemove', onMouseMove)
    btn.addEventListener('mouseenter', onMouseEnter)
    btn.addEventListener('mouseleave', onMouseLeave)

    let animId
    const animate = () => {
      // Lerp para suavizar
      const targetY = mouseY - (isHovering ? 3 : 0) // El hover levanta 3px
      btnX += (mouseX - btnX) * 0.1
      btnY += (targetY - btnY) * 0.1
      
      btn.style.transform = `translate3d(${btnX}px, ${btnY}px, 0) scale(${isHovering ? 1.02 : 1})`
      
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      btn.removeEventListener('mousemove', onMouseMove)
      btn.removeEventListener('mouseenter', onMouseEnter)
      btn.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animId)
      btn.style.transform = ''
    }
  }, [disabled])

  const classes = [
    styles.btn,
    styles[variant],
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ')

  if (href) {
    return (
      <a ref={btnRef} href={href} className={classes} {...props}>
        <span className={styles.content}>{children}</span>
      </a>
    )
  }

  return (
    <button ref={btnRef} type={type} className={classes} onClick={onClick} disabled={disabled} {...props}>
      <span className={styles.content}>{children}</span>
    </button>
  )
}
