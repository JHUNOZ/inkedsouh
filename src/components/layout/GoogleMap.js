// Sección de Google Maps con información de contacto - Dark Tech Style
import { MapPin, Clock, Phone, ArrowUpRight } from 'lucide-react'
import SectionTitle from '@/components/ui/SectionTitle'
import { SITE_LOCATION } from '@/lib/constants'
import styles from './GoogleMap.module.css'

export default function GoogleMap() {
  return (
    <section className={styles.section} id="ubicacion">
      <div className={styles.inner}>
        
        <div className="reveal-left">
          <SectionTitle number="02" subtitle="VISÍTANOS">UBICACIÓN</SectionTitle>
        </div>

        <div className={styles.content}>
          {/* Lado Izquierdo: Información */}
          <div className={styles.infoCol}>
            
            {/* Tarjetas de info */}
            <div className={`${styles.infoCard} reveal-scale reveal-delay-1`}>
              <MapPin className={styles.icon} size={20} />
              <div className={styles.textData}>
                <span className={styles.label}>DIRECCIÓN</span>
                <span className={styles.value}>{SITE_LOCATION}</span>
              </div>
            </div>

            <div className={`${styles.infoCard} reveal-scale reveal-delay-2`}>
              <Clock className={styles.icon} size={20} />
              <div className={styles.textData}>
                <span className={styles.label}>HORARIO</span>
                <span className={styles.value}>Lun — Vie: 10:00 — 19:00</span>
                <span className={styles.value}>Sáb: 10:00 — 15:00</span>
              </div>
            </div>

            <div className={`${styles.infoCard} reveal-scale reveal-delay-3`}>
              <Phone className={styles.icon} size={20} />
              <div className={styles.textData}>
                <span className={styles.label}>TELÉFONO</span>
                <span className={styles.value}>+56 9 3025 4425</span>
              </div>
            </div>

            {/* Botón Cómo Llegar con Bracket Borders */}
            <a 
              href="https://www.google.com/maps?ll=-34.172422,-70.738208&z=16&t=m&hl=es-ES&gl=US&mapclient=embed&q=Almarza+552+2820000+Rancagua+O%27Higgins" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${styles.directionsBtn} bracket-borders reveal-scale reveal-delay-4`}
            >
              CÓMO LLEGAR <ArrowUpRight size={16} />
            </a>

          </div>

          {/* Lado Derecho: Mapa enmarcado oscuro */}
          <div className={`${styles.mapCol} reveal-right`}>
            <div className={`${styles.mapContainer} bracket-borders`}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.5!2d-70.7394!3d-34.1701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x966318c8e5a1f1f1%3A0x1!2sAlmarza%20552%2C%20Rancagua%2C%20Chile!5e0!3m2!1ses!2scl!4v1"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación INKEDSOUH"
              />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
