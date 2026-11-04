'use client'
import { useRef, useEffect } from 'react'
import Link from 'next/link'
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

    // Skip magnetic hover listeners on pure touch devices
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return

    let isHovering = false
    let mouseX = 0
    let mouseY = 0
    let btnX = 0
    let btnY = 0
    let animId = null

    const animate = () => {
      const targetY = mouseY - (isHovering ? 3 : 0)
      btnX += (mouseX - btnX) * 0.16
      btnY += (targetY - btnY) * 0.16

      btn.style.transform = `translate3d(${btnX.toFixed(2)}px, ${btnY.toFixed(2)}px, 0) scale(${isHovering ? 1.02 : 1})`

      // Only keep RAF running while hovering or settling back to rest
      if (isHovering || Math.abs(btnX) > 0.1 || Math.abs(btnY) > 0.1) {
        animId = requestAnimationFrame(animate)
      } else {
        btnX = 0
        btnY = 0
        btn.style.transform = ''
        animId = null
      }
    }

    const startRaf = () => {
      if (animId === null) {
        animId = requestAnimationFrame(animate)
      }
    }

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      btn.style.setProperty('--x', `${x}px`)
      btn.style.setProperty('--y', `${y}px`)

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX = (e.clientX - centerX) * 0.25
      mouseY = (e.clientY - centerY) * 0.25
      startRaf()
    }

    const onPointerEnter = (e) => {
      if (e.pointerType === 'touch') return
      isHovering = true
      startRaf()
    }

    const onPointerLeave = () => {
      isHovering = false
      mouseX = 0
      mouseY = 0
      startRaf()
    }

    btn.addEventListener('pointermove', onPointerMove, { passive: true })
    btn.addEventListener('pointerenter', onPointerEnter, { passive: true })
    btn.addEventListener('pointerleave', onPointerLeave, { passive: true })

    return () => {
      btn.removeEventListener('pointermove', onPointerMove)
      btn.removeEventListener('pointerenter', onPointerEnter)
      btn.removeEventListener('pointerleave', onPointerLeave)
      if (animId !== null) cancelAnimationFrame(animId)
      btn.style.transform = ''
    }
  }, [disabled])

  const classes = [
    styles.btn,
    styles[variant],
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    fullWidth && styles.fullWidth,
    'interactive',
    className
  ].filter(Boolean).join(' ')

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link ref={btnRef} href={href} className={classes} {...props}>
          <span className={styles.content}>{children}</span>
        </Link>
      )
    }
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
