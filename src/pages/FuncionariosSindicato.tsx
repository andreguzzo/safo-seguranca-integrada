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
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowLeft, Trash2 } from "lucide-react";

interface Funcionario {
  id: string;
  Matricula: number;
  nome_completo: string;
  created_at: string;
}

export default function FuncionariosSindicato() {
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
    sindicato: "",
  });

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      // Buscar usuários com role sindicato
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "sindicato");

      if (rolesError) throw rolesError;

      const userIds = userRoles?.map(r => r.user_id) || [];

      if (userIds.length === 0) {
        setFuncionarios([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários dos sindicatos",
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

      // Criar usuário com role sindicato através da edge function
      const { data, error } = await supabase.functions.invoke("create-sindicato-user", {
        body: {
          email: formData.email,
          password: formData.senha,
          profile_data: {
            nome_completo: formData.nome_completo,
            matricula: parseInt(formData.matricula),
          },
          sindicato: formData.sindicato,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Funcionário do sindicato cadastrado com sucesso",
      });

      setDialogOpen(false);
      setFormData({ nome_completo: "", matricula: "", email: "", senha: "", sindicato: "" });
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
            <h1 className="text-3xl font-bold">Funcionários dos Sindicatos</h1>
            <p className="text-muted-foreground">
              Gerencie os funcionários dos sindicatos com acesso ao sistema
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Funcionários</CardTitle>
                <CardDescription>
                  Funcionários dos sindicatos cadastrados no sistema
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
                    <DialogTitle>Cadastrar Funcionário de Sindicato</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do funcionário do sindicato que terá acesso ao sistema
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
                      <Label htmlFor="sindicato">Nome do Sindicato</Label>
                      <Input
                        id="sindicato"
                        value={formData.sindicato}
                        onChange={(e) =>
                          setFormData({ ...formData, sindicato: e.target.value })
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
                Nenhum funcionário de sindicato cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
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
