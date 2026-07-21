// Cliente Supabase para el servidor (usa service role key, solo en API routes)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key',
    { auth: { persistSession: false } }
  )
}
