'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Si el usuario prefiere movimiento reducido o es pantalla táctil de bajo rendimiento, omitir Lenis
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isTouch = window.matchMedia('(pointer: coarse)').matches
      if (prefersReducedMotion || isTouch) {
        return
      }
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    })

    let animationFrameId;

    function raf(time) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
