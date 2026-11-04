'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

export default function SmoothScroll({ children }) {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Skip Lenis on admin/student portals, reduced-motion, or pure touch devices
    const isPortal = pathname?.startsWith('/admin') || pathname?.startsWith('/estudiante')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

    if (isPortal || prefersReducedMotion || isTouchDevice) {
      return
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: false,
      prevent: (node) => {
        if (!node || typeof node.closest !== 'function') return false
        if (node.closest('[data-lenis-prevent]')) return true
        // Allow native scroll inside modals, drawers, and scrollable containers
        let el = node
        while (el && el !== document.body && el !== document.documentElement) {
          const style = window.getComputedStyle(el)
          const overflowY = style.overflowY
          if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
            return true
          }
          el = el.parentElement
        }
        return false
      },
    })

    let animationFrameId = null

    function raf(time) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      } else if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(raf)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    animationFrameId = requestAnimationFrame(raf)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      lenis.destroy()
    }
  }, [pathname])

  return <>{children}</>
}
