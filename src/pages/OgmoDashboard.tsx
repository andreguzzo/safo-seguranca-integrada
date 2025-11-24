import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  UserCog
} from "lucide-react";
import safoLogo from "@/assets/safo-logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OGMO {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-hero">
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <img src={safoLogo} alt="Safo Logo" className="h-10 mb-2" />
            <h2 className="font-bold text-lg truncate">{ogmo?.nome}</h2>
            <p className="text-sm text-muted-foreground">{ogmo?.cnpj}</p>
          </div>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Container className="h-4 w-4" />
                      <span>Terminais Portuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Briefcase className="h-4 w-4" />
                      <span>Operadores Portuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Users className="h-4 w-4" />
                      <span>TPA's</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate(`/ogmo/${ogmoId}/funcionarios`)}>
                      <UserCog className="h-4 w-4" />
                      <span>Funcionários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Collapsible defaultOpen>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 flex items-center justify-between">
                    Documentos
                    <ChevronDown className="h-4 w-4" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <Ambulance className="h-4 w-4" />
                          <span>Acidentes de Trabalho</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <Activity className="h-4 w-4" />
                          <span>Incidentes</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <AlertTriangle className="h-4 w-4" />
                          <span>RNC</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <FileWarning className="h-4 w-4" />
                          <span>TOP</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <Shield className="h-4 w-4" />
                          <span>RDS</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Checklists</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <FileText className="h-4 w-4" />
                          <span>PT</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
                          <FileSearch className="h-4 w-4" />
                          <span>Investigação de Acidentes/Incidentes</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>
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
              <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
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
          <header className="border-b bg-card/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Visão geral dos documentos</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Acidentes de Trabalho</CardTitle>
                  <Ambulance className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.acidentes}</div>
                  <p className="text-xs text-muted-foreground">acidentes registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Incidentes</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.incidentes}</div>
                  <p className="text-xs text-muted-foreground">incidentes registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">RNC</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.rnc}</div>
                  <p className="text-xs text-muted-foreground">relatórios de não conformidade</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">TOP</CardTitle>
                  <FileWarning className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.top}</div>
                  <p className="text-xs text-muted-foreground">termos de ocorrência portuária</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">RDS</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.rds}</div>
                  <p className="text-xs text-muted-foreground">reuniões diárias de segurança</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Checklists</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.checklists}</div>
                  <p className="text-xs text-muted-foreground">documentos registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">PT</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pt}</div>
                  <p className="text-xs text-muted-foreground">permissões de trabalho</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Investigação de Acidentes/Incidentes</CardTitle>
                  <FileSearch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.investigacoes}</div>
                  <p className="text-xs text-muted-foreground">investigações realizadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Reuniões</CardTitle>
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.reunioes}</div>
                  <p className="text-xs text-muted-foreground">reuniões realizadas</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OgmoDashboard;
