import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Download, FileSpreadsheet } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Ogmo {
  id: string;
  nome: string;
  cnpj: string;
}

interface RelatorioData {
  ogmo_nome: string;
  ogmo_cnpj: string;
  mes_referencia: string;
  quantidade_operadores: number;
  valor_total: number;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
  nf_emitida: boolean;
}

export default function RelatoriosFinanceiros() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ogmos, setOgmos] = useState<Ogmo[]>([]);
  const [tipoRelatorio, setTipoRelatorio] = useState<"geral" | "individual">("geral");
  const [ogmoSelecionado, setOgmoSelecionado] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  useEffect(() => {
    checkAuth();
    fetchOgmos();
    setDefaultDates();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (!roles || roles.role !== "admin") {
      navigate("/login");
    }
  };

  const setDefaultDates = () => {
    const hoje = new Date();
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(hoje.getMonth() - 6);
    
    setDataInicio(seisMesesAtras.toISOString().split("T")[0]);
    setDataFim(hoje.toISOString().split("T")[0]);
  };

  const fetchOgmos = async () => {
    const { data, error } = await supabase
      .from("ogmos")
      .select("id, nome, cnpj")
      .order("nome");

    if (!error && data) {
      setOgmos(data);
    }
  };

  const fetchRelatorioData = async (): Promise<RelatorioData[]> => {
    let query = supabase
      .from("mensalidades_ogmo")
      .select(`
        *,
        ogmos!inner(nome, cnpj)
      `)
      .gte("mes_referencia", dataInicio)
      .lte("mes_referencia", dataFim)
      .order("mes_referencia", { ascending: false });

    if (tipoRelatorio === "individual" && ogmoSelecionado) {
      query = query.eq("ogmo_id", ogmoSelecionado);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map((m: any) => ({
      ogmo_nome: m.ogmos.nome,
      ogmo_cnpj: m.ogmos.cnpj,
      mes_referencia: m.mes_referencia,
      quantidade_operadores: m.quantidade_operadores,
      valor_total: m.valor_total,
      status: m.status,
      data_vencimento: m.data_vencimento,
      data_pagamento: m.data_pagamento,
      nf_emitida: m.nf_emitida,
    }));
  };

  const gerarRelatorioPDF = async () => {
    setLoading(true);
    try {
      const dados = await fetchRelatorioData();
      
      if (dados.length === 0) {
        toast({
          title: "Sem dados",
          description: "Não há dados para o período selecionado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório Financeiro - SAFO", 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Tipo: ${tipoRelatorio === "geral" ? "Geral" : "Individual"}`, 14, 28);
      doc.text(`Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}`, 14, 33);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 38);

      // Resumo
      const totalPrevisto = dados.reduce((acc, d) => acc + d.valor_total, 0);
      const totalPago = dados.filter(d => d.status === "pago").reduce((acc, d) => acc + d.valor_total, 0);
      const totalPendente = totalPrevisto - totalPago;

      doc.setFontSize(12);
      doc.text("Resumo Financeiro", 14, 48);
      doc.setFontSize(10);
      doc.text(`Total Previsto: R$ ${totalPrevisto.toFixed(2)}`, 14, 55);
      doc.text(`Total Pago: R$ ${totalPago.toFixed(2)}`, 14, 60);
      doc.text(`Total Pendente: R$ ${totalPendente.toFixed(2)}`, 14, 65);

      // Tabela de dados
      const tableData = dados.map(d => [
        d.ogmo_nome,
        d.ogmo_cnpj,
        new Date(d.mes_referencia).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
        d.quantidade_operadores.toString(),
        `R$ ${d.valor_total.toFixed(2)}`,
        d.status === "pago" ? "Pago" : "Pendente",
        new Date(d.data_vencimento).toLocaleDateString("pt-BR"),
        d.data_pagamento ? new Date(d.data_pagamento).toLocaleDateString("pt-BR") : "-",
        d.nf_emitida ? "Sim" : "Não",
      ]);

      autoTable(doc, {
        startY: 75,
        head: [["OGMO", "CNPJ", "Mês/Ano", "Ops", "Valor", "Status", "Vencto", "Pagto", "NF"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`relatorio-financeiro-${new Date().getTime()}.pdf`);
      
      toast({
        title: "Relatório gerado",
        description: "PDF baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioExcel = async () => {
    setLoading(true);
    try {
      const dados = await fetchRelatorioData();
      
      if (dados.length === 0) {
        toast({
          title: "Sem dados",
          description: "Não há dados para o período selecionado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Criar workbook
      const wb = XLSX.utils.book_new();

      // Informações do relatório
      const infoData = [
        ["Relatório Financeiro - SAFO"],
        [`Tipo: ${tipoRelatorio === "geral" ? "Geral" : "Individual"}`],
        [`Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}`],
        [`Data de Geração: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`],
        [],
        ["Resumo Financeiro"],
        ["Total Previsto", `R$ ${dados.reduce((acc, d) => acc + d.valor_total, 0).toFixed(2)}`],
        ["Total Pago", `R$ ${dados.filter(d => d.status === "pago").reduce((acc, d) => acc + d.valor_total, 0).toFixed(2)}`],
        ["Total Pendente", `R$ ${(dados.reduce((acc, d) => acc + d.valor_total, 0) - dados.filter(d => d.status === "pago").reduce((acc, d) => acc + d.valor_total, 0)).toFixed(2)}`],
        [],
      ];

      // Dados detalhados
      const detalhesData = [
        ["OGMO", "CNPJ", "Mês/Ano", "Operadores", "Valor Total", "Status", "Vencimento", "Pagamento", "NF Emitida"],
        ...dados.map(d => [
          d.ogmo_nome,
          d.ogmo_cnpj,
          new Date(d.mes_referencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
          d.quantidade_operadores,
          d.valor_total,
          d.status === "pago" ? "Pago" : "Pendente",
          new Date(d.data_vencimento).toLocaleDateString("pt-BR"),
          d.data_pagamento ? new Date(d.data_pagamento).toLocaleDateString("pt-BR") : "-",
          d.nf_emitida ? "Sim" : "Não",
        ]),
      ];

      // Combinar dados
      const fullData = [...infoData, ...detalhesData];

      const ws = XLSX.utils.aoa_to_sheet(fullData);

      // Ajustar largura das colunas
      ws["!cols"] = [
        { wch: 25 }, // OGMO
        { wch: 20 }, // CNPJ
        { wch: 15 }, // Mês/Ano
        { wch: 12 }, // Operadores
        { wch: 15 }, // Valor Total
        { wch: 12 }, // Status
        { wch: 15 }, // Vencimento
        { wch: 15 }, // Pagamento
        { wch: 12 }, // NF Emitida
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Relatório Financeiro");

      // Salvar arquivo
      XLSX.writeFile(wb, `relatorio-financeiro-${new Date().getTime()}.xlsx`);
      
      toast({
        title: "Relatório gerado",
        description: "Excel baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/financeiro")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground mt-2">
            Gere relatórios personalizados em PDF ou Excel
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração do Relatório</CardTitle>
            <CardDescription>
              Selecione as opções desejadas e escolha o formato de exportação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Relatório */}
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as "geral" | "individual")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral (Todos os OGMOs)</SelectItem>
                  <SelectItem value="individual">Individual (OGMO Específico)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* OGMO (apenas se individual) */}
            {tipoRelatorio === "individual" && (
              <div className="space-y-2">
                <Label>Selecione o OGMO</Label>
                <Select value={ogmoSelecionado} onValueChange={setOgmoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um OGMO" />
                  </SelectTrigger>
                  <SelectContent>
                    {ogmos.map((ogmo) => (
                      <SelectItem key={ogmo.id} value={ogmo.id}>
                        {ogmo.nome} - {ogmo.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={gerarRelatorioPDF}
                disabled={loading || (tipoRelatorio === "individual" && !ogmoSelecionado)}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                {loading ? "Gerando..." : "Exportar como PDF"}
              </Button>
              <Button
                onClick={gerarRelatorioExcel}
                disabled={loading || (tipoRelatorio === "individual" && !ogmoSelecionado)}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {loading ? "Gerando..." : "Exportar como Excel"}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Conteúdo do relatório:</strong>
                <br />
                • Resumo financeiro (receita prevista, paga e pendente)
                <br />
                • Lista detalhada de mensalidades por OGMO
                <br />
                • Status de pagamento e emissão de NF
                <br />
                • Informações de vencimento e pagamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
