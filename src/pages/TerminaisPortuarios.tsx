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
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowLeft, Trash2, Edit } from "lucide-react";

interface Terminal {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  user_id: string | null;
  bloqueado: boolean;
  ogmo_id: string | null;
  created_at: string;
}

export default function TerminaisPortuarios() {
  const { ogmoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [terminais, setTerminais] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    senha: "",
  });

  useEffect(() => {
    loadTerminais();
  }, []);

  const loadTerminais = async () => {
    try {
      const { data, error } = await supabase
        .from("terminais_portuarios")
        .select("*")
        .eq("ogmo_id", ogmoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTerminais(data || []);
    } catch (error) {
      console.error("Erro ao carregar terminais:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os terminais",
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

      if (editingTerminal) {
        // Update existing terminal
        const { error: updateError } = await supabase
          .from("terminais_portuarios")
          .update({
            nome: formData.nome,
            cnpj: formData.cnpj,
            endereco: formData.endereco,
            telefone: formData.telefone,
            email: formData.email,
          })
          .eq("id", editingTerminal.id)
          .eq("ogmo_id", ogmoId);

        if (updateError) throw updateError;

        // If password is provided, update user password
        if (formData.senha && editingTerminal.user_id) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            editingTerminal.user_id,
            { password: formData.senha }
          );
          if (passwordError) throw passwordError;
        }

        toast({
          title: "Sucesso",
          description: "Terminal atualizado com sucesso",
        });
      } else {
        // Create new terminal
        const { data: terminalData, error: terminalError } = await supabase
          .from("terminais_portuarios")
          .insert({
            nome: formData.nome,
            cnpj: formData.cnpj,
            endereco: formData.endereco,
            telefone: formData.telefone,
            email: formData.email,
            ogmo_id: ogmoId,
          })
          .select()
          .single();

        if (terminalError) throw terminalError;

        // Create user master for terminal
        const { error: userError } = await supabase.functions.invoke("create-terminal-user", {
          body: {
            email: formData.email,
            password: formData.senha,
            terminalId: terminalData.id,
          },
        });

        if (userError) throw userError;

        toast({
          title: "Sucesso",
          description: "Terminal cadastrado com sucesso",
        });
      }

      setDialogOpen(false);
      setEditingTerminal(null);
      setFormData({ nome: "", cnpj: "", endereco: "", telefone: "", email: "", senha: "" });
      loadTerminais();
    } catch (error: any) {
      console.error("Erro ao salvar terminal:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o terminal",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal(terminal);
    setFormData({
      nome: terminal.nome,
      cnpj: terminal.cnpj,
      endereco: terminal.endereco || "",
      telefone: terminal.telefone || "",
      email: terminal.email || "",
      senha: "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este terminal?")) return;

    try {
      const { error } = await supabase
        .from("terminais_portuarios")
        .delete()
        .eq("id", id)
        .eq("ogmo_id", ogmoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Terminal excluído com sucesso",
      });

      loadTerminais();
    } catch (error: any) {
      console.error("Erro ao excluir terminal:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o terminal",
        variant: "destructive",
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTerminal(null);
      setFormData({ nome: "", cnpj: "", endereco: "", telefone: "", email: "", senha: "" });
    }
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
            <h1 className="text-3xl font-bold">Terminais Portuários</h1>
            <p className="text-muted-foreground">
              Gerencie os terminais portuários cadastrados
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Terminais</CardTitle>
                <CardDescription>
                  Terminais portuários cadastrados no sistema
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Building2 className="h-4 w-4 mr-2" />
                    Novo Terminal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTerminal ? "Editar Terminal" : "Cadastrar Novo Terminal"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do terminal portuário
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
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
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) =>
                          setFormData({ ...formData, cnpj: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) =>
                          setFormData({ ...formData, endereco: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) =>
                          setFormData({ ...formData, telefone: e.target.value })
                        }
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
                        disabled={!!editingTerminal}
                      />
                    </div>
                    <div>
                      <Label htmlFor="senha">
                        Senha {editingTerminal ? "(deixe em branco para não alterar)" : ""}
                      </Label>
                      <Input
                        id="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) =>
                          setFormData({ ...formData, senha: e.target.value })
                        }
                        required={!editingTerminal}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingTerminal ? "Atualizar Terminal" : "Cadastrar Terminal"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : terminais.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum terminal cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terminais.map((terminal) => (
                    <TableRow key={terminal.id}>
                      <TableCell className="font-medium">{terminal.nome}</TableCell>
                      <TableCell>{terminal.cnpj}</TableCell>
                      <TableCell>{terminal.telefone || "-"}</TableCell>
                      <TableCell>{terminal.email || "-"}</TableCell>
                      <TableCell>
                        {new Date(terminal.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(terminal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(terminal.id)}
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