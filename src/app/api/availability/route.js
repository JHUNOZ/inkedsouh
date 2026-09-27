// API de Disponibilidad en Tiempo Real (Vice Adaptado para InkedSouh)
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') // YYYY-MM-DD

    const supabase = createServerClient()

    // 1. Obtener reservas existentes para la fecha solicitada
    let bookingsQuery = supabase
      .from('bookings')
      .select('requested_date, requested_time, service_type, status')
      .in('status', ['pending', 'accepted', 'rescheduled'])

    if (dateStr) {
      bookingsQuery = bookingsQuery.eq('requested_date', dateStr)
    }

    const { data: bookingsData, error: bookingsError } = await bookingsQuery
    if (bookingsError) throw bookingsError

    // 2. Obtener bloqueos manuales de la agenda creados por InkedSouh
    let blocksQuery = supabase
      .from('manual_blocks')
      .select('*')

    if (dateStr) {
      blocksQuery = blocksQuery.eq('block_date', dateStr)
    }

    const { data: blocksData, error: blocksError } = await blocksQuery
    if (blocksError) throw blocksError

    return NextResponse.json({
      bookings: bookingsData || [],
      blocks: blocksData || []
    })
  } catch (err) {
    console.error('Error fetching availability:', err)
    return NextResponse.json({ error: 'Error al consultar disponibilidad' }, { status: 500 })
  }
}
