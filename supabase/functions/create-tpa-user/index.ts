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

    const { nome, cpf, matricula, email, celular, ogmoId } = await req.json()

    // Password is the CPF by default
    const password = cpf

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Assign TPA role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'trabalhador_avulso'
      })

    if (roleError) throw roleError

    // Insert TPA data
    const { error: tpaError } = await supabaseAdmin
      .from('tpas')
      .insert({
        user_id: authData.user.id,
        ogmo_id: ogmoId,
        nome,
        cpf,
        matricula,
        email,
        celular
      })

    if (tpaError) throw tpaError

    return new Response(
      JSON.stringify({ success: true, userId: authData.user.id }),
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