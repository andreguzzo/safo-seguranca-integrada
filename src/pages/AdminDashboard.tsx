import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogOut, Trash2, Pencil, DollarSign } from "lucide-react";
import safoLogo from "@/assets/safo-logo.png";

interface OGMO {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  user_id: string | null;
  contato_emergencia: string | null;
}

const AdminDashboard = () => {
  const [ogmos, setOgmos] = useState<OGMO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOgmo, setEditingOgmo] = useState<OGMO | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    email_master: "",
    senha_master: "",
  });
  const [editFormData, setEditFormData] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    contato_emergencia: "",
    email_master: "",
    senha_master: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchOgmos();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchOgmos = async () => {
    try {
      const { data, error } = await supabase
        .from("ogmos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOgmos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar OGMO's",
        description: error.message,
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
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(
        `https://kazjpebvshepisrbahqu.supabase.co/functions/v1/create-ogmo-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email_master,
            password: formData.senha_master,
            ogmo_data: {
              nome: formData.nome,
              cnpj: formData.cnpj,
              endereco: formData.endereco,
              telefone: formData.telefone,
              email: formData.email,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar OGMO");
      }

      toast({
        title: "OGMO e usuário criados com sucesso!",
      });

      setFormData({
        nome: "",
        cnpj: "",
        endereco: "",
        telefone: "",
        email: "",
        email_master: "",
        senha_master: "",
      });
      setIsDialogOpen(false);
      fetchOgmos();
    } catch (error: any) {
      toast({
        title: "Erro ao criar OGMO",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este OGMO?")) return;

    try {
      const { error } = await supabase.from("ogmos").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "OGMO excluído com sucesso!",
      });

      fetchOgmos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir OGMO",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (ogmo: OGMO) => {
    setEditingOgmo(ogmo);
    
    // Get master user email
    if (ogmo.user_id) {
      const { data: { user } } = await supabase.auth.admin.getUserById(ogmo.user_id);
      
      setEditFormData({
        nome: ogmo.nome,
        cnpj: ogmo.cnpj,
        endereco: ogmo.endereco || "",
        telefone: ogmo.telefone || "",
        email: ogmo.email || "",
        contato_emergencia: ogmo.contato_emergencia || "",
        email_master: user?.email || "",
        senha_master: "",
      });
    } else {
      setEditFormData({
        nome: ogmo.nome,
        cnpj: ogmo.cnpj,
        endereco: ogmo.endereco || "",
        telefone: ogmo.telefone || "",
        email: ogmo.email || "",
        contato_emergencia: ogmo.contato_emergencia || "",
        email_master: "",
        senha_master: "",
      });
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateOgmo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingOgmo) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      // Update OGMO data
      const { error: ogmoError } = await supabase
        .from("ogmos")
        .update({
          nome: editFormData.nome,
          cnpj: editFormData.cnpj,
          endereco: editFormData.endereco,
          telefone: editFormData.telefone,
          email: editFormData.email,
          contato_emergencia: editFormData.contato_emergencia,
        })
        .eq("id", editingOgmo.id);

      if (ogmoError) throw ogmoError;

      // Update master user if needed
      if (editingOgmo.user_id && (editFormData.email_master || editFormData.senha_master)) {
        const response = await fetch(
          `https://kazjpebvshepisrbahqu.supabase.co/functions/v1/update-ogmo-user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_id: editingOgmo.user_id,
              email: editFormData.email_master,
              password: editFormData.senha_master || undefined,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao atualizar usuário master");
        }
      }

      toast({
        title: "OGMO atualizado com sucesso!",
      });

      setIsEditDialogOpen(false);
      setEditingOgmo(null);
      fetchOgmos();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar OGMO",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={safoLogo} alt="Safo Logo" className="h-12" />
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gestão de OGMO's</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="default" 
            size="lg"
            onClick={() => navigate("/admin/financeiro")}
            className="w-full md:w-auto"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Controle Financeiro
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>OGMO's Cadastrados</CardTitle>
                <CardDescription>
                  Gerencie os Órgãos Gestores de Mão de Obra
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo OGMO
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo OGMO</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo OGMO
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do OGMO *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email do OGMO</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold mb-4">Usuário Master OGMO</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email_master">Email *</Label>
                        <Input
                          id="email_master"
                          type="email"
                          value={formData.email_master}
                          onChange={(e) => setFormData({ ...formData, email_master: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="senha_master">Senha *</Label>
                        <Input
                          id="senha_master"
                          type="password"
                          value={formData.senha_master}
                          onChange={(e) => setFormData({ ...formData, senha_master: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Cadastrar OGMO e Usuário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : ogmos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum OGMO cadastrado ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ogmos.map((ogmo) => (
                    <TableRow 
                      key={ogmo.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/ogmo/${ogmo.id}`)}
                    >
                      <TableCell className="font-medium">{ogmo.nome}</TableCell>
                      <TableCell>{ogmo.cnpj}</TableCell>
                      <TableCell>{ogmo.telefone || "-"}</TableCell>
                      <TableCell>{ogmo.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(ogmo);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ogmo.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar OGMO</DialogTitle>
              <DialogDescription>
                Edite os dados do OGMO e do usuário master
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateOgmo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_nome">Nome do OGMO *</Label>
                <Input
                  id="edit_nome"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_cnpj">CNPJ *</Label>
                <Input
                  id="edit_cnpj"
                  value={editFormData.cnpj}
                  onChange={(e) => setEditFormData({ ...editFormData, cnpj: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_endereco">Endereço</Label>
                <Input
                  id="edit_endereco"
                  value={editFormData.endereco}
                  onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_telefone">Telefone</Label>
                <Input
                  id="edit_telefone"
                  value={editFormData.telefone}
                  onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email do OGMO</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_contato_emergencia">Contato de Emergência</Label>
                <Input
                  id="edit_contato_emergencia"
                  value={editFormData.contato_emergencia}
                  onChange={(e) => setEditFormData({ ...editFormData, contato_emergencia: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Usuário Master OGMO</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_email_master">Email *</Label>
                  <Input
                    id="edit_email_master"
                    type="email"
                    value={editFormData.email_master}
                    onChange={(e) => setEditFormData({ ...editFormData, email_master: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="edit_senha_master">Nova Senha (deixe em branco para manter a atual)</Label>
                  <Input
                    id="edit_senha_master"
                    type="password"
                    value={editFormData.senha_master}
                    onChange={(e) => setEditFormData({ ...editFormData, senha_master: e.target.value })}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
