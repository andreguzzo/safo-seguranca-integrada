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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowLeft, Trash2, Shield, User, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import safoLogo from "@/assets/safo-logo.png";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "usuario";
}

const GerenciarUsuarios = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "usuario" as "admin" | "usuario",
  });
  const [editFormData, setEditFormData] = useState({
    email: "",
    password: "",
    role: "usuario" as "admin" | "usuario",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

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
      navigate("/admin");
      return;
    }

    setCurrentUserRole(roles.role);
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(
        `https://kazjpebvshepisrbahqu.supabase.co/functions/v1/manage-admin-users?action=list`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthempwZWJ2c2hlcGlzcmJhaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjcwNTUsImV4cCI6MjA3NjY0MzA1NX0.lCOWS13qLKNH_pR-PCBs7YnohEXFUpR7yIbUQHwJZto',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar usuários');
      }

      const result = await response.json();

      const { users: adminUsers } = result;
      setUsers(adminUsers || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
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
        `https://kazjpebvshepisrbahqu.supabase.co/functions/v1/manage-admin-users?action=create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthempwZWJ2c2hlcGlzcmJhaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjcwNTUsImV4cCI6MjA3NjY0MzA1NX0.lCOWS13qLKNH_pR-PCBs7YnohEXFUpR7yIbUQHwJZto',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      toast({
        title: "Usuário criado com sucesso!",
      });

      setFormData({
        email: "",
        password: "",
        role: "usuario",
      });
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string, userRole: string) => {
    if (userRole === "admin" && currentUserRole !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir administradores",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(
        `https://kazjpebvshepisrbahqu.supabase.co/functions/v1/manage-admin-users?action=delete`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthempwZWJ2c2hlcGlzcmJhaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjcwNTUsImV4cCI6MjA3NjY0MzA1NX0.lCOWS13qLKNH_pR-PCBs7YnohEXFUpR7yIbUQHwJZto',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            user_role: userRole,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      toast({
        title: "Usuário excluído com sucesso!",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(
        `https://kazjpebvshepisrbahqu.supabase.co/functions/v1/manage-admin-users?action=update`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthempwZWJ2c2hlcGlzcmJhaHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjcwNTUsImV4cCI6MjA3NjY0MzA1NX0.lCOWS13qLKNH_pR-PCBs7YnohEXFUpR7yIbUQHwJZto',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: editingUser.id,
            email: editFormData.email !== editingUser.email ? editFormData.email : undefined,
            password: editFormData.password || undefined,
            role: editFormData.role !== editingUser.role ? editFormData.role : undefined,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar usuário');
      }

      toast({
        title: "Usuário atualizado com sucesso!",
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={safoLogo} alt="Safo Logo" className="h-14 drop-shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gerenciar Usuários Administrativos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Gestão de Administradores e Usuários do Sistema</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")} className="hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <Card className="shadow-xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Usuários do Sistema</CardTitle>
                <CardDescription className="text-base mt-2">
                  Gerencie administradores e usuários com acesso ao painel administrativo
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Cadastrar Novo Usuário</DialogTitle>
                    <DialogDescription className="text-base">
                      Preencha os dados do novo usuário administrativo
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Nível de Acesso *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: "admin" | "usuario") => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="usuario">Usuário</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Administrador:</strong> Acesso completo ao sistema<br />
                        <strong>Usuário:</strong> Acesso limitado (não pode excluir admins e OGMOs)
                      </p>
                    </div>

                    <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all">
                      Cadastrar Usuário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Nenhum usuário cadastrado ainda
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Nível de Acesso</TableHead>
                      <TableHead className="font-semibold">Data de Criação</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Administrador
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <User className="h-3 w-3" />
                              Usuário
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                              className="hover:bg-muted transition-colors"
                              title="Editar usuário"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id, user.role)}
                              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              disabled={user.role === "admin" && currentUserRole !== "admin"}
                              title="Excluir usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-background/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl">Editar Usuário</DialogTitle>
              <DialogDescription className="text-base">
                Modifique os dados do usuário administrativo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_password">Nova Senha (deixe em branco para não alterar)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Nível de Acesso *</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: "admin" | "usuario") => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all">
                Atualizar Usuário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default GerenciarUsuarios;
