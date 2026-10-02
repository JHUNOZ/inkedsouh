'use client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SectionTitle from '@/components/ui/SectionTitle'
import { ShieldCheck, Truck, RotateCcw, CreditCard, Lock, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useConfig } from '@/context/ConfigContext'

export default function TerminosPage() {
  const { textos } = useConfig()
  const deliveryTimeframe = textos?.delivery_timeframe || textos?.deliveryTimeframe || '24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones'
  const customPdfUrl = textos?.terms_url || textos?.termsUrl

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0a0a0c', color: '#f4f4f5', paddingTop: '130px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          
          <Link href="/productos" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', textDecoration: 'none', marginBottom: '24px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Volver a la Tienda
          </Link>

          <SectionTitle subtitle="Políticas de compra, envíos, métodos de pago y garantías">
            TÉRMINOS Y CONDICIONES
          </SectionTitle>

          {customPdfUrl && (
            <div style={{ background: 'rgba(255,42,61,0.08)', border: '1px solid rgba(255,42,61,0.25)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={24} style={{ color: '#ff2a3d' }} />
                <div>
                  <strong style={{ color: '#fff', display: 'block', fontSize: '0.95rem' }}>Documento Oficial de Términos</strong>
                  <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Documento PDF subido por el administrador</span>
                </div>
              </div>
              <a 
                href={customPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ background: '#ff2a3d', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Abrir PDF en Pestaña Nueva ↗
              </a>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.7, fontSize: '0.92rem', color: '#d4d4d8' }}>
            
            {/* 1. Métodos de Envío */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Truck size={20} style={{ color: '#ff2a3d' }} /> 1. Métodos y Plazos de Envío
              </h3>
              <p>
                Todos los pedidos realizados a través de la tienda web de <strong>INKEDSOUH</strong> son despachados directamente a domicilio o sucursal.
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Plazo Estimado de Entrega:</strong> {deliveryTimeframe}.</li>
                <li><strong>Envíos en Región Metropolitana:</strong> Despacho express a domicilio con seguimiento.</li>
                <li><strong>Envíos a Regiones:</strong> Despacho por pagar mediante Starken, Chilexpress o BlueExpress. Una vez emitido el envío, se compartirá el número de seguimiento por WhatsApp o correo.</li>
              </ul>
            </div>

            {/* 2. Métodos de Pago */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CreditCard size={20} style={{ color: '#ff2a3d' }} /> 2. Formas de Pago Aceptadas
              </h3>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Banca.me BNPL (Compra Ahora, Paga en Cuotas):</strong> Permite pagar en hasta 12 cuotas fijas mensuales utilizando tu RUT, sin requerir tarjeta de crédito bancaria. La evaluación es inmediata.</li>
                <li><strong>Transferencia Bancaria Directa:</strong> Pago directo a nuestra cuenta bancaria oficial. El pedido se procesa una vez validado el comprobante enviado al WhatsApp oficial.</li>
                <li><strong>WhatsApp Directo:</strong> Coordinación personalizada para pedidos mayoristas o consultas técnicas con el artista.</li>
              </ul>
            </div>

            {/* 3. Garantía y Devoluciones */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <RotateCcw size={20} style={{ color: '#ff2a3d' }} /> 3. Garantía e Insumos Sellados
              </h3>
              <p>
                Por razones de estricta bioseguridad e higiene quirúrgica, insumos como <strong>agujas, cartuchos y tintas</strong> deben mantener su sellado hermético original de fábrica intacto para admitir cambios o garantías por defectos de fabricación.
              </p>
            </div>

            {/* 4. Privacidad y Contacto */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Lock size={20} style={{ color: '#ff2a3d' }} /> 4. Privacidad y Soporte
              </h3>
              <p>
                Los datos personales ingresados para los envíos y pagos son tratados con absoluta confidencialidad y utilizados exclusivamente para procesar tu orden.
              </p>
              <p style={{ marginTop: '10px' }}>
                Para cualquier duda o asistencia inmediata, contáctanos a través de nuestro WhatsApp oficial: <strong>{textos?.contact_whatsapp || '+56 9 3025 4425'}</strong> o correo <strong>inkedsouhtattoo@gmail.com</strong>.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
