// API de citas/reservas
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Obtener citas (admin)
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}

// Crear nueva cita (público)
export async function POST(request) {
  try {
    const body = await request.json()
    const { client_name, client_email, client_phone, appointment_date, appointment_time, service_type, notes, reference_url } = body

    if (!client_name || !client_email || !client_phone || !appointment_date || !appointment_time || !service_type) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('appointments')
      .insert({ 
        client_name, 
        client_email, 
        client_phone, 
        appointment_date, 
        appointment_time, 
        service_type, 
        notes: notes || '',
        reference_url: reference_url || null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 })
  }
}
