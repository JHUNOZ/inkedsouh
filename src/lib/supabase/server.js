// Cliente Supabase para el servidor (usa service role key, solo en API routes)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasRealServiceKey = serviceKey && serviceKey !== 'tu_service_role_key' && serviceKey !== 'dummy_key'
  const keyToUse = hasRealServiceKey 
    ? serviceKey 
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key')

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    keyToUse,
    { auth: { persistSession: false } }
  )
}
