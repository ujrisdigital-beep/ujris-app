import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function requireSession(supabase: SupabaseClient) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { session, response: null }
}
