// API de Bloqueos Manuales de Agenda (Vice Feature para InkedSouh)
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Obtener bloqueos manuales
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('manual_blocks')
      .select('*')
      .order('block_date', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener bloqueos' }, { status: 500 })
  }
}

// Crear bloqueo manual (Solo Admin)
export async function POST(request) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { block_date, start_time, end_time, reason } = body

    if (!block_date) {
      return NextResponse.json({ error: 'La fecha de bloqueo es requerida' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('manual_blocks')
      .insert({
        block_date,
        start_time: start_time || null,
        end_time: end_time || null,
        reason: reason || 'No disponible'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear bloqueo' }, { status: 500 })
  }
}

// Eliminar bloqueo manual (Solo Admin)
export async function DELETE(request) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de bloqueo requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('manual_blocks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar bloqueo' }, { status: 500 })
  }
}
