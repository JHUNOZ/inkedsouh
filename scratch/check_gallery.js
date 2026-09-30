const { createClient } = require('@supabase/supabase-js')

const url = 'https://gxkicpyqhclzpvsyabwq.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4a2ljcHlxaGNsenB2c3lhYndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODcyNDUsImV4cCI6MjEwMDE2MzI0NX0.0LA8cqzjyGMqeqIJNvsnDCJP4VYg8z5t1rUPSSwrzdo'

const supabase = createClient(url, key)

async function run() {
  console.log('--- Checking instagram_cache ---')
  const { data: ig, error: igErr } = await supabase.from('instagram_cache').select('*')
  console.log('instagram_cache:', ig, igErr)

  console.log('--- Checking site_config ---')
  const { data: config, error: cErr } = await supabase.from('site_config').select('*')
  console.log('site_config:', config, cErr)

  console.log('--- Checking site_settings ---')
  const { data: settings, error: sErr } = await supabase.from('site_settings').select('*')
  console.log('site_settings:', settings, sErr)
}

run()
