import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { UserPlus, ArrowLeft, Trash2 } from "lucide-react";

interface Funcionario {
  id: string;
  Matricula: number;
  nome_completo: string;
  created_at: string;
  role?: string;
}

export default function FuncionariosOgmo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: "",
    matricula: "",
    email: "",
    senha: "",
  });

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      // Buscar profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles de todos os usuários
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Criar um mapa de user_id para role
      const rolesMap = new Map(
        (rolesData || []).map((r: any) => [r.user_id, r.role])
      );

      // Combinar profiles com roles
      const funcionariosComRoles = (profilesData || []).map((func: any) => ({
        ...func,
        role: rolesMap.get(func.id) || null,
      }));

      setFuncionarios(funcionariosComRoles);
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

      const { data, error } = await supabase.functions.invoke("create-ogmo-user", {
        body: {
          email: formData.email,
          password: formData.senha,
          ogmo_data: {
            nome: formData.nome_completo,
            cnpj: "",
          },
        },
      });

      if (error) throw error;

      // Atualizar profile com matrícula e nome completo
      if (data?.user_id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            Matricula: parseInt(formData.matricula),
            nome_completo: formData.nome_completo,
          })
          .eq("id", data.user_id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Sucesso",
        description: "Funcionário cadastrado com sucesso",
      });

      setDialogOpen(false);
      setFormData({ nome_completo: "", matricula: "", email: "", senha: "" });
      loadFuncionarios();
    } catch (error: any) {
      console.error("Erro ao cadastrar funcionário:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar o funcionário",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Primeiro, remover todas as roles existentes do usuário
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Se a nova role não for "none", inserir a nova role
      if (newRole !== "none") {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole as any }]);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso",
      });

      loadFuncionarios();
    } catch (error: any) {
      console.error("Erro ao atualizar permissão:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a permissão",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Funcionários do OGMO</h1>
            <p className="text-muted-foreground">
              Gerencie os funcionários com acesso ao sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Funcionários</CardTitle>
                <CardDescription>
                  Funcionários cadastrados no sistema
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Funcionário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do funcionário que terá acesso ao sistema
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
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="senha">Senha</Label>
                      <Input
                        id="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) =>
                          setFormData({ ...formData, senha: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Cadastrar Funcionário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : funcionarios.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum funcionário cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((func) => (
                    <TableRow key={func.id}>
                      <TableCell>{func.Matricula}</TableCell>
                      <TableCell>{func.nome_completo}</TableCell>
                      <TableCell>
                        {new Date(func.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={func.role || "none"}
                          onValueChange={(value) => handleRoleChange(func.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione a permissão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem permissão</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="ogmo">OGMO</SelectItem>
                            <SelectItem value="terminal">Terminal</SelectItem>
                            <SelectItem value="sindicato">Sindicato</SelectItem>
                            <SelectItem value="tpa">TPA</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
