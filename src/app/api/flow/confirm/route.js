import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getFlowPaymentStatus } from '@/lib/flow'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    let token = ''

    // Flow sends token via POST form-data or JSON
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      token = formData.get('token')
    } else {
      try {
        const body = await request.json()
        token = body.token
      } catch {
        const text = await request.text()
        const params = new URLSearchParams(text)
        token = params.get('token')
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Token no recibido' }, { status: 400 })
    }

    // 1. Verify payment status directly with Flow API
    const statusData = await getFlowPaymentStatus(token)

    if (!statusData.success) {
      console.error('[Flow Webhook] Error al verificar estado:', statusData.error)
      return NextResponse.json({ error: 'Error verificando estado en Flow' }, { status: 500 })
    }

    const orderNumber = statusData.commerceOrder
    const isPaid = statusData.isPaid // status === 2

    const supabase = createServerClient()

    // 2. Fetch order from Supabase
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .maybeSingle()

    const meta = order?.metadata || statusData.optional || {}

    if (isPaid) {
      // 3. Update order in Supabase
      if (order) {
        await supabase
          .from('orders')
          .update({
            status: meta.type === 'course' ? 'inscrito_pagado' : 'pagado',
            payment_status: 'aprobado',
            metadata: {
              ...meta,
              flow_status: statusData.statusName,
              flow_order: statusData.flowOrder,
              flow_payment_data: statusData.paymentData,
              paid_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('order_number', orderNumber)
      }

      // 4. If this is a course purchase, enroll student in database
      if (meta.type === 'course' && meta.courseId) {
        try {
          const studentPayload = {
            user_id: meta.userId || null,
            course_id: meta.courseId,
            name: order?.customer_name || meta.customerName || 'Estudiante',
            email: order?.customer_email || statusData.payerEmail,
            status: 'activo',
            enrolled_at: new Date().toISOString()
          }

          await supabase
            .from('students')
            .upsert([studentPayload], { onConflict: 'user_id,course_id' })
        } catch (studentErr) {
          console.error('[Flow Webhook] Error matriculando estudiante:', studentErr)
        }
      }

      // 5. Send notification email via Resend if configured
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey && !resendApiKey.includes('tu_resend')) {
        try {
          const resend = new Resend(resendApiKey)
          const targetEmail = order?.customer_email || statusData.payerEmail
          
          if (targetEmail) {
            await resend.emails.send({
              from: 'INKEDSOUH Studio <contacto@inkedsouh.com>',
              to: [targetEmail],
              subject: meta.type === 'course' 
                ? '¡Bienvenido a tu Curso en INKEDSOUH! - Pago Confirmado' 
                : `Comprobante de Pago Orden #${orderNumber} - INKEDSOUH`,
              html: `
                <div style="font-family: Arial, sans-serif; background-color: #0d0d11; color: #ffffff; padding: 40px 20px; text-align: center;">
                  <div style="max-width: 600px; margin: 0 auto; background: #16161f; border: 1px solid #2a2a38; border-radius: 12px; padding: 30px; text-align: left;">
                    <div style="text-align: center; margin-bottom: 25px;">
                      <h1 style="color: #ff2a3d; margin: 0; font-size: 28px; letter-spacing: 2px;">INKEDSOUH</h1>
                      <p style="color: #888899; margin-top: 5px; font-size: 14px;">TATTOO STUDIO & ACADEMY</p>
                    </div>
                    
                    <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid #4ade80; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center;">
                      <h2 style="color: #4ade80; margin: 0; font-size: 18px;">✓ ¡Pago Exitoso Aprobado por Flow!</h2>
                    </div>

                    <p style="font-size: 16px; line-height: 1.6; color: #dddddd;">
                      Hola <strong>${order?.customer_name || 'Estimado(a)'}</strong>, tu pago por <strong>$${new Intl.NumberFormat('es-CL').format(statusData.amount)} CLP</strong> ha sido verificado con éxito.
                    </p>

                    <div style="background: #0d0d11; border-radius: 8px; padding: 18px; margin: 20px 0;">
                      <p style="margin: 5px 0; color: #aaaaaa; font-size: 14px;"><strong>N° de Orden:</strong> ${orderNumber}</p>
                      <p style="margin: 5px 0; color: #aaaaaa; font-size: 14px;"><strong>N° Flow:</strong> ${statusData.flowOrder || 'N/A'}</p>
                      <p style="margin: 5px 0; color: #aaaaaa; font-size: 14px;"><strong>Medio de Pago:</strong> ${statusData.paymentData?.media || 'Flow Webpay'}</p>
                      <p style="margin: 5px 0; color: #aaaaaa; font-size: 14px;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
                    </div>

                    ${meta.type === 'course' ? `
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://inkedsouh.com'}/estudiante" style="display: inline-block; background: #ff2a3d; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                          Acceder a mi Aula Virtual
                        </a>
                      </div>
                    ` : `
                      <p style="color: #aaaaaa; font-size: 14px; line-height: 1.6;">
                        Estamos preparando tu despacho. Te enviaremos el número de seguimiento apenas sea despachado.
                      </p>
                    `}
                  </div>
                </div>
              `
            })
          }
        } catch (emailErr) {
          console.warn('[Flow Webhook] Aviso enviando correo:', emailErr?.message)
        }
      }
    } else {
      // Payment failed or rejected
      if (order) {
        await supabase
          .from('orders')
          .update({
            payment_status: statusData.status === 3 ? 'rechazado' : 'cancelado',
            status: statusData.status === 3 ? 'pago_rechazado' : 'anulado',
            metadata: {
              ...meta,
              flow_status: statusData.statusName
            },
            updated_at: new Date().toISOString()
          })
          .eq('order_number', orderNumber)
      }
    }

    return NextResponse.json({ success: true, orderNumber, status: statusData.statusName })
  } catch (err) {
    console.error('[Flow Webhook Exception]:', err)
    return NextResponse.json({ error: 'Error procesando webhook de Flow' }, { status: 500 })
  }
}
