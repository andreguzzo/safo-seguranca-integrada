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

    const { tpaId } = await req.json()

    // Get TPA data to get CPF (which is the default password)
    const { data: tpa, error: tpaError } = await supabaseAdmin
      .from('tpas')
      .select('cpf, user_id')
      .eq('id', tpaId)
      .single()

    if (tpaError || !tpa) throw new Error('TPA not found')

    // Reset password to CPF
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tpa.user_id,
      { password: tpa.cpf }
    )

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true }),
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