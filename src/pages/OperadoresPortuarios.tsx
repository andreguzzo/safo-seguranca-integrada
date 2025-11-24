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
import { Users, ArrowLeft, Trash2, Edit } from "lucide-react";

interface Operador {
  id: string;
  nome: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  ogmo_id: string;
  created_at: string;
}

export default function OperadoresPortuarios() {
  const { ogmoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOperador, setEditingOperador] = useState<Operador | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
  });

  useEffect(() => {
    loadOperadores();
  }, []);

  const loadOperadores = async () => {
    try {
      const { data, error } = await supabase
        .from("operadores_portuarios")
        .select("*")
        .eq("ogmo_id", ogmoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOperadores(data || []);
    } catch (error) {
      console.error("Erro ao carregar operadores:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os operadores",
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

      if (editingOperador) {
        // Update existing operador
        const { error: updateError } = await supabase
          .from("operadores_portuarios")
          .update({
            nome: formData.nome,
            cpf: formData.cpf,
            email: formData.email || null,
            telefone: formData.telefone || null,
          })
          .eq("id", editingOperador.id)
          .eq("ogmo_id", ogmoId);

        if (updateError) throw updateError;

        toast({
          title: "Sucesso",
          description: "Operador atualizado com sucesso",
        });
      } else {
        // Create new operador
        const { error: operadorError } = await supabase
          .from("operadores_portuarios")
          .insert({
            nome: formData.nome,
            cpf: formData.cpf,
            email: formData.email || null,
            telefone: formData.telefone || null,
            ogmo_id: ogmoId,
          });

        if (operadorError) throw operadorError;

        toast({
          title: "Sucesso",
          description: "Operador cadastrado com sucesso",
        });
      }

      setDialogOpen(false);
      setEditingOperador(null);
      setFormData({ nome: "", cpf: "", email: "", telefone: "" });
      loadOperadores();
    } catch (error: any) {
      console.error("Erro ao salvar operador:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o operador",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (operador: Operador) => {
    setEditingOperador(operador);
    setFormData({
      nome: operador.nome,
      cpf: operador.cpf,
      email: operador.email || "",
      telefone: operador.telefone || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este operador?")) return;

    try {
      const { error } = await supabase
        .from("operadores_portuarios")
        .delete()
        .eq("id", id)
        .eq("ogmo_id", ogmoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Operador excluído com sucesso",
      });

      loadOperadores();
    } catch (error: any) {
      console.error("Erro ao excluir operador:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o operador",
        variant: "destructive",
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingOperador(null);
      setFormData({ nome: "", cpf: "", email: "", telefone: "" });
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
            <h1 className="text-3xl font-bold">Operadores Portuários</h1>
            <p className="text-muted-foreground">
              Gerencie os operadores portuários cadastrados
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Operadores</CardTitle>
                <CardDescription>
                  Operadores portuários cadastrados no sistema
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Novo Operador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingOperador ? "Editar Operador" : "Cadastrar Novo Operador"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do operador portuário
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
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, cpf: e.target.value })
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
                    <Button type="submit" className="w-full">
                      {editingOperador ? "Atualizar Operador" : "Cadastrar Operador"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : operadores.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum operador cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operadores.map((operador) => (
                    <TableRow key={operador.id}>
                      <TableCell className="font-medium">{operador.nome}</TableCell>
                      <TableCell>{operador.cpf}</TableCell>
                      <TableCell>{operador.email || "-"}</TableCell>
                      <TableCell>{operador.telefone || "-"}</TableCell>
                      <TableCell>
                        {new Date(operador.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(operador)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(operador.id)}
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