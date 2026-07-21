// Layout raíz de la aplicación
import { Oswald, Montserrat } from 'next/font/google'
import './globals.css'
import CustomCursor from '@/components/ui/CustomCursor'
import SmoothScroll from '@/components/layout/SmoothScroll'
import ScrollProgress from '@/components/ui/ScrollProgress'
import Providers from '@/components/layout/Providers'

const displayFont = Oswald({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-display-loaded',
  display: 'swap',
})

const bodyFont = Montserrat({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body-loaded',
  display: 'swap',
})

export const metadata = {
  title: 'INKEDSOUH | Arte en tu Piel — Tatuajes Profesionales',
  description: 'Estudio de tatuaje profesional en Rancagua, Chile. Reserva tu cita, explora la galería, compra productos y cursos de tatuaje. Especialistas en Blackwork, Lettering, Realismo y Neotradicional.',
  keywords: ['tatuaje', 'tattoo', 'rancagua', 'chile', 'blackwork', 'lettering', 'inkedsouh', 'tatuador'],
  openGraph: {
    title: 'INKEDSOUH | Arte en tu Piel',
    description: 'Estudio de tatuaje profesional en Rancagua, Chile. Reserva tu cita online.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <Providers>
          <SmoothScroll>
            <ScrollProgress />
            <CustomCursor />
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  )
}
