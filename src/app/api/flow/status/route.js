import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getFlowPaymentStatus } from '@/lib/flow'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const orderNumber = searchParams.get('order')

    if (!token && !orderNumber) {
      return NextResponse.json({ error: 'Parámetro token u order es requerido' }, { status: 400 })
    }

    const supabase = createServerClient()

    // 1. If we have a token, check directly with Flow API
    if (token) {
      const flowStatus = await getFlowPaymentStatus(token)
      
      // Also fetch matching order from Supabase
      let order = null
      if (flowStatus.commerceOrder) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', flowStatus.commerceOrder)
          .maybeSingle()
        order = data

        // If Flow confirms payment and order isn't updated yet, sync it immediately
        if (flowStatus.isPaid && order && order.payment_status !== 'aprobado') {
          const meta = order.metadata || flowStatus.optional || {}
          const { data: updatedOrder } = await supabase
            .from('orders')
            .update({
              status: meta.type === 'course' ? 'inscrito_pagado' : 'pagado',
              payment_status: 'aprobado',
              metadata: {
                ...meta,
                flow_status: flowStatus.statusName,
                flow_order: flowStatus.flowOrder,
                flow_payment_data: flowStatus.paymentData,
                paid_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('order_number', flowStatus.commerceOrder)
            .select('*')
            .maybeSingle()

          if (updatedOrder) order = updatedOrder

          if (meta.type === 'course' && meta.courseId) {
            await supabase
              .from('students')
              .upsert([{
                user_id: meta.userId || null,
                course_id: meta.courseId,
                name: order.customer_name || meta.customerName || 'Estudiante',
                email: order.customer_email || flowStatus.payerEmail,
                status: 'activo',
                enrolled_at: new Date().toISOString()
              }], { onConflict: 'user_id,course_id' })
              .catch(() => {})
          }
        }
      }

      return NextResponse.json({
        success: true,
        flow: flowStatus,
        order: order || null,
        isPaid: flowStatus.isPaid || order?.payment_status === 'aprobado'
      })
    }

    // 2. Query by order number
    if (orderNumber) {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        order: order || null,
        isPaid: order?.payment_status === 'aprobado'
      })
    }

    return NextResponse.json({ error: 'No se encontraron datos' }, { status: 404 })
  } catch (error) {
    console.error('[Flow Status Exception]:', error)
    return NextResponse.json({ error: 'Error al consultar estado', details: error.message }, { status: 500 })
  }
}
