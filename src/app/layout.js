// Layout raíz de la aplicación
import { Bebas_Neue, Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import CustomCursor from '@/components/ui/CustomCursor'
import SmoothScroll from '@/components/layout/SmoothScroll'
import ScrollProgress from '@/components/ui/ScrollProgress'
import Providers from '@/components/layout/Providers'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display-next',
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body-next',
  display: 'swap',
})

const playfair = Playfair_Display({
  weight: ['700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-accent-next',
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
    <html lang="es" className={`${bebasNeue.variable} ${inter.variable} ${playfair.variable}`}>
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
