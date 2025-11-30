import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { identifier } = await req.json()

    // If it contains @, it's already an email
    if (identifier.includes('@')) {
      return new Response(
        JSON.stringify({ email: identifier }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Otherwise, search for the matricula in tpas table
    const { data: tpa, error } = await supabaseAdmin
      .from('tpas')
      .select('email')
      .eq('matricula', identifier)
      .single()

    if (error || !tpa) {
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ email: tpa.email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

