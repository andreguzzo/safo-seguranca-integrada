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

    const { ogmo_id } = await req.json()

    console.log('Buscando funcionários do OGMO:', ogmo_id)

    // Buscar profiles
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('ogmo_id', ogmo_id)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Erro ao buscar profiles:', profilesError)
      throw profilesError
    }

    // Buscar emails dos usuários
    const userIds = (profilesData || []).map((p: any) => p.id)
    const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers()
    
    const emailsMap = new Map(
      authUsersData.users
        .filter((u: any) => userIds.includes(u.id))
        .map((u: any) => [u.id, u.email])
    )

    // Buscar perfis dos usuários
    const { data: usuarioPerfisData, error: usuarioPerfisError } = await supabaseAdmin
      .from('usuario_perfis')
      .select('user_id, perfil_id, perfis_usuario(nome)')

    if (usuarioPerfisError) {
      console.error('Erro ao buscar perfis:', usuarioPerfisError)
      throw usuarioPerfisError
    }

    // Criar um mapa de user_id para perfis
    const perfisMap = new Map()
    ;(usuarioPerfisData || []).forEach((up: any) => {
      const perfis = perfisMap.get(up.user_id) || []
      perfis.push(up.perfis_usuario.nome)
      perfisMap.set(up.user_id, perfis)
    })

    // Combinar dados
    const funcionarios = (profilesData || []).map((func: any) => ({
      ...func,
      email: emailsMap.get(func.id) || null,
      perfis: perfisMap.get(func.id) || [],
    }))

    console.log('Funcionários encontrados:', funcionarios.length)

    return new Response(
      JSON.stringify({ funcionarios }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Erro no get-funcionarios-ogmo:', error)
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
