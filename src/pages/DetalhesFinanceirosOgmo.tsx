import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Unlock, Phone, Mail, MapPin, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OgmoDetalhes {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  bloqueado: boolean;
  valor_por_operador: number | null;
}

interface Mensalidade {
  id: string;
  mes_referencia: string;
  quantidade_operadores: number;
  valor_total: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  cnpj_pagador: string | null;
}

export default function DetalhesFinanceirosOgmo() {
  const { ogmoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ogmo, setOgmo] = useState<OgmoDetalhes | null>(null);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [quantidadeOperadores, setQuantidadeOperadores] = useState(0);
  const [valorPorOperador, setValorPorOperador] = useState(0);
  const [valorPadraoGlobal, setValorPadraoGlobal] = useState(0);
  const [novoValor, setNovoValor] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchDados();
  }, [ogmoId]);

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

  const fetchDados = async () => {
    setLoading(true);

    // Buscar dados do OGMO
    const { data: ogmoData, error: ogmoError } = await supabase
      .from("ogmos")
      .select("*")
      .eq("id", ogmoId)
      .single();

    if (ogmoError || !ogmoData) {
      toast({
        title: "Erro ao carregar OGMO",
        description: ogmoError?.message,
        variant: "destructive",
      });
      navigate("/admin/financeiro");
      return;
    }

    setOgmo(ogmoData);

    // Buscar quantidade de operadores
    const { count } = await supabase
      .from("operadores_portuarios")
      .select("*", { count: "exact", head: true })
      .eq("ogmo_id", ogmoId);

    setQuantidadeOperadores(count || 0);

    // Buscar configuração global
    const { data: config } = await supabase
      .from("configuracoes_financeiras")
      .select("valor_por_operador")
      .single();

    setValorPadraoGlobal(config?.valor_por_operador || 0);
    
    // Usar valor customizado do OGMO ou valor padrão global
    const valorFinal = ogmoData.valor_por_operador || config?.valor_por_operador || 0;
    setValorPorOperador(valorFinal);
    setNovoValor(valorFinal);

    // Buscar mensalidades
    const { data: mensalidadesData } = await supabase
      .from("mensalidades_ogmo")
      .select("*")
      .eq("ogmo_id", ogmoId)
      .order("mes_referencia", { ascending: false });

    setMensalidades(mensalidadesData || []);
    setLoading(false);
  };

  const handleToggleBloqueio = async () => {
    if (!ogmo) return;

    const { error } = await supabase
      .from("ogmos")
      .update({ bloqueado: !ogmo.bloqueado })
      .eq("id", ogmo.id);

    if (error) {
      toast({
        title: "Erro ao atualizar bloqueio",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: ogmo.bloqueado ? "OGMO desbloqueado" : "OGMO bloqueado",
        description: ogmo.bloqueado
          ? "O acesso foi restaurado"
          : "O acesso foi bloqueado por inadimplência",
      });
      fetchDados();
    }
  };

  const handleUpdateValor = async () => {
    if (!ogmo) return;

    const { error } = await supabase
      .from("ogmos")
      .update({ valor_por_operador: novoValor })
      .eq("id", ogmo.id);

    if (error) {
      toast({
        title: "Erro ao atualizar valor",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Valor atualizado",
        description: "Valor por operador atualizado com sucesso",
      });
      setShowEditDialog(false);
      fetchDados();
    }
  };

  const getDiasAtraso = (dataVencimento: string) => {
    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    return Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (mensalidade: Mensalidade) => {
    if (mensalidade.status === "pago") {
      return <Badge className="bg-green-500">Pago</Badge>;
    }

    const diasAtraso = getDiasAtraso(mensalidade.data_vencimento);
    if (diasAtraso > 0) {
      return <Badge variant="destructive">Atrasado ({diasAtraso}d)</Badge>;
    }

    return <Badge variant="secondary">Pendente</Badge>;
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Carregando...</div>;
  }

  if (!ogmo) {
    return null;
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    {ogmo.nome}
                    {ogmo.bloqueado && <Badge variant="destructive">Bloqueado</Badge>}
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    CNPJ: {ogmo.cnpj}
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant={ogmo.bloqueado ? "default" : "destructive"}>
                      {ogmo.bloqueado ? (
                        <>
                          <Unlock className="mr-2 h-4 w-4" />
                          Desbloquear
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Bloquear
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {ogmo.bloqueado ? "Desbloquear" : "Bloquear"} OGMO?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {ogmo.bloqueado
                          ? "Ao desbloquear, o OGMO e todos os usuários vinculados terão o acesso restaurado."
                          : "Ao bloquear, o OGMO e todos os usuários vinculados (Master OGMO, operadores, etc) perderão o acesso ao sistema."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleToggleBloqueio}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Informações de Contato</h3>
                  {ogmo.telefone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{ogmo.telefone}</span>
                    </div>
                  )}
                  {ogmo.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{ogmo.email}</span>
                    </div>
                  )}
                  {ogmo.endereco && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{ogmo.endereco}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Informações Financeiras</h3>
                    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar Valor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Valor por Operador</DialogTitle>
                          <DialogDescription>
                            Defina um valor customizado para este OGMO. Deixe em branco para usar o valor padrão global (R$ {valorPadraoGlobal.toFixed(2)}).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="novoValor">Valor por Operador (R$)</Label>
                            <Input
                              id="novoValor"
                              type="number"
                              step="0.01"
                              value={novoValor}
                              onChange={(e) => setNovoValor(parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateValor} className="flex-1">
                              Salvar
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setNovoValor(valorPadraoGlobal);
                              }}
                            >
                              Usar Padrão
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operadores cadastrados:</span>
                      <span className="font-bold">{quantidadeOperadores}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valor por operador:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">R$ {valorPorOperador.toFixed(2)}</span>
                        {ogmo.valor_por_operador && (
                          <Badge variant="secondary" className="text-xs">Customizado</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Valor mensal total:</span>
                      <span className="font-bold text-primary text-xl">
                        R$ {(quantidadeOperadores * valorPorOperador).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensalidades</CardTitle>
              <CardDescription>
                Registro de todas as mensalidades geradas para este OGMO
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mensalidades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma mensalidade registrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referência</TableHead>
                      <TableHead>Operadores</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mensalidades.map((mensalidade) => (
                      <TableRow key={mensalidade.id}>
                        <TableCell>
                          {new Date(mensalidade.mes_referencia).toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{mensalidade.quantidade_operadores}</TableCell>
                        <TableCell>R$ {mensalidade.valor_total.toFixed(2)}</TableCell>
                        <TableCell>{formatDate(mensalidade.data_vencimento)}</TableCell>
                        <TableCell>
                          {mensalidade.data_pagamento
                            ? formatDate(mensalidade.data_pagamento)
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(mensalidade)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
