// API de galería
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Listar imágenes visibles (público)
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener galería' }, { status: 500 })
  }
}

// Subir imagen (admin)
export async function POST(request) {
  try {
    const body = await request.json()
    const supabase = createServerClient()
    const { data, error } = await supabase.from('gallery_images').insert(body).select().single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}
