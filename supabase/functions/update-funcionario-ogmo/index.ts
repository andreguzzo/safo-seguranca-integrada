import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { user_id, email, nome_completo, cpf } = await req.json()

    console.log('Atualizando funcionário:', { user_id, email, nome_completo, cpf })

    // Atualizar profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nome_completo,
        cpf,
      })
      .eq('id', user_id)

    if (profileError) {
      console.error('Erro ao atualizar profile:', profileError)
      throw profileError
    }

    // Atualizar email no auth.users se fornecido
    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { email }
      )

      if (authError) {
        console.error('Erro ao atualizar email:', authError)
        throw authError
      }
    }

    console.log('Funcionário atualizado com sucesso')

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Erro no update-funcionario-ogmo:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
