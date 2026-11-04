'use client'
import { useEffect, useRef } from 'react'
import styles from './ScrollProgress.module.css'

export default function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    let rafId = null
    let maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

    const updateDimensions = () => {
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    }

    const updateBar = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const ratio = Math.min(1, Math.max(0, scrollY / maxScroll))
      bar.style.transform = `scaleX(${ratio.toFixed(4)})`
      rafId = null
    }

    const onScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateBar)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateDimensions, { passive: true })

    // Observe body height changes (e.g. dynamic content loaded)
    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(document.body)
    }

    updateDimensions()
    updateBar()

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateDimensions)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className={styles.container} aria-hidden="true">
      <div ref={barRef} className={styles.bar} />
    </div>
  )
}
