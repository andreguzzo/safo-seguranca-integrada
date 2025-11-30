import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
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
import { UserPlus, ArrowLeft, Trash2, Settings, Pencil, Upload } from "lucide-react";

interface Funcionario {
  id: string;
  cpf: string;
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
    cpf: "",
    email: "",
    senha: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Atualizar usuário existente
        const { error } = await supabase.functions.invoke("update-funcionario-ogmo", {
          body: {
            user_id: editingFuncionario.id,
            email: formData.email,
            nome_completo: formData.nome_completo,
            cpf: formData.cpf,
          },
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        });
      } else {
        // Criar novo usuário
        const { data, error } = await supabase.functions.invoke("create-funcionario-ogmo", {
          body: {
            email: formData.email,
            password: formData.cpf, // Senha inicial é o CPF
            nome_completo: formData.nome_completo,
            cpf: formData.cpf,
            ogmo_id: ogmoId,
          },
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Usuário cadastrado com sucesso. Senha inicial: CPF do usuário",
        });
      }

      setDialogOpen(false);
      setEditingFuncionario(null);
      setFormData({ nome_completo: "", cpf: "", email: "", senha: "" });
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
        cpf: funcionario.cpf,
        email: funcionario.email || "",
        senha: "",
      });
    } else {
      setEditingFuncionario(null);
      setFormData({ nome_completo: "", cpf: "", email: "", senha: "" });
    }
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        try {
          const { error } = await supabase.functions.invoke("create-funcionario-ogmo", {
            body: {
              email: row.email || row.Email || "",
              password: row.cpf || row.CPF || "",
              nome_completo: row.nome_completo || row.nome || row.Nome || "",
              cpf: row.cpf || row.CPF || "",
              ogmo_id: ogmoId,
            },
          });

          if (error) {
            console.error("Erro ao importar usuário:", row, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error("Erro ao processar linha:", row, err);
          errorCount++;
        }
      }

      toast({
        title: "Importação concluída",
        description: `${successCount} usuário(s) importado(s) com sucesso. ${errorCount} erro(s).`,
      });

      loadFuncionarios();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo Excel",
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
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
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
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, cpf: e.target.value })
                        }
                        placeholder="000.000.000-00"
                        required
                      />
                      {!editingFuncionario && (
                        <p className="text-xs text-muted-foreground mt-1">
                          O CPF será usado como senha inicial (deve ser alterada no primeiro acesso)
                        </p>
                      )}
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
                    <TableHead>CPF</TableHead>
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
                      <TableCell>{func.cpf}</TableCell>
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
