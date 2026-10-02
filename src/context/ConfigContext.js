'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ConfigContext = createContext()

const DEFAULT_TEXTS = {
  heroBadge: 'TATTOO STUDIO & TATTOO SUPPLIES',
  hero_badge: 'TATTOO STUDIO & TATTOO SUPPLIES',
  heroTitle: 'ARTE EN TU PIEL',
  hero_title: 'ARTE EN TU PIEL',
  heroSubtitle: 'Cada tatuaje es una historia única, creada con pasión y precisión.',
  hero_subtitle: 'Cada tatuaje es una historia única, creada con pasión y precisión.',
  heroBio: 'Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión. Con años de experiencia, fusiono creatividad y técnica para transformar tus ideas en arte permanente.',
  hero_bio: 'Artista del tatuaje especializado en crear obras únicas sobre la piel. Cada diseño es una expresión personal de arte y pasión. Con años de experiencia, fusiono creatividad y técnica para transformar tus ideas en arte permanente.',
  heroIg: '@inked.tto',
  hero_ig: '@inked.tto',
  heroIgLink: 'https://www.instagram.com/inked.tto/',
  hero_ig_link: 'https://www.instagram.com/inked.tto/',
  ctaTitle: 'AGENDAR TU CITA',
  cta_title: 'AGENDAR TU CITA',
  ctaText: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.',
  cta_text: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.',
  ctaSubtitle: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.',
  cta_subtitle: 'Reserva tu sesión de tatuaje de forma rápida y sencilla. Selecciona el servicio, elige la fecha y prepárate para llevar arte único en tu piel.',
  ctaButton: 'RESERVAR AHORA',
  cta_button: 'RESERVAR AHORA',
  cta_button_text: 'RESERVAR AHORA',
  artistPhoto: '',
  artist_photo: '',
  footerDescription: 'Estudio especializado en Blackwork y Lettering en Rancagua.',
  footer_description: 'Estudio especializado en Blackwork y Lettering en Rancagua.',
  footerCopyright: '© 2026 INKEDSOUH TATTOO STUDIO. Todos los derechos reservados.',
  footer_copyright: '© 2026 INKEDSOUH TATTOO STUDIO. Todos los derechos reservados.',
  contactWhatsapp: '+56930254425',
  contact_whatsapp: '+56930254425',
  contactAddress: 'Rancagua, Región de O\'Higgins, Chile',
  contact_address: 'Rancagua, Región de O\'Higgins, Chile',
  deliveryTimeframe: '24 a 48 horas hábiles en RM / 2 a 4 días hábiles a Regiones',
  delivery_timeframe: '24 a 48 horas hábiles en RM / 2 a 4 días hábiles a Regiones',
  termsUrl: '',
  terms_url: ''
}

export function ConfigProvider({ children }) {
  const [maintenance, setMaintenance] = useState(false)
  const [textos, setTextos] = useState(DEFAULT_TEXTS)
  const [loading, setLoading] = useState(true)

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

  const fetchDynamicConfig = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('site_config').select('*')
      
      if (!error && data && data.length > 0) {
        const mapped = { ...DEFAULT_TEXTS }
        
        data.forEach(item => {
          if (item.key_name && item.value !== undefined && item.value !== null) {
            mapped[item.key_name] = item.value
            
            // Also map to camelCase aliases for legacy compatibility
            if (item.key_name === 'hero_badge') mapped.heroBadge = item.value
            if (item.key_name === 'hero_title') mapped.heroTitle = item.value
            if (item.key_name === 'hero_subtitle') mapped.heroSubtitle = item.value
            if (item.key_name === 'hero_bio') mapped.heroBio = item.value
            if (item.key_name === 'hero_ig') mapped.heroIg = item.value
            if (item.key_name === 'hero_ig_link') mapped.heroIgLink = item.value
            if (item.key_name === 'cta_title') mapped.ctaTitle = item.value
            if (item.key_name === 'cta_subtitle' || item.key_name === 'cta_text') {
              mapped.ctaText = item.value
              mapped.ctaSubtitle = item.value
              mapped.cta_text = item.value
              mapped.cta_subtitle = item.value
            }
            if (item.key_name === 'cta_button_text' || item.key_name === 'cta_button') {
              mapped.ctaButton = item.value
              mapped.cta_button = item.value
              mapped.cta_button_text = item.value
            }
            if (item.key_name === 'artist_photo') mapped.artistPhoto = item.value
            if (item.key_name === 'footer_description') mapped.footerDescription = item.value
            if (item.key_name === 'footer_copyright') mapped.footerCopyright = item.value
            if (item.key_name === 'contact_whatsapp') mapped.contactWhatsapp = item.value
            if (item.key_name === 'contact_address') mapped.contactAddress = item.value
            if (item.key_name === 'delivery_timeframe') mapped.deliveryTimeframe = item.value
            if (item.key_name === 'terms_url' || item.key_name === 'terms_and_conditions') mapped.termsUrl = item.value
          }
        })
        
        setTextos(mapped)
      }
    } catch (err) {
      console.error('Error fetching site_config in provider:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDynamicConfig()
  }, [fetchDynamicConfig])

  const value = {
    maintenance,
    setMaintenance,
    textos,
    setTextos,
    horarios,
    setHorarios,
    blockedDates,
    setBlockedDates,
    refreshConfig: fetchDynamicConfig,
    loadingConfig: loading
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
