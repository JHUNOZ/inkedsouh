import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Banca.me BNPL Webhook Listener',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('[Banca.me Webhook Received]:', JSON.stringify(body, null, 2))

    // Banca.me envía payloads con la información de la transacción
    // Ej: { event: "transaction.approved", data: { id: "trx_123", externalTrxId: "INK-123456", status: "approved", amount: 45000 } }
    // O directo: { id: "trx_123", externalTrxId: "INK-123456", status: "approved", amount: 45000 }
    
    const eventType = body.event || body.type || 'transaction.updated'
    const data = body.data || body

    const externalTrxId = data.externalTrxId || data.external_trx_id || data.order_number || data.orderNumber || data.metadata?.orderNumber
    const bancameId = data.id || body.id
    const rawStatus = (data.status || '').toLowerCase()

    if (!externalTrxId) {
      console.warn('[Banca.me Webhook] externalTrxId no encontrado en el payload.')
      return NextResponse.json({ received: true, note: 'No externalTrxId found' }, { status: 200 })
    }

    const supabase = createServerClient()

    let newStatus = 'pendiente_pago'
    let newPaymentStatus = 'pendiente'

    if (
      eventType.includes('approved') || 
      eventType.includes('success') || 
      rawStatus === 'approved' || 
      rawStatus === 'completed' || 
      rawStatus === 'paid'
    ) {
      newStatus = 'pagado_bnpl'
      newPaymentStatus = 'aprobado'
    } else if (
      eventType.includes('rejected') || 
      eventType.includes('declined') || 
      rawStatus === 'rejected' || 
      rawStatus === 'failed'
    ) {
      newStatus = 'rechazado'
      newPaymentStatus = 'rechazado'
    } else if (
      eventType.includes('canceled') || 
      rawStatus === 'canceled'
    ) {
      newStatus = 'cancelado'
      newPaymentStatus = 'cancelado'
    }

    // Actualizar orden en Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
        bancame_trx_id: bancameId ? String(bancameId) : null,
        metadata: body,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', externalTrxId)

    if (updateError) {
      console.error('[Banca.me Webhook Error Updating Order]:', updateError)
    } else {
      console.log(`[Banca.me Webhook] Orden ${externalTrxId} actualizada a ${newStatus} (${newPaymentStatus})`)
    }

    return NextResponse.json({
      received: true,
      orderNumber: externalTrxId,
      status: newStatus,
      paymentStatus: newPaymentStatus
    }, { status: 200 })

  } catch (error) {
    console.error('[Banca.me Webhook Exception]:', error)
    // Devolvemos 200 para evitar reintentos infinitos si el payload era inválido
    return NextResponse.json(
      { received: false, error: error.message },
      { status: 200 }
    )
  }
}
