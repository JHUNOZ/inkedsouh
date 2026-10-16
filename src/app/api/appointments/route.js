// API de Citas y Reservas (Segura & Auditada)
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper de validación de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Sanitizador simple contra XSS
function sanitizeText(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>?/gm, '').trim()
}

function hydrateBookingRow(row) {
  if (!row || typeof row.tattoo_details !== 'string') return row
  const match = row.tattoo_details.match(/<!--BOOKING_META:([\s\S]*?):END_META-->/)
  if (!match) return row
  try {
    const meta = JSON.parse(match[1])
    const cleanDetails = row.tattoo_details.replace(/<!--BOOKING_META:[\s\S]*?:END_META-->/, '').trim()
    return {
      ...row,
      tattoo_details: cleanDetails,
      requested_time: row.requested_time || meta.requested_time || null,
      service_type: row.service_type || meta.service_type || null,
      reference_url: row.reference_url || meta.reference_url || null,
      consent_data: row.consent_data || meta.consent_data || null
    }
  } catch {
    return row
  }
}

// Obtener citas (Solo Administrador Autenticado)
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Verificación de Autenticación
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('requested_date', { ascending: true })

    if (error) throw error
    return NextResponse.json((data || []).map(hydrateBookingRow))
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}

// Crear nueva cita (Público con Validación y Sanitización)
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      client_name, 
      client_email, 
      client_phone, 
      appointment_date, 
      appointment_time, 
      service_type, 
      notes, 
      reference_url,
      consent_data 
    } = body

    // 1. Validaciones básicas
    if (!client_name || !client_email || !client_phone || !appointment_date || !appointment_time || !service_type) {
      return NextResponse.json({ error: 'Todos los campos obligatorios deben estar presentes' }, { status: 400 })
    }

    if (!isValidEmail(client_email)) {
      return NextResponse.json({ error: 'Formato de correo electrónico inválido' }, { status: 400 })
    }

    // 2. Sanitización para prevenir XSS
    const cleanName = sanitizeText(client_name)
    const cleanPhone = sanitizeText(client_phone)
    const cleanService = sanitizeText(service_type)
    const cleanNotes = sanitizeText(notes)
    const cleanRefUrl = reference_url ? sanitizeText(reference_url) : null

    const supabase = createServerClient()

    // 3. Intento de inserción completa
    const fullRow = { 
      client_name: cleanName, 
      client_email: client_email.toLowerCase().trim(), 
      client_phone: cleanPhone, 
      requested_date: appointment_date, 
      requested_time: appointment_time, 
      service_type: cleanService, 
      tattoo_details: cleanNotes,
      reference_url: cleanRefUrl,
      consent_data: consent_data || null,
      status: 'pending'
    }

    let { data, error } = await supabase
      .from('bookings')
      .insert(fullRow)
      .select()
      .single()

    // Fallback automático si la tabla bookings en Supabase sólo tiene las columnas base
    if (error) {
      const metaJson = JSON.stringify({
        requested_time: appointment_time,
        service_type: cleanService,
        reference_url: cleanRefUrl,
        consent_data: consent_data || null
      })
      const fallbackDetails = `${cleanNotes || `[${cleanService} - ${appointment_time} hrs]`}\n<!--BOOKING_META:${metaJson}:END_META-->`

      const fallbackRes = await supabase
        .from('bookings')
        .insert({
          client_name: cleanName,
          client_email: client_email.toLowerCase().trim(),
          client_phone: cleanPhone,
          requested_date: appointment_date,
          tattoo_details: fallbackDetails,
          status: 'pending'
        })
        .select()
        .single()

      data = fallbackRes.data
      error = fallbackRes.error
    }

    // Si bookings falló por RLS o restricción de base de datos, guardar en orders table con tipo booking
    if (error || !data) {
      console.warn('Persistiendo cita en orders como respaldo por RLS en bookings:', error?.message)
      const bookingOrderNumber = `RES-${Date.now()}`
      const orderRecord = {
        order_number: bookingOrderNumber,
        customer_name: cleanName,
        customer_email: client_email.toLowerCase().trim(),
        customer_phone: cleanPhone,
        total_amount: 0,
        currency: 'CLP',
        payment_method: 'cita_directa',
        payment_status: 'pendiente',
        status: 'pendiente',
        items: [{
          name: `Reserva: ${cleanService}`,
          price: 0,
          quantity: 1,
          date: appointment_date,
          time: appointment_time
        }],
        metadata: {
          type: 'booking',
          appointment_date,
          appointment_time,
          service_type: cleanService,
          notes: cleanNotes,
          reference_url: cleanRefUrl,
          consent_data: consent_data || null
        }
      }

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([orderRecord])
        .select()
        .single()

      if (!orderErr && orderData) {
        return NextResponse.json({
          id: orderData.id,
          client_name: cleanName,
          client_email: client_email,
          client_phone: cleanPhone,
          requested_date: appointment_date,
          requested_time: appointment_time,
          service_type: cleanService,
          tattoo_details: cleanNotes,
          reference_url: cleanRefUrl,
          consent_data: consent_data || null,
          status: 'pending',
          is_backup_order: true
        }, { status: 201 })
      }
    }

    if (error) throw error
    return NextResponse.json(hydrateBookingRow(data), { status: 201 })
  } catch (err) {
    console.error('Error al procesar reserva:', err)
    return NextResponse.json({ error: 'Error al procesar la reserva', details: err?.message }, { status: 500 })
  }
}
