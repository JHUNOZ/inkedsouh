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
      // 3. Update order in Supabase to completada and pagado
      if (order) {
        await supabase
          .from('orders')
          .update({
            status: 'completada',
            payment_status: 'pagado',
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
            const items = Array.isArray(order?.items) ? order.items : (Array.isArray(meta.items) ? meta.items : [])
            const itemsHtml = items.length > 0 
              ? items.map(it => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #2a2a38; color: #ffffff;">${it.name || it.title || 'Producto'}</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #2a2a38; text-align: center; color: #aaaaaa;">x${it.quantity || 1}</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #2a2a38; text-align: right; color: #ffffff; font-weight: bold;">$${new Intl.NumberFormat('es-CL').format((it.price || 0) * (it.quantity || 1))} CLP</td>
                </tr>
              `).join('')
              : `<tr><td colspan="3" style="padding: 10px 0; color: #aaaaaa;">Compra de productos en tienda INKEDSOUH</td></tr>`

            const isExpress = order?.delivery_type === 'santiago' || order?.delivery_type === 'express'
            const deliveryLabel = isExpress ? 'Envío Express Rancagua & RM' : 'Envío a Regiones (Starken por pagar)'

            await resend.emails.send({
              from: 'INKEDSOUH Studio <contacto@inkedsouh.com>',
              to: [targetEmail],
              subject: meta.type === 'course' 
                ? '¡Bienvenido a tu Curso en INKEDSOUH! - Pago Confirmado' 
                : `¡Pago Confirmado! Detalle de tu Orden #${orderNumber} - INKEDSOUH`,
              html: `
                <div style="font-family: Arial, sans-serif; background-color: #0b0b10; color: #ffffff; padding: 40px 20px; text-align: center;">
                  <div style="max-width: 600px; margin: 0 auto; background: #14141c; border: 1px solid #282838; border-radius: 14px; padding: 32px; text-align: left;">
                    <div style="text-align: center; margin-bottom: 25px;">
                      <h1 style="color: #e11d48; margin: 0; font-size: 28px; letter-spacing: 2px;">INKEDSOUH</h1>
                      <p style="color: #94a3b8; margin-top: 5px; font-size: 13px; letter-spacing: 1px;">TATTOO STUDIO & TATTOO SUPPLIES</p>
                    </div>
                    
                    <div style="background: rgba(34, 197, 94, 0.12); border: 1px solid #22c55e; border-radius: 10px; padding: 14px; margin-bottom: 24px; text-align: center;">
                      <h2 style="color: #22c55e; margin: 0; font-size: 17px;">✓ ¡Pago Exitoso Aprobado con Webpay!</h2>
                      <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">Tu pedido ha sido completado y registrado exitosamente.</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
                      Hola <strong>${order?.customer_name || 'Estimado(a)'}</strong>, confirmamos la recepción de tu pago por <strong>$${new Intl.NumberFormat('es-CL').format(statusData.amount)} CLP</strong>.
                    </p>

                    <div style="background: #09090d; border: 1px solid #232330; border-radius: 10px; padding: 18px; margin: 20px 0;">
                      <p style="margin: 4px 0; color: #94a3b8; font-size: 13px;"><strong>N° de Orden:</strong> #${orderNumber}</p>
                      <p style="margin: 4px 0; color: #94a3b8; font-size: 13px;"><strong>N° Flow:</strong> ${statusData.flowOrder || 'N/A'}</p>
                      <p style="margin: 4px 0; color: #94a3b8; font-size: 13px;"><strong>Medio de Pago:</strong> ${statusData.paymentData?.media || 'Webpay / Flow'}</p>
                      <p style="margin: 4px 0; color: #94a3b8; font-size: 13px;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
                      ${order?.delivery_address ? `<p style="margin: 4px 0; color: #94a3b8; font-size: 13px;"><strong>Dirección de Entrega:</strong> ${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ''}</p>` : ''}
                      <p style="margin: 4px 0; color: #94a3b8; font-size: 13px;"><strong>Tipo de Entrega:</strong> ${deliveryLabel}</p>
                    </div>

                    ${meta.type === 'course' ? `
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://inkedsouh.com'}/estudiante" style="display: inline-block; background: #e11d48; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                          Acceder a mi Aula Virtual
                        </a>
                      </div>
                    ` : `
                      <h3 style="color: #ffffff; font-size: 15px; margin: 20px 0 10px 0; border-bottom: 1px solid #282838; padding-bottom: 8px;">
                        Detalle de los Productos Comprados:
                      </h3>
                      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>
                      <div style="margin-top: 24px; padding: 14px; background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.25); border-radius: 8px;">
                        <p style="margin: 0; color: #fecdd3; font-size: 13px; line-height: 1.5;">
                          📦 <strong>Preparación de Despacho:</strong> Tu pedido está siendo preparado desde nuestro estudio en Rancagua. Te enviaremos tu código de seguimiento por correo y WhatsApp apenas sea entregado al transportista.
                        </p>
                      </div>
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
