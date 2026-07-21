// API de productos
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Listar productos activos (público)
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// Crear producto (admin)
export async function POST(request) {
  try {
    const body = await request.json()
    const supabase = createServerClient()
    const { data, error } = await supabase.from('products').insert(body).select().single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
