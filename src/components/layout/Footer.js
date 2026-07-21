// Pie de página del sitio
import Link from 'next/link'
import { MessageCircle, MapPin, Mail, Phone } from 'lucide-react'
import { NAV_LINKS, SITE_NAME, SITE_LOCATION } from '@/lib/constants'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Columna marca */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              INKED<span className={styles.logoAccent}>SOUH</span>
            </div>
            <p className={styles.description}>
              Arte en tu piel. Cada tatuaje es una historia única, creada con pasión y precisión.
            </p>
            <div className={styles.socials}>
              <a
                href="https://www.instagram.com/inked.tto/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a
                href="https://wa.me/56930254425"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="WhatsApp"
              >
                <MessageCircle size={20} />
              </a>
              <a
                href="mailto:inkedsouhtattoo@gmail.com"
                className={styles.socialLink}
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Columna explorar */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>EXPLORAR</h4>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.columnLink}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Columna contacto */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>CONTACTO</h4>
            <div className={styles.address}>
              <MapPin size={16} className={styles.addressIcon} />
              <span>{SITE_LOCATION}</span>
            </div>
            <div className={styles.address}>
              <Phone size={16} className={styles.addressIcon} />
              <span>+56930254425</span>
            </div>
            <div className={styles.address}>
              <Mail size={16} className={styles.addressIcon} />
              <span>inkedsouhtattoo@gmail.com</span>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copyright}>© {SITE_NAME}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
