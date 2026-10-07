import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createFlowOrder } from '@/lib/flow'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      type = 'product', // 'product' | 'course' | 'deposit'
      amount,
      orderNumber,
      customer = {},
      items = [],
      courseId = null,
      userId = null,
      courseTitle = '',
      deliveryType = 'santiago',
      deliveryAddress = '',
      deliveryCity = 'Santiago',
      deliveryNotes = '',
      deliveryTimeframe = '24 a 48 horas hábiles en RM y 2 a 4 días hábiles a Regiones'
    } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'El monto a pagar debe ser mayor a 0 CLP.' },
        { status: 400 }
      )
    }

    if (!customer.email || !customer.email.includes('@')) {
      return NextResponse.json(
        { error: 'Debes proporcionar un correo electrónico válido.' },
        { status: 400 }
      )
    }

    const orderNum = orderNumber || (type === 'course' 
      ? `CUR-${Math.floor(100000 + Math.random() * 900000)}`
      : `INK-${Math.floor(100000 + Math.random() * 900000)}`)

    const supabase = createServerClient()

    // 1. Subject description for Flow payment gateway screen
    let subject = 'Compra en INKEDSOUH Tattoo Studio'
    if (type === 'course') {
      subject = `Curso: ${courseTitle || 'Masterclass de Tatuaje'}`
    } else if (items.length > 0) {
      subject = `Pedido ${orderNum}: ${items[0]?.name || 'Insumos de Tatuaje'}${items.length > 1 ? ` (+${items.length - 1} más)` : ''}`
    }

    // 2. Register order record in Supabase
    const orderRecord = {
      order_number: orderNum,
      customer_name: customer.name || 'Cliente Web',
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_notes: deliveryNotes,
      delivery_timeframe: deliveryTimeframe,
      total_amount: Math.round(Number(amount)),
      currency: 'CLP',
      payment_method: 'flow',
      payment_status: 'pendiente',
      status: 'pendiente_pago',
      items: items.length > 0 ? items : (type === 'course' ? [{ id: courseId, name: courseTitle, price: amount, quantity: 1 }] : []),
      metadata: {
        type,
        courseId,
        userId,
        courseTitle
      },
      created_at: new Date().toISOString()
    }

    try {
      await supabase.from('orders').upsert([orderRecord], { onConflict: 'order_number' })
    } catch (dbErr) {
      console.warn('[Flow Create] Aviso al guardar orden en BD:', dbErr?.message)
    }

    // 3. Initiate payment request in Flow
    const flowResult = await createFlowOrder({
      orderNumber: orderNum,
      amount: Math.round(Number(amount)),
      email: customer.email,
      subject,
      optional: {
        orderNumber: orderNum,
        type,
        courseId,
        userId,
        customerName: customer.name
      }
    })

    // 4. Update order with Flow token
    if (flowResult?.token) {
      try {
        await supabase.from('orders').update({
          metadata: {
            ...orderRecord.metadata,
            flow_token: flowResult.token,
            flow_order: flowResult.flowOrder,
            flow_mode: flowResult.mode
          }
        }).eq('order_number', orderNum)
      } catch (err) {
        console.warn('[Flow Create] Error actualizando token en BD:', err?.message)
      }
    }

    return NextResponse.json({
      success: true,
      mode: flowResult.mode,
      orderNumber: orderNum,
      token: flowResult.token,
      flowOrder: flowResult.flowOrder,
      redirectUrl: flowResult.redirectUrl,
      warning: flowResult.warning || null
    })

  } catch (error) {
    console.error('[Flow API Create Payment Exception]:', error)
    return NextResponse.json(
      { error: 'Error al generar la orden de pago en Flow.', details: error.message },
      { status: 500 }
    )
  }
}
