import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxkicpyqhclzpvsyabwq.supabase.co'
const supabaseKey = 'sb_publishable_0OcwuTusRX_6NjVDmzBfnw_0OTzFZDQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function signUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'junomaemaul@gmail.com',
    password: 'admin1202.',
  })

  if (error) {
    console.error('Error signing up:', error.message)
  } else {
    console.log('Signup successful!', data.user?.email)
  }
}

signUp()
