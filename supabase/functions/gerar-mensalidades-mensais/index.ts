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
    console.log("Iniciando geração de mensalidades mensais");

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

    // Calcular mês de referência (mês atual) e data de vencimento (dia 05)
    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 5);

    console.log("Mês de referência:", mesReferencia.toISOString());
    console.log("Data de vencimento:", dataVencimento.toISOString());

    // Buscar todos os OGMOs ativos (não bloqueados)
    const { data: ogmos, error: ogmosError } = await supabaseAdmin
      .from("ogmos")
      .select("id, nome, cnpj, bloqueado, valor_por_operador");

    if (ogmosError) {
      console.error("Erro ao buscar OGMOs:", ogmosError);
      throw ogmosError;
    }

    console.log(`Encontrados ${ogmos?.length || 0} OGMOs`);

    // Buscar configuração global de valor por operador
    const { data: config, error: configError } = await supabaseAdmin
      .from("configuracoes_financeiras")
      .select("valor_por_operador")
      .single();

    if (configError) {
      console.error("Erro ao buscar configuração:", configError);
      throw configError;
    }

    const valorPadraoGlobal = config.valor_por_operador;
    console.log("Valor padrão global:", valorPadraoGlobal);

    const mensalidadesCriadas = [];
    const erros = [];

    // Processar cada OGMO
    for (const ogmo of ogmos || []) {
      try {
        console.log(`Processando OGMO: ${ogmo.nome} (${ogmo.id})`);

        // Verificar se já existe mensalidade para este mês
        const { data: mensalidadeExistente, error: checkError } = await supabaseAdmin
          .from("mensalidades_ogmo")
          .select("id")
          .eq("ogmo_id", ogmo.id)
          .eq("mes_referencia", mesReferencia.toISOString())
          .maybeSingle();

        if (checkError) {
          console.error(`Erro ao verificar mensalidade existente para ${ogmo.nome}:`, checkError);
          erros.push({ ogmo: ogmo.nome, erro: checkError.message });
          continue;
        }

        if (mensalidadeExistente) {
          console.log(`Mensalidade já existe para ${ogmo.nome} neste mês`);
          continue;
        }

        // Calcular quantidade de operadores faturáveis usando a função do banco
        const { data: quantidadeOperadores, error: countError } = await supabaseAdmin.rpc(
          "count_billable_operators",
          {
            _ogmo_id: ogmo.id,
            _reference_month: mesReferencia.toISOString(),
          }
        );

        if (countError) {
          console.error(`Erro ao contar operadores para ${ogmo.nome}:`, countError);
          erros.push({ ogmo: ogmo.nome, erro: countError.message });
          continue;
        }

        console.log(`Operadores faturáveis para ${ogmo.nome}: ${quantidadeOperadores}`);

        // Usar valor customizado do OGMO ou valor padrão
        const valorPorOperador = ogmo.valor_por_operador || valorPadraoGlobal;
        const valorTotal = quantidadeOperadores * valorPorOperador;

        console.log(`Valor total para ${ogmo.nome}: R$ ${valorTotal.toFixed(2)}`);

        // Criar mensalidade
        const { data: mensalidade, error: insertError } = await supabaseAdmin
          .from("mensalidades_ogmo")
          .insert({
            ogmo_id: ogmo.id,
            mes_referencia: mesReferencia.toISOString(),
            quantidade_operadores: quantidadeOperadores,
            valor_total: valorTotal,
            data_vencimento: dataVencimento.toISOString(),
            status: "pendente",
            cnpj_pagador: ogmo.cnpj,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Erro ao criar mensalidade para ${ogmo.nome}:`, insertError);
          erros.push({ ogmo: ogmo.nome, erro: insertError.message });
          continue;
        }

        console.log(`Mensalidade criada com sucesso para ${ogmo.nome}`);
        mensalidadesCriadas.push({
          ogmo: ogmo.nome,
          cnpj: ogmo.cnpj,
          quantidade_operadores: quantidadeOperadores,
          valor_total: valorTotal,
          mensalidade_id: mensalidade.id,
        });
      } catch (error) {
        console.error(`Erro ao processar OGMO ${ogmo.nome}:`, error);
        erros.push({ 
          ogmo: ogmo.nome, 
          erro: error instanceof Error ? error.message : "Erro desconhecido" 
        });
      }
    }

    console.log("Geração de mensalidades concluída");
    console.log(`Total de mensalidades criadas: ${mensalidadesCriadas.length}`);
    console.log(`Total de erros: ${erros.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        mensalidades_criadas: mensalidadesCriadas.length,
        detalhes: mensalidadesCriadas,
        erros: erros.length > 0 ? erros : undefined,
        mes_referencia: mesReferencia.toISOString(),
        data_vencimento: dataVencimento.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro geral na função:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
