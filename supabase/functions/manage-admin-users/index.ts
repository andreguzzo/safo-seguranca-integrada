import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário é admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      throw new Error('Acesso negado: apenas administradores podem gerenciar usuários');
    }

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // LIST - Listar usuários admin e usuario
    if (method === 'GET' && action === 'list') {
      // Buscar roles de admin e usuario
      const { data: rolesData, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'usuario']);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) {
        return new Response(
          JSON.stringify({ users: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar dados dos usuários
      const { data: { users: authUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

      if (usersError) {
        console.error('Error listing users:', usersError);
        throw usersError;
      }

      // Filtrar e mapear usuários
      const adminUsers = authUsers
        .filter(u => userIds.includes(u.id))
        .map(u => {
          const roleData = rolesData?.find(r => r.user_id === u.id);
          return {
            id: u.id,
            email: u.email || '',
            created_at: u.created_at,
            role: roleData?.role || 'usuario',
          };
        });

      return new Response(
        JSON.stringify({ users: adminUsers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE - Criar novo usuário
    if (method === 'POST' && action === 'create') {
      const body = await req.json();
      const { email, password, role } = body;

      if (!email || !password || !role) {
        throw new Error('Email, senha e role são obrigatórios');
      }

      if (!['admin', 'usuario'].includes(role)) {
        throw new Error('Role inválida');
      }

      // Criar usuário
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Adicionar role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role,
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Tentar deletar o usuário se falhar ao adicionar role
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw roleError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            role: role,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Deletar usuário
    if (method === 'DELETE' && action === 'delete') {
      const body = await req.json();
      const { user_id, user_role } = body;

      if (!user_id) {
        throw new Error('ID do usuário é obrigatório');
      }

      // Não permitir que usuários comuns deletem admins
      if (user_role === 'admin') {
        // Verificar se o usuário atual é admin
        const { data: currentUserRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!currentUserRole) {
          throw new Error('Apenas administradores podem excluir outros administradores');
        }
      }

      // Deletar role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', user_id);

      if (roleError) {
        console.error('Error deleting role:', roleError);
        throw roleError;
      }

      // Deletar usuário
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UPDATE - Atualizar usuário
    if (method === 'PUT' && action === 'update') {
      const body = await req.json();
      const { user_id, email, password, role } = body;

      if (!user_id) {
        throw new Error('ID do usuário é obrigatório');
      }

      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          updateData
        );

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }
      }

      // Atualizar role se fornecida
      if (role && ['admin', 'usuario'].includes(role)) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', user_id);

        if (roleError) {
          console.error('Error updating role:', roleError);
          throw roleError;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Ação inválida');

  } catch (error: any) {
    console.error('Error in manage-admin-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
