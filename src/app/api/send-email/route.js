import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key')
    const body = await req.json()
    const { type, booking } = body

    if (!booking || !booking.client_email) {
      return NextResponse.json({ error: 'Faltan datos de la reserva' }, { status: 400 })
    }

    let subject = ''
    let html = ''

    if (type === 'accepted') {
      subject = '¡Tu reserva ha sido confirmada! - INKEDSOUH'
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2>Hola ${booking.client_name},</h2>
          <p>Nos complace informarte que tu cita para tatuaje ha sido <strong>aceptada</strong>.</p>
          <p><strong>Fecha programada:</strong> ${new Date(booking.requested_date).toLocaleDateString()}</p>
          <p>Te esperamos pronto. Si tienes alguna duda, responde a este correo.</p>
          <p>Saludos,<br>Equipo INKEDSOUH</p>
        </div>
      `
    } else if (type === 'rejected') {
      subject = 'Actualización sobre tu reserva - INKEDSOUH'
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2>Hola ${booking.client_name},</h2>
          <p>Lamentamos informarte que en este momento no podemos agendar tu cita.</p>
          <p>Por favor, mantente atento a nuestras redes sociales para próximas disponibilidades.</p>
          <p>Saludos,<br>Equipo INKEDSOUH</p>
        </div>
      `
    } else if (type === 'rescheduled') {
      subject = 'Propuesta de Reprogramación de Cita - INKEDSOUH'
      html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2>Hola ${booking.client_name},</h2>
          <p>Tenemos que hacer un ajuste en tu solicitud de reserva.</p>
          <p><strong>Nuestra propuesta de nueva fecha es:</strong> ${new Date(booking.requested_date).toLocaleDateString()}</p>
          <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <strong>Motivo:</strong><br>
            ${booking.reschedule_reason}
          </div>
          <p>Por favor, contesta este correo para confirmar si estás de acuerdo con la nueva fecha o si deseas coordinar otra.</p>
          <p>Saludos,<br>Equipo INKEDSOUH</p>
        </div>
      `
    } else {
      return NextResponse.json({ error: 'Tipo de correo no válido' }, { status: 400 })
    }

    const data = await resend.emails.send({
      from: 'INKEDSOUH Reservas <reservas@inkedsouh.com>', // Configurar dominio en Resend
      to: [booking.client_email],
      subject,
      html,
    })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
