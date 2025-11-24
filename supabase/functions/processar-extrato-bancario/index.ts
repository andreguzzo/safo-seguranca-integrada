import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtratoItem {
  cnpj: string;
  valor: number;
  data: string;
  descricao: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ogmoId = formData.get('ogmoId') as string;

    if (!file || !ogmoId) {
      return new Response(
        JSON.stringify({ error: 'Arquivo e OGMO ID são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileContent = await file.text();
    const extrato = parseExtrato(fileContent, file.name);

    console.log(`Processando ${extrato.length} registros do extrato`);

    // Buscar mensalidades pendentes do OGMO
    const { data: mensalidades, error: mensalidadesError } = await supabase
      .from('mensalidades_ogmo')
      .select('*')
      .eq('ogmo_id', ogmoId)
      .in('status', ['pendente', 'atrasado']);

    if (mensalidadesError) {
      throw mensalidadesError;
    }

    let conciliados = 0;
    const conciliacoes: Array<{ mensalidade_id: string; extrato_item: ExtratoItem }> = [];

    // Tentar conciliar cada item do extrato
    for (const item of extrato) {
      const mensalidadeCorrespondente = mensalidades?.find(m => {
        const cnpjMatch = m.cnpj_pagador === item.cnpj;
        const valorMatch = Math.abs(m.valor_total - item.valor) < 0.01;
        return cnpjMatch && valorMatch;
      });

      if (mensalidadeCorrespondente) {
        // Atualizar status da mensalidade
        const { error: updateError } = await supabase
          .from('mensalidades_ogmo')
          .update({
            status: 'pago',
            data_pagamento: item.data,
            observacoes: `Conciliado automaticamente - ${item.descricao}`
          })
          .eq('id', mensalidadeCorrespondente.id);

        if (!updateError) {
          conciliados++;
          conciliacoes.push({
            mensalidade_id: mensalidadeCorrespondente.id,
            extrato_item: item
          });

          // Marcar alertas do OGMO como visualizados
          await supabase
            .from('alertas_operadores')
            .update({ visualizado: true })
            .eq('ogmo_id', ogmoId)
            .eq('visualizado', false);
        }
      }
    }

    // Salvar registro do extrato importado
    const { data: authUser } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    await supabase
      .from('extratos_bancarios')
      .insert({
        nome_arquivo: file.name,
        quantidade_registros: extrato.length,
        quantidade_conciliados: conciliados,
        importado_por: authUser?.user?.id
      });

    console.log(`Conciliação finalizada: ${conciliados} de ${extrato.length} registros`);

    return new Response(
      JSON.stringify({
        success: true,
        total: extrato.length,
        conciliados,
        detalhes: conciliacoes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar extrato:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseExtrato(content: string, filename: string): ExtratoItem[] {
  const items: ExtratoItem[] = [];
  
  // Detectar formato baseado na extensão
  if (filename.toLowerCase().endsWith('.csv')) {
    items.push(...parseCSV(content));
  } else if (filename.toLowerCase().endsWith('.ofx')) {
    items.push(...parseOFX(content));
  }
  
  return items;
}

function parseCSV(content: string): ExtratoItem[] {
  const lines = content.split('\n').filter(line => line.trim());
  const items: ExtratoItem[] = [];
  
  // Assumir formato: Data;Descrição;CNPJ;Valor
  // Pular cabeçalho
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length >= 4) {
      const cnpj = parts[2].trim().replace(/\D/g, ''); // Remover formatação
      const valorStr = parts[3].trim().replace(',', '.');
      const valor = parseFloat(valorStr);
      
      if (cnpj && !isNaN(valor)) {
        items.push({
          data: parseDate(parts[0].trim()),
          descricao: parts[1].trim(),
          cnpj: formatCNPJ(cnpj),
          valor: Math.abs(valor)
        });
      }
    }
  }
  
  return items;
}

function parseOFX(content: string): ExtratoItem[] {
  const items: ExtratoItem[] = [];
  
  // Extrair transações do OFX
  const stmttrxRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  
  while ((match = stmttrxRegex.exec(content)) !== null) {
    const trx = match[1];
    
    const dateMatch = /<DTPOSTED>(\d{8})/i.exec(trx);
    const amountMatch = /<TRNAMT>([-\d.]+)/i.exec(trx);
    const memoMatch = /<MEMO>(.*?)</i.exec(trx);
    
    if (dateMatch && amountMatch && memoMatch) {
      const memo = memoMatch[1];
      const cnpjMatch = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})/i.exec(memo);
      
      if (cnpjMatch) {
        const valor = Math.abs(parseFloat(amountMatch[1]));
        const dateStr = dateMatch[1];
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        
        items.push({
          data: `${year}-${month}-${day}`,
          descricao: memo,
          cnpj: formatCNPJ(cnpjMatch[1].replace(/\D/g, '')),
          valor
        });
      }
    }
  }
  
  return items;
}

function parseDate(dateStr: string): string {
  // Tentar parsear formato DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function formatCNPJ(cnpj: string): string {
  // Formato: 00.000.000/0000-00
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
