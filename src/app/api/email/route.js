// API de correos automáticos con Resend
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key')
    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'INKEDSOUH <noreply@inkedsouh.cl>',
      to,
      subject,
      html
    })

    if (error) throw error
    return NextResponse.json({ message: 'Email enviado', id: data.id })
  } catch (err) {
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }
}
