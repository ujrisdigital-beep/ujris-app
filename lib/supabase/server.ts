import { createClient } from '@supabase/supabase-js'

export function createSupabaseRouteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey || anonKey === 'YOUR_ANON_KEY_HERE') {
    throw new Error('Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
