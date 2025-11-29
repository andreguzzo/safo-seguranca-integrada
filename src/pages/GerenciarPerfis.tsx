import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

interface Perfil {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

interface Permissao {
  id: string;
  perfil_id: string;
  recurso: string;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_visualizar: boolean;
}

interface PermissaoForm {
  recurso: string;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_visualizar: boolean;
}

const RECURSOS_DISPONIVEIS = [
  { value: "terminais_portuarios", label: "Terminais Portuários" },
  { value: "operadores_portuarios", label: "Operadores Portuários" },
  { value: "tpas", label: "TPAs" },
  { value: "documentos", label: "Documentos" },
  { value: "relatorios", label: "Relatórios" },
  { value: "funcionarios", label: "Funcionários" },
];

export default function GerenciarPerfis() {
  const navigate = useNavigate();
  const { ogmoId } = useParams<{ ogmoId: string }>();
  const { toast } = useToast();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });
  const [permissoes, setPermissoes] = useState<PermissaoForm[]>(
    RECURSOS_DISPONIVEIS.map(r => ({
      recurso: r.value,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
      pode_visualizar: false,
    }))
  );

  useEffect(() => {
    loadPerfis();
  }, []);

  const loadPerfis = async () => {
    try {
      if (!ogmoId) {
        throw new Error("ID do OGMO não encontrado");
      }

      const { data, error } = await supabase
        .from("perfis_usuario")
        .select("*")
        .eq("ogmo_id", ogmoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPerfis(data || []);
    } catch (error) {
      console.error("Erro ao carregar perfis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os perfis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPermissoes = async (perfilId: string) => {
    try {
      const { data, error } = await supabase
        .from("permissoes_perfil")
        .select("*")
        .eq("perfil_id", perfilId);

      if (error) throw error;

      const permissoesMap = new Map(
        (data || []).map((p: Permissao) => [p.recurso, p])
      );

      setPermissoes(
        RECURSOS_DISPONIVEIS.map(r => {
          const perm = permissoesMap.get(r.value);
          return {
            recurso: r.value,
            pode_criar: perm?.pode_criar || false,
            pode_editar: perm?.pode_editar || false,
            pode_excluir: perm?.pode_excluir || false,
            pode_visualizar: perm?.pode_visualizar || false,
          };
        })
      );
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    }
  };

  const handleOpenDialog = async (perfil?: Perfil) => {
    if (perfil) {
      setEditingPerfil(perfil);
      setFormData({
        nome: perfil.nome,
        descricao: perfil.descricao || "",
      });
      await loadPermissoes(perfil.id);
    } else {
      setEditingPerfil(null);
      setFormData({ nome: "", descricao: "" });
      setPermissoes(
        RECURSOS_DISPONIVEIS.map(r => ({
          recurso: r.value,
          pode_criar: false,
          pode_editar: false,
          pode_excluir: false,
          pode_visualizar: false,
        }))
      );
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!ogmoId) {
        throw new Error("ID do OGMO não encontrado");
      }

      let perfilId: string;

      if (editingPerfil) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from("perfis_usuario")
          .update({
            nome: formData.nome,
            descricao: formData.descricao,
          })
          .eq("id", editingPerfil.id);

        if (error) throw error;
        perfilId = editingPerfil.id;

        // Deletar permissões antigas
        await supabase
          .from("permissoes_perfil")
          .delete()
          .eq("perfil_id", perfilId);
      } else {
        // Criar novo perfil
        const { data, error } = await supabase
          .from("perfis_usuario")
          .insert({
            nome: formData.nome,
            descricao: formData.descricao,
            ogmo_id: ogmoId,
          })
          .select()
          .single();

        if (error) throw error;
        perfilId = data.id;
      }

      // Inserir permissões
      const permissoesParaInserir = permissoes.filter(
        p => p.pode_criar || p.pode_editar || p.pode_excluir || p.pode_visualizar
      );

      if (permissoesParaInserir.length > 0) {
        const { error } = await supabase.from("permissoes_perfil").insert(
          permissoesParaInserir.map(p => ({
            perfil_id: perfilId,
            recurso: p.recurso,
            pode_criar: p.pode_criar,
            pode_editar: p.pode_editar,
            pode_excluir: p.pode_excluir,
            pode_visualizar: p.pode_visualizar,
          }))
        );

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: editingPerfil
          ? "Perfil atualizado com sucesso"
          : "Perfil criado com sucesso",
      });

      setDialogOpen(false);
      loadPerfis();
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o perfil",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (perfilId: string) => {
    if (!confirm("Tem certeza que deseja excluir este perfil?")) return;

    try {
      const { error } = await supabase
        .from("perfis_usuario")
        .delete()
        .eq("id", perfilId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso",
      });

      loadPerfis();
    } catch (error: any) {
      console.error("Erro ao excluir perfil:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o perfil",
        variant: "destructive",
      });
    }
  };

  const handlePermissaoChange = (
    recurso: string,
    tipo: keyof Omit<PermissaoForm, "recurso">,
    value: boolean
  ) => {
    setPermissoes(prev =>
      prev.map(p =>
        p.recurso === recurso ? { ...p, [tipo]: value } : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/ogmo/${ogmoId}/funcionarios`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Perfis de Usuário</h1>
            <p className="text-muted-foreground">
              Crie e gerencie perfis com permissões personalizadas
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Perfis de Usuário</CardTitle>
                <CardDescription>
                  Perfis criados para este OGMO
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPerfil ? "Editar Perfil" : "Criar Novo Perfil"}
                    </DialogTitle>
                    <DialogDescription>
                      Defina o nome e as permissões para o perfil
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome do Perfil</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) =>
                            setFormData({ ...formData, nome: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) =>
                            setFormData({ ...formData, descricao: e.target.value })
                          }
                          rows={2}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Permissões</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recurso</TableHead>
                            <TableHead className="text-center">Criar</TableHead>
                            <TableHead className="text-center">Editar</TableHead>
                            <TableHead className="text-center">Excluir</TableHead>
                            <TableHead className="text-center">Visualizar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {RECURSOS_DISPONIVEIS.map((recurso) => {
                            const perm = permissoes.find(
                              p => p.recurso === recurso.value
                            );
                            return (
                              <TableRow key={recurso.value}>
                                <TableCell className="font-medium">
                                  {recurso.label}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={perm?.pode_criar || false}
                                    onCheckedChange={(checked) =>
                                      handlePermissaoChange(
                                        recurso.value,
                                        "pode_criar",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={perm?.pode_editar || false}
                                    onCheckedChange={(checked) =>
                                      handlePermissaoChange(
                                        recurso.value,
                                        "pode_editar",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={perm?.pode_excluir || false}
                                    onCheckedChange={(checked) =>
                                      handlePermissaoChange(
                                        recurso.value,
                                        "pode_excluir",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={perm?.pode_visualizar || false}
                                    onCheckedChange={(checked) =>
                                      handlePermissaoChange(
                                        recurso.value,
                                        "pode_visualizar",
                                        checked as boolean
                                      )
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <Button type="submit" className="w-full">
                      {editingPerfil ? "Atualizar Perfil" : "Criar Perfil"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : perfis.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum perfil cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfis.map((perfil) => (
                    <TableRow key={perfil.id}>
                      <TableCell className="font-medium">{perfil.nome}</TableCell>
                      <TableCell>{perfil.descricao || "-"}</TableCell>
                      <TableCell>
                        {new Date(perfil.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(perfil)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(perfil.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
