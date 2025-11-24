import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MensalidadeData {
  mes: string;
  previsto: number;
  realizado: number;
  pendente: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface Metrics {
  receitaTotal: number;
  receitaPrevista: number;
  inadimplencia: number;
  taxaPagamento: number;
}

export default function DashboardFinanceiro() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mensalidadesData, setMensalidadesData] = useState<MensalidadeData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    receitaTotal: 0,
    receitaPrevista: 0,
    inadimplencia: 0,
    taxaPagamento: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Buscar todas as mensalidades
      const { data: mensalidades, error } = await supabase
        .from("mensalidades_ogmo")
        .select("*")
        .order("mes_referencia", { ascending: true });

      if (error) throw error;

      // Processar dados para os gráficos
      const dataByMonth: { [key: string]: MensalidadeData } = {};
      const statusCount = {
        pago: 0,
        pendente: 0,
        atrasado: 0,
      };

      let totalRealizado = 0;
      let totalPrevisto = 0;
      let totalPendente = 0;

      mensalidades?.forEach((m) => {
        const mesKey = new Date(m.mes_referencia).toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        });

        if (!dataByMonth[mesKey]) {
          dataByMonth[mesKey] = {
            mes: mesKey,
            previsto: 0,
            realizado: 0,
            pendente: 0,
          };
        }

        dataByMonth[mesKey].previsto += m.valor_total;
        totalPrevisto += m.valor_total;

        if (m.status === "pago") {
          dataByMonth[mesKey].realizado += m.valor_total;
          totalRealizado += m.valor_total;
          statusCount.pago++;
        } else {
          dataByMonth[mesKey].pendente += m.valor_total;
          totalPendente += m.valor_total;
          
          const diasAtraso = Math.floor(
            (new Date().getTime() - new Date(m.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diasAtraso > 0) {
            statusCount.atrasado++;
          } else {
            statusCount.pendente++;
          }
        }
      });

      // Converter para array e pegar últimos 6 meses
      const mensalidadesArray = Object.values(dataByMonth).slice(-6);
      setMensalidadesData(mensalidadesArray);

      // Dados de status para gráfico de pizza
      const statusDataArray: StatusData[] = [
        { name: "Pago", value: statusCount.pago, color: "hsl(142, 76%, 36%)" },
        { name: "Pendente", value: statusCount.pendente, color: "hsl(220, 14%, 70%)" },
        { name: "Atrasado", value: statusCount.atrasado, color: "hsl(0, 84%, 60%)" },
      ].filter((s) => s.value > 0);

      setStatusData(statusDataArray);

      // Calcular métricas
      const totalMensalidades = statusCount.pago + statusCount.pendente + statusCount.atrasado;
      const taxaPagamento = totalMensalidades > 0 
        ? (statusCount.pago / totalMensalidades) * 100 
        : 0;

      setMetrics({
        receitaTotal: totalRealizado,
        receitaPrevista: totalPrevisto,
        inadimplencia: totalPendente,
        taxaPagamento,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/financeiro")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground mt-2">
            Análise e relatórios de receitas e inadimplência
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Realizada</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {metrics.receitaTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de pagamentos recebidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.receitaPrevista.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de mensalidades geradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {metrics.inadimplencia.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valores pendentes de pagamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.taxaPagamento.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Mensalidades pagas no prazo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Receita Prevista vs Realizada */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Prevista vs Realizada</CardTitle>
              <CardDescription>Comparativo mensal dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mensalidadesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="previsto" fill="hsl(var(--primary))" name="Previsto" />
                  <Bar dataKey="realizado" fill="hsl(142, 76%, 36%)" name="Realizado" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status dos Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pagamentos</CardTitle>
              <CardDescription>Distribuição de mensalidades por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Evolução de Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Receita</CardTitle>
            <CardDescription>Histórico de pagamentos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={mensalidadesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  name="Receita Realizada"
                />
                <Line
                  type="monotone"
                  dataKey="pendente"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  name="Pendente"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
