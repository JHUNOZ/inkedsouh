// API de autenticación (login) con medidas de seguridad OWASP
import { NextResponse } from 'next/server'
import { createSSRSupabaseClient } from '@/lib/supabase/ssr'

// Función simple de delay para mitigar ataques de fuerza bruta / enumeración (OWASP A04)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // 1. Prevención de Inyecciones y Validación Estricta (OWASP A03)
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
    }
    
    if (!password || typeof password !== 'string' || password.length > 100) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // 2. Uso de cliente SSR para guardar la sesión en Cookies HttpOnly Seguras (OWASP A07)
    const supabase = await createSSRSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // 3. Mitigación contra fuerza bruta: Añadir un retraso aleatorio (1-2s) en intentos fallidos
      await delay(Math.floor(Math.random() * 1000) + 1000)
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // Retornamos éxito. La cookie HTTPOnly ya fue seteada por createSSRSupabaseClient.
    return NextResponse.json({ success: true, user: data.user.id })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
