import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, FileUp, Settings, ArrowLeft, BarChart3, LogOut } from "lucide-react";
import safoLogo from "@/assets/safo-logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OgmoFinanceiro {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  bloqueado: boolean;
  quantidade_operadores: number;
  ultima_mensalidade?: {
    status: string;
    dias_atraso: number;
    valor_total: number;
  };
}

export default function FinanceiroAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ogmos, setOgmos] = useState<OgmoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [valorPorOperador, setValorPorOperador] = useState<number>(50);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchConfig();
    fetchOgmos();
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

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from("configuracoes_financeiras")
      .select("valor_por_operador")
      .single();

    if (data && !error) {
      setValorPorOperador(data.valor_por_operador);
    }
  };

  const fetchOgmos = async () => {
    setLoading(true);
    
    // Buscar todos os OGMOs
    const { data: ogmosData, error: ogmosError } = await supabase
      .from("ogmos")
      .select("*")
      .order("nome");

    if (ogmosError) {
      toast({
        title: "Erro ao carregar OGMOs",
        description: ogmosError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Para cada OGMO, buscar quantidade de operadores e última mensalidade
    const ogmosComDados = await Promise.all(
      (ogmosData || []).map(async (ogmo) => {
        // Contar operadores
        const { count } = await supabase
          .from("operadores_portuarios")
          .select("*", { count: "exact", head: true })
          .eq("ogmo_id", ogmo.id);

        // Buscar última mensalidade
        const { data: mensalidade } = await supabase
          .from("mensalidades_ogmo")
          .select("*")
          .eq("ogmo_id", ogmo.id)
          .order("mes_referencia", { ascending: false })
          .limit(1)
          .single();

        let diasAtraso = 0;
        if (mensalidade && mensalidade.status !== "pago") {
          const vencimento = new Date(mensalidade.data_vencimento);
          const hoje = new Date();
          diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          id: ogmo.id,
          nome: ogmo.nome,
          cnpj: ogmo.cnpj,
          telefone: ogmo.telefone,
          bloqueado: ogmo.bloqueado,
          quantidade_operadores: count || 0,
          ultima_mensalidade: mensalidade ? {
            status: mensalidade.status,
            dias_atraso: diasAtraso,
            valor_total: mensalidade.valor_total,
          } : undefined,
        };
      })
    );

    setOgmos(ogmosComDados);
    setLoading(false);
  };

  const handleUpdateConfig = async () => {
    const { error } = await supabase
      .from("configuracoes_financeiras")
      .update({ valor_por_operador: valorPorOperador })
      .eq("id", (await supabase.from("configuracoes_financeiras").select("id").single()).data?.id);

    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configuração atualizada",
        description: "Valor por operador atualizado com sucesso",
      });
      setShowConfig(false);
      fetchOgmos();
    }
  };

  const getStatusBadge = (ogmo: OgmoFinanceiro) => {
    if (ogmo.bloqueado) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    
    if (!ogmo.ultima_mensalidade) {
      return <Badge variant="secondary">Sem mensalidades</Badge>;
    }

    if (ogmo.ultima_mensalidade.status === "pago") {
      return <Badge className="bg-green-500">Em dia</Badge>;
    }

    if (ogmo.ultima_mensalidade.dias_atraso > 0) {
      return <Badge variant="destructive">Atrasado ({ogmo.ultima_mensalidade.dias_atraso}d)</Badge>;
    }

    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <img src={safoLogo} alt="Safo Logo" className="h-20 relative z-10 drop-shadow-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Controle Financeiro
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Gestão de mensalidades e pagamentos dos OGMOs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate("/admin/financeiro/dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end gap-2 mb-6">
            <Button 
              variant="outline"
              onClick={() => navigate("/admin/financeiro/relatorios")}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações Financeiras</DialogTitle>
                  <DialogDescription>
                    Defina o valor cobrado por operador portuário cadastrado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="valor">Valor por Operador (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={valorPorOperador}
                      onChange={(e) => setValorPorOperador(parseFloat(e.target.value))}
                    />
                  </div>
                  <Button onClick={handleUpdateConfig} className="w-full">
                    Salvar Configuração
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button>
              <FileUp className="mr-2 h-4 w-4" />
              Importar Extrato
            </Button>
          </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="grid gap-4">
            {ogmos.map((ogmo) => (
              <Card
                key={ogmo.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/admin/financeiro/${ogmo.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {ogmo.nome}
                        {getStatusBadge(ogmo)}
                      </CardTitle>
                      <CardDescription>CNPJ: {ogmo.cnpj}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {ogmo.quantidade_operadores}
                      </div>
                      <div className="text-sm text-muted-foreground">operadores</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        Valor mensal: R$ {(ogmo.quantidade_operadores * valorPorOperador).toFixed(2)}
                      </span>
                    </div>
                    {ogmo.telefone && (
                      <span className="text-sm text-muted-foreground">
                        Tel: {ogmo.telefone}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
