'use client'
// Obsidian Liquid Glow con Destellos Rojos
import { useEffect, useRef } from 'react'
import styles from './SparklesBg.module.css'

export default function SparklesBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    // Ajustar tamaño al contenedor padre
    const resize = () => {
      const parent = canvas.parentElement
      canvas.width = parent.offsetWidth
      canvas.height = parent.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Variables de mouse tracking (suavizado líquido)
    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2
    let targetX = canvas.width / 2
    let targetY = canvas.height / 2

    const handleMouseMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Variables de orbes flotantes de fondo
    let time = 0

    // Destellos Rojos (Flashes)
    const sparklesCount = 40;
    const sparkles = Array.from({ length: sparklesCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedY: -Math.random() * 0.5 - 0.1,
      phase: Math.random() * Math.PI * 2,
      blinkSpeed: Math.random() * 0.02 + 0.01
    }));

    const animate = () => {
      // Fondo Obsidiana puro
      ctx.fillStyle = '#050507'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Lerp suave (Efecto líquido)
      mouseX += (targetX - mouseX) * 0.03
      mouseY += (targetY - mouseY) * 0.03

      time += 0.01

      // Orbe 1: Sigue el ratón (Crimson Líquido)
      const grad1 = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, canvas.width * 0.4)
      grad1.addColorStop(0, 'rgba(255, 42, 61, 0.15)')
      grad1.addColorStop(1, 'transparent')
      ctx.fillStyle = grad1
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, canvas.width * 0.4, 0, Math.PI * 2)
      ctx.fill()

      // Orbe 2: Flota orgánicamente en el fondo (Violeta Abisal)
      const orb2X = canvas.width / 2 + Math.cos(time * 0.5) * canvas.width * 0.3
      const orb2Y = canvas.height / 2 + Math.sin(time * 0.3) * canvas.height * 0.3
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, canvas.width * 0.5)
      grad2.addColorStop(0, 'rgba(60, 20, 80, 0.12)')
      grad2.addColorStop(1, 'transparent')
      ctx.fillStyle = grad2
      ctx.beginPath()
      ctx.arc(orb2X, orb2Y, canvas.width * 0.5, 0, Math.PI * 2)
      ctx.fill()

      // Orbe 3: Latido profundo (Carmín Oscuro)
      const pulse = Math.sin(time) * 0.05 + 0.1
      const orb3X = canvas.width * 0.8
      const orb3Y = canvas.height * 0.8
      const grad3 = ctx.createRadialGradient(orb3X, orb3Y, 0, orb3X, orb3Y, canvas.width * 0.6)
      grad3.addColorStop(0, `rgba(163, 16, 28, ${pulse})`)
      grad3.addColorStop(1, 'transparent')
      ctx.fillStyle = grad3
      ctx.beginPath()
      ctx.arc(orb3X, orb3Y, canvas.width * 0.6, 0, Math.PI * 2)
      ctx.fill()

      // Renderizar Destellos Rojos
      sparkles.forEach(s => {
        s.y += s.speedY;
        if (s.y < -10) s.y = canvas.height + 10;
        
        s.phase += s.blinkSpeed;
        // La opacidad va de 0 a 1 de forma intermitente
        const opacity = Math.pow(Math.sin(s.phase), 8); // Se usa pow 8 para que el destello sea corto

        if (opacity > 0.1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 42, 61, ${opacity})`;
          ctx.fill();
          
          // Resplandor del destello
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 42, 61, ${opacity * 0.3})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.container} 
      style={{ filter: 'blur(3px)' }} // Blur ligero para los orbes de atrás y que los destellos se vean suaves
    />
  )
}
