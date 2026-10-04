import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      customer = {},
      items = [],
      totalAmount,
      paymentMethod = 'transfer',
      deliveryType = 'santiago',
      deliveryAddress = '',
      deliveryCity = 'Santiago',
      deliveryNotes = '',
      deliveryTimeframe = '24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones'
    } = body

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'El monto total debe ser mayor a 0 CLP.' },
        { status: 400 }
      )
    }

    const orderNum = orderNumber || `INK-${Math.floor(100000 + Math.random() * 900000)}`
    const supabase = createServerClient()

    let initialStatus = 'pendiente_pago'
    let paymentStatus = 'pendiente'

    if (paymentMethod === 'whatsapp') {
      initialStatus = 'solicitud_whatsapp'
      paymentStatus = 'pendiente'
    } else if (paymentMethod === 'transfer') {
      initialStatus = 'transferencia_pendiente'
      paymentStatus = 'pendiente'
    }

    const orderPayload = {
      order_number: orderNum,
      customer_name: customer.name || 'Cliente Web',
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_notes: deliveryNotes,
      delivery_timeframe: deliveryTimeframe,
      total_amount: Math.round(totalAmount),
      currency: 'CLP',
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      status: initialStatus,
      items: items,
      metadata: {
        submitted_via: 'web_checkout',
        user_agent: request.headers.get('user-agent') || null
      },
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .upsert([orderPayload], { onConflict: 'order_number' })
      .select()

    if (error) {
      console.warn('[Orders Create Warning]:', error.message)
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderNum,
      order: data ? data[0] : orderPayload
    })
  } catch (err) {
    console.error('[Orders Create Exception]:', err)
    return NextResponse.json(
      { error: 'Error al registrar orden en el servidor.', details: err.message },
      { status: 500 }
    )
  }
}
