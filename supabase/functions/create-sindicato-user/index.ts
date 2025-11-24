import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar se a requisição vem de um admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Erro de autenticação:", authError);
      throw new Error("Unauthorized");
    }

    // Verificar se o usuário é admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      console.error("Usuário não tem permissão de admin");
      throw new Error("Insufficient permissions");
    }

    const { email, password, profile_data } = await req.json();

    console.log("Criando usuário de sindicato:", email);

    // Criar usuário
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError) {
      console.error("Erro ao criar usuário:", createUserError);
      throw createUserError;
    }

    console.log("Usuário criado:", newUser.user.id);

    // Atribuir role sindicato
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "sindicato",
      });

    if (roleError) {
      console.error("Erro ao atribuir role:", roleError);
      throw roleError;
    }

    console.log("Role sindicato atribuída");

    // Criar profile com os dados fornecidos
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        nome_completo: profile_data.nome_completo,
        Matricula: profile_data.matricula,
      });

    if (profileError) {
      console.error("Erro ao criar profile:", profileError);
      throw profileError;
    }

    console.log("Profile criado com sucesso");

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro geral:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
