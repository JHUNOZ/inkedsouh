import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, orderNumber } = body

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Se requiere orderId o orderNumber para confirmar el pago.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const now = new Date().toISOString()

    let query = supabase.from('orders').update({
      payment_status: 'pagado',
      status: 'completada',
      updated_at: now
    })

    if (orderId) {
      query = query.eq('id', orderId)
    } else {
      query = query.eq('order_number', orderNumber)
    }

    const { data, error } = await query.select()

    if (error) {
      console.error('[Confirm Order Error]:', error)
      return NextResponse.json(
        { error: 'Error al confirmar orden en la base de datos: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      order: data ? data[0] : null
    })
  } catch (err) {
    console.error('[Confirm Order Exception]:', err)
    return NextResponse.json(
      { error: 'Error interno al confirmar pago.', details: err.message },
      { status: 500 }
    )
  }
}
