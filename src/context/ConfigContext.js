'use client'

import { createContext, useContext, useState } from 'react'

const ConfigContext = createContext()

export function ConfigProvider({ children }) {
  // Estado global para la configuración de la página web
  const [maintenance, setMaintenance] = useState(false)
  
  const [textos, setTextos] = useState({
    heroBadge: 'TATTOO STUDIO & TATTOO SUPPLIES',
    heroBio: 'Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión. Con años de experiencia, fusiono creatividad y técnica para transformar tus ideas en arte permanente.',
    heroIg: '@inked.tto',
    heroIgLink: 'https://www.instagram.com/inked.tto/',
    ctaTitle: 'AGENDAR TU CITA',
    ctaText: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.',
    ctaButton: 'RESERVAR AHORA'
  })

  const [horarios, setHorarios] = useState([
    { day: 'Lunes', active: true, start: '10:00', end: '19:00' },
    { day: 'Martes', active: true, start: '10:00', end: '19:00' },
    { day: 'Miércoles', active: true, start: '10:00', end: '19:00' },
    { day: 'Jueves', active: true, start: '10:00', end: '19:00' },
    { day: 'Viernes', active: true, start: '10:00', end: '19:00' },
    { day: 'Sábado', active: true, start: '10:00', end: '15:00' },
    { day: 'Domingo', active: false, start: '00:00', end: '00:00' }
  ])

  const [blockedDates, setBlockedDates] = useState([])

  const value = {
    maintenance, setMaintenance,
    textos, setTextos,
    horarios, setHorarios,
    blockedDates, setBlockedDates
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider')
  }
  return context
}
