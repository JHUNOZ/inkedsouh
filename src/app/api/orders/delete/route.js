import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, orderNumber } = body

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Se requiere orderId o orderNumber para eliminar la orden.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    let query = supabase.from('orders').delete()

    if (orderId) {
      query = query.eq('id', orderId)
    } else {
      query = query.eq('order_number', orderNumber)
    }

    const { error } = await query

    if (error) {
      console.error('[Delete Order Error]:', error)
      return NextResponse.json(
        { error: 'Error al eliminar la orden: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Orden eliminada exitosamente'
    })
  } catch (err) {
    console.error('[Delete Order Exception]:', err)
    return NextResponse.json(
      { error: 'Error interno al eliminar la orden.', details: err.message },
      { status: 500 }
    )
  }
}
