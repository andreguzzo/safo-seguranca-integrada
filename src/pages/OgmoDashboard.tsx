import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { 
  FileText, 
  AlertTriangle, 
  Shield, 
  Activity, 
  FileWarning, 
  ClipboardCheck,
  Container,
  Users,
  Briefcase,
  Search,
  FileEdit,
  Trash2,
  BarChart3,
  LogOut,
  ChevronDown,
  Ambulance,
  FileSearch,
  CalendarCheck,
  UserCog,
  Scale,
  User
} from "lucide-react";
import safoLogo from "@/assets/safo-logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OGMO {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  contato_emergencia: string | null;
}

interface DocumentStats {
  acidentes: number;
  incidentes: number;
  rnc: number;
  top: number;
  rds: number;
  checklists: number;
  pt: number;
  investigacoes: number;
  reunioes: number;
}

const OgmoDashboard = () => {
  const { ogmoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ogmo, setOgmo] = useState<OGMO | null>(null);
  const [stats, setStats] = useState<DocumentStats>({
    acidentes: 0,
    incidentes: 0,
    rnc: 0,
    top: 0,
    rds: 0,
    checklists: 0,
    pt: 0,
    investigacoes: 0,
    reunioes: 0
  });
  const [loading, setLoading] = useState(true);
  const [ogmoDialogOpen, setOgmoDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [ogmoFormData, setOgmoFormData] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    contato_emergencia: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Hook de notificações
  const { countsByType, markTypeAsRead, markOperatorAlertsAsRead } = useNotifications(ogmoId);

  useEffect(() => {
    checkAuth();
    fetchOgmoData();
  }, [ogmoId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }
  };

  const fetchOgmoData = async () => {
    try {
      const { data, error } = await supabase
        .from("ogmos")
        .select("*")
        .eq("id", ogmoId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "OGMO não encontrado",
          variant: "destructive",
        });
        navigate("/admin");
        return;
      }

      setOgmo(data);
      setOgmoFormData({
        nome: data.nome,
        cnpj: data.cnpj,
        endereco: data.endereco || "",
        telefone: data.telefone || "",
        email: data.email || "",
        contato_emergencia: data.contato_emergencia || "",
      });
      // TODO: Fetch real stats from database when tables are created
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados do OGMO",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleOpenOgmoDialog = () => {
    setOgmoDialogOpen(true);
  };

  const handleSaveOgmo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("ogmos")
        .update({
          contato_emergencia: ogmoFormData.contato_emergencia,
        })
        .eq("id", ogmoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato de emergência atualizado com sucesso",
      });

      fetchOgmoData();
      setOgmoDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar contato de emergência",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      // Primeiro verifica a senha atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("Usuário não encontrado");
      }

      // Tenta fazer login com a senha atual para validar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordFormData.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Erro",
          description: "Senha atual incorreta",
          variant: "destructive",
        });
        return;
      }

      // Atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordFormData.newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso",
      });

      setPasswordDialogOpen(false);
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-lg text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-center mb-6 py-2">
              <img 
                src={safoLogo} 
                alt="Safo Logo" 
                className="h-24 drop-shadow-2xl hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <h2 
              className="font-bold text-xl truncate cursor-pointer hover:text-primary transition-all duration-200 hover:scale-[1.02]"
              onClick={handleOpenOgmoDialog}
              title={ogmo?.nome}
            >
              {ogmo?.nome}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{ogmo?.cnpj}</p>
          </div>

          <SidebarContent>
            <Collapsible defaultOpen>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 flex items-center justify-between transition-colors rounded-md px-2">
                    Cadastros
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate(`/ogmo/${ogmoId}/terminais`)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Container className="h-4 w-4" />
                      <span>Terminais Portuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate(`/ogmo/${ogmoId}/operadores`)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>Operadores Portuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                      <Users className="h-4 w-4" />
                      <span>TPA's</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate(`/ogmo/${ogmoId}/funcionarios`)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <UserCog className="h-4 w-4" />
                      <span>Funcionários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate(`/ogmo/${ogmoId}/sindicatos`)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Scale className="h-4 w-4" />
                      <span>Sindicatos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
            </Collapsible>

            <Collapsible defaultOpen>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 flex items-center justify-between transition-colors rounded-md px-2">
                    Documentos
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <Ambulance className="h-4 w-4" />
                          <span>Acidentes de Trabalho</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <Activity className="h-4 w-4" />
                          <span>Incidentes</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <AlertTriangle className="h-4 w-4" />
                          <span>RNC</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <FileWarning className="h-4 w-4" />
                          <span>TOP</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <Shield className="h-4 w-4" />
                          <span>RDS</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Checklists</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <FileText className="h-4 w-4" />
                          <span>PT</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <FileSearch className="h-4 w-4" />
                          <span>Investigação de Acidentes/Incidentes</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                          <CalendarCheck className="h-4 w-4" />
                          <span>Reuniões</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <SidebarGroup>
              <SidebarGroupLabel className="px-2">Relatórios</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-colors">
                      <BarChart3 className="h-4 w-4" />
                      <span>Relatórios Personalizados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg shadow-sm">
            <div className="container mx-auto px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Visão geral dos documentos e estatísticas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell ogmoId={ogmoId} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPasswordDialogOpen(true)}
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                  title="Editar perfil"
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("novo_acidente")}
              >
                {countsByType.acidentes > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.acidentes}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Acidentes de Trabalho</CardTitle>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Ambulance className="h-5 w-5 text-destructive" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{stats.acidentes}</div>
                  <p className="text-xs text-muted-foreground mt-1">acidentes registrados</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("novo_incidente")}
              >
                {countsByType.incidentes > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.incidentes}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Incidentes</CardTitle>
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">{stats.incidentes}</div>
                  <p className="text-xs text-muted-foreground mt-1">incidentes registrados</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("nova_rnc")}
              >
                {countsByType.rnc > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.rnc}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">RNC</CardTitle>
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.rnc}</div>
                  <p className="text-xs text-muted-foreground mt-1">relatórios de não conformidade</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("novo_top")}
              >
                {countsByType.top > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.top}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">TOP</CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileWarning className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.top}</div>
                  <p className="text-xs text-muted-foreground mt-1">termos de ocorrência portuária</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("nova_rds")}
              >
                {countsByType.rds > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.rds}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">RDS</CardTitle>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.rds}</div>
                  <p className="text-xs text-muted-foreground mt-1">reuniões diárias de segurança</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("novo_checklist")}
              >
                {countsByType.checklists > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.checklists}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Checklists</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.checklists}</div>
                  <p className="text-xs text-muted-foreground mt-1">documentos registrados</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("nova_pt")}
              >
                {countsByType.pt > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.pt}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">PT</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.pt}</div>
                  <p className="text-xs text-muted-foreground mt-1">permissões de trabalho</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("nova_investigacao")}
              >
                {countsByType.investigacoes > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.investigacoes}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Investigação de Acidentes</CardTitle>
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <FileSearch className="h-5 w-5 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">{stats.investigacoes}</div>
                  <p className="text-xs text-muted-foreground mt-1">investigações realizadas</p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative cursor-pointer"
                onClick={() => markTypeAsRead("nova_reuniao")}
              >
                {countsByType.reunioes > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse z-10"
                  >
                    {countsByType.reunioes}
                  </Badge>
                )}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold">Reuniões</CardTitle>
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <CalendarCheck className="h-5 w-5 text-teal-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600">{stats.reunioes}</div>
                  <p className="text-xs text-muted-foreground mt-1">reuniões realizadas</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>

        <Dialog open={ogmoDialogOpen} onOpenChange={setOgmoDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl">Dados do OGMO</DialogTitle>
              <DialogDescription className="text-base">
                Visualize os dados cadastrais do OGMO. Apenas o contato de emergência pode ser editado aqui.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveOgmo} className="space-y-5">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={ogmoFormData.nome}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={ogmoFormData.cnpj}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={ogmoFormData.endereco}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={ogmoFormData.telefone}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={ogmoFormData.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="contato_emergencia">Contato de Emergência</Label>
                <Input
                  id="contato_emergencia"
                  value={ogmoFormData.contato_emergencia}
                  onChange={(e) =>
                    setOgmoFormData({ ...ogmoFormData, contato_emergencia: e.target.value })
                  }
                  placeholder="Ex: (27) 99999-9999"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOgmoDialogOpen(false)}
                  className="hover:bg-muted transition-colors"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  Salvar Contato de Emergência
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para troca de senha */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Digite sua senha atual e a nova senha que deseja usar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })
                  }
                  placeholder="Digite sua senha atual"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
                  }
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) =>
                    setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
                  }
                  placeholder="Digite a nova senha novamente"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    setPasswordFormData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Alterar Senha
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default OgmoDashboard;
