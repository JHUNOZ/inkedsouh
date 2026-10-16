// API de Disponibilidad en Tiempo Real (Vice Adaptado para InkedSouh)
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function hydrateBookingRow(row) {
  if (!row || typeof row.tattoo_details !== 'string') return row
  const match = row.tattoo_details.match(/<!--BOOKING_META:([\s\S]*?):END_META-->/)
  if (!match) return row
  try {
    const meta = JSON.parse(match[1])
    return {
      ...row,
      requested_time: row.requested_time || meta.requested_time || null,
      service_type: row.service_type || meta.service_type || null
    }
  } catch {
    return row
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') // YYYY-MM-DD

    const supabase = createServerClient()

    // 1. Obtener reservas existentes para la fecha solicitada
    let bookingsQuery = supabase
      .from('bookings')
      .select('*')
      .in('status', ['pending', 'accepted', 'rescheduled'])

    if (dateStr) {
      bookingsQuery = bookingsQuery.eq('requested_date', dateStr)
    }

    const { data: bookingsData, error: bookingsError } = await bookingsQuery
    if (bookingsError) {
      console.warn('Warning fetching bookings availability:', bookingsError.message)
    }

    const hydratedBookings = (bookingsData || []).map(hydrateBookingRow).map(b => ({
      requested_date: b.requested_date,
      requested_time: b.requested_time || null,
      service_type: b.service_type || null,
      status: b.status
    }))

    // 2. Obtener bloqueos manuales de la agenda creados por InkedSouh
    let blocksData = []
    try {
      let blocksQuery = supabase
        .from('manual_blocks')
        .select('*')

      if (dateStr) {
        blocksQuery = blocksQuery.eq('block_date', dateStr)
      }

      const blocksRes = await blocksQuery
      if (!blocksRes.error && blocksRes.data) {
        blocksData = blocksRes.data
      }
    } catch {
      blocksData = []
    }

    return NextResponse.json({
      bookings: hydratedBookings,
      blocks: blocksData
    })
  } catch (err) {
    console.error('Error fetching availability:', err)
    return NextResponse.json({ bookings: [], blocks: [] }, { status: 200 })
  }
}
