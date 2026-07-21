'use client'
// Hook para revelar elementos al hacer scroll
import { useEffect, useRef } from 'react'

export default function useScrollReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px' }
    )

    // Observar el elemento y sus hijos con clase .reveal
    const revealElements = el.querySelectorAll('.reveal')
    revealElements.forEach((child) => observer.observe(child))
    if (el.classList.contains('reveal')) observer.observe(el)

    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return ref
}
