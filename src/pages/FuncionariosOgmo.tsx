import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowLeft, Trash2, Settings, Pencil } from "lucide-react";

interface Funcionario {
  id: string;
  Matricula: number;
  nome_completo: string;
  created_at: string;
  perfis?: string[];
  email?: string;
}

interface Perfil {
  id: string;
  nome: string;
}

export default function FuncionariosOgmo() {
  const navigate = useNavigate();
  const { ogmoId } = useParams<{ ogmoId: string }>();
  const { toast } = useToast();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [formData, setFormData] = useState({
    nome_completo: "",
    matricula: "",
    email: "",
    senha: "",
  });

  useEffect(() => {
    loadFuncionarios();
    loadPerfis();
  }, []);

  const loadFuncionarios = async () => {
    try {
      if (!ogmoId) {
        throw new Error("ID do OGMO não encontrado");
      }

      const { data, error } = await supabase.functions.invoke("get-funcionarios-ogmo", {
        body: { ogmo_id: ogmoId },
      });

      if (error) throw error;
      
      setFuncionarios(data.funcionarios || []);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        return;
      }

      if (!ogmoId) {
        toast({
          title: "Erro",
          description: "ID do OGMO não encontrado",
          variant: "destructive",
        });
        return;
      }

      if (editingFuncionario) {
        // Atualizar funcionário existente
        const { error } = await supabase.functions.invoke("update-funcionario-ogmo", {
          body: {
            user_id: editingFuncionario.id,
            email: formData.email,
            nome_completo: formData.nome_completo,
            matricula: formData.matricula,
          },
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Funcionário atualizado com sucesso",
        });
      } else {
        // Criar novo funcionário
        const { data, error } = await supabase.functions.invoke("create-funcionario-ogmo", {
          body: {
            email: formData.email,
            password: formData.senha,
            nome_completo: formData.nome_completo,
            matricula: formData.matricula,
            ogmo_id: ogmoId,
          },
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Funcionário cadastrado com sucesso",
        });
      }

      setDialogOpen(false);
      setEditingFuncionario(null);
      setFormData({ nome_completo: "", matricula: "", email: "", senha: "" });
      loadFuncionarios();
    } catch (error: any) {
      console.error("Erro ao salvar funcionário:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o funcionário",
        variant: "destructive",
      });
    }
  };

  const loadPerfis = async () => {
    try {
      if (!ogmoId) {
        throw new Error("ID do OGMO não encontrado");
      }

      const { data, error } = await supabase
        .from("perfis_usuario")
        .select("id, nome")
        .eq("ogmo_id", ogmoId)
        .order("nome", { ascending: true });

      if (error) throw error;
      setPerfis(data || []);
    } catch (error) {
      console.error("Erro ao carregar perfis:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os perfis",
        variant: "destructive",
      });
    }
  };

  const handlePerfilChange = async (userId: string, perfilId: string) => {
    try {
      // Primeiro, remover todos os perfis existentes do usuário
      const { error: deleteError } = await supabase
        .from("usuario_perfis")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Se o novo perfil não for "none", inserir o novo perfil
      if (perfilId !== "none") {
        const { error: insertError } = await supabase
          .from("usuario_perfis")
          .insert([{ user_id: userId, perfil_id: perfilId }]);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      loadFuncionarios();
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = (funcionario?: Funcionario) => {
    if (funcionario) {
      setEditingFuncionario(funcionario);
      setFormData({
        nome_completo: funcionario.nome_completo,
        matricula: funcionario.Matricula.toString(),
        email: funcionario.email || "",
        senha: "",
      });
    } else {
      setEditingFuncionario(null);
      setFormData({ nome_completo: "", matricula: "", email: "", senha: "" });
    }
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/ogmo/${ogmoId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Usuários do OGMO</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários com acesso ao sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>
                  Usuários cadastrados no sistema
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/ogmo/${ogmoId}/perfis`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Perfis
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFuncionario ? "Editar Usuário" : "Cadastrar Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                      {editingFuncionario 
                        ? "Atualize os dados do usuário"
                        : "Preencha os dados do usuário que terá acesso ao sistema"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nome_completo">Nome Completo</Label>
                      <Input
                        id="nome_completo"
                        value={formData.nome_completo}
                        onChange={(e) =>
                          setFormData({ ...formData, nome_completo: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="matricula">Matrícula</Label>
                      <Input
                        id="matricula"
                        type="number"
                        value={formData.matricula}
                        onChange={(e) =>
                          setFormData({ ...formData, matricula: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required={!editingFuncionario}
                      />
                      {editingFuncionario && (
                        <p className="text-xs text-muted-foreground mt-1">
                          O email será atualizado no sistema de autenticação
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="senha">{editingFuncionario ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}</Label>
                      <Input
                        id="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) =>
                          setFormData({ ...formData, senha: e.target.value })
                        }
                        required={!editingFuncionario}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingFuncionario ? "Atualizar Usuário" : "Cadastrar Usuário"}
                    </Button>
                  </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : funcionarios.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum usuário cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((func) => (
                    <TableRow key={func.id}>
                      <TableCell>{func.Matricula}</TableCell>
                      <TableCell>{func.nome_completo}</TableCell>
                      <TableCell>{func.email || "-"}</TableCell>
                      <TableCell>
                        {new Date(func.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={
                            func.perfis && func.perfis.length > 0
                              ? perfis.find(p => func.perfis?.includes(p.nome))?.id || "none"
                              : "none"
                          }
                          onValueChange={(value) => handlePerfilChange(func.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem perfil</SelectItem>
                            {perfis.map((perfil) => (
                              <SelectItem key={perfil.id} value={perfil.id}>
                                {perfil.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(func)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
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
