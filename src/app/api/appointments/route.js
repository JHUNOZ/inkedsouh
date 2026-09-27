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
    return NextResponse.json(data)
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

    // 3. Inserción con cliente parametrizado de Supabase (Inmune a SQL Injection)
    const { data, error } = await supabase
      .from('bookings')
      .insert({ 
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
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Error al procesar reserva:', err)
    return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 })
  }
}
