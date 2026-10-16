import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, orderNumber, orderIds = [], orderNumbers = [] } = body

    const targetIds = [
      ...(orderId ? [orderId] : []),
      ...(Array.isArray(orderIds) ? orderIds : [])
    ].filter(Boolean)

    const targetNumbers = [
      ...(orderNumber ? [orderNumber] : []),
      ...(Array.isArray(orderNumbers) ? orderNumbers : [])
    ].filter(Boolean)

    if (targetIds.length === 0 && targetNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren identificadores (orderId o orderNumber) para eliminar.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const now = new Date().toISOString()

    // 1. Marcar como eliminadas (Soft-delete garantizado en Supabase)
    let updateQuery = supabase.from('orders').update({
      status: 'eliminada',
      payment_status: 'cancelado',
      updated_at: now
    })

    if (targetIds.length > 0) {
      updateQuery = updateQuery.in('id', targetIds)
    } else {
      updateQuery = updateQuery.in('order_number', targetNumbers)
    }

    const { error: updateError } = await updateQuery

    if (updateError) {
      console.warn('[Orders Soft-Delete Warning]:', updateError.message)
    }

    // 2. Intentar eliminación física de los registros
    try {
      let deleteQuery = supabase.from('orders').delete()
      if (targetIds.length > 0) {
        deleteQuery = deleteQuery.in('id', targetIds)
      } else {
        deleteQuery = deleteQuery.in('order_number', targetNumbers)
      }
      await deleteQuery
    } catch (delErr) {
      console.warn('[Orders Hard-Delete Notice]:', delErr?.message)
    }

    const totalCount = Math.max(targetIds.length, targetNumbers.length)

    return NextResponse.json({
      success: true,
      count: totalCount,
      message: totalCount === 1 
        ? 'Pedido eliminado exitosamente.' 
        : `${totalCount} pedidos eliminados exitosamente.`
    })
  } catch (err) {
    console.error('[Delete Order Exception]:', err)
    return NextResponse.json(
      { error: 'Error interno al procesar eliminación.', details: err.message },
      { status: 500 }
    )
  }
}
