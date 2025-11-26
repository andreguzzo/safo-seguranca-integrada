import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Upload, UserCog } from "lucide-react";
import * as XLSX from 'xlsx';

interface TPA {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  email: string;
  celular: string | null;
  created_at: string;
}

const TrabalhadorAvulso = () => {
  const navigate = useNavigate();
  const { ogmoId } = useParams();
  const { toast } = useToast();
  const [tpas, setTpas] = useState<TPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTpa, setSelectedTpa] = useState<TPA | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    matricula: "",
    email: "",
    celular: "",
  });

  useEffect(() => {
    checkAuth();
  }, [ogmoId]);

  const checkAuth = async () => {
    if (!ogmoId) {
      navigate("/");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isOgmo = roles?.some(r => r.role === "ogmo");
    const isAdmin = roles?.some(r => r.role === "admin");
    
    if (!isOgmo && !isAdmin) {
      navigate("/");
      return;
    }

    loadTpas(ogmoId);
  };

  const loadTpas = async (ogmoId: string) => {
    try {
      const { data, error } = await supabase
        .from("tpas")
        .select("*")
        .eq("ogmo_id", ogmoId)
        .order("nome");

      if (error) throw error;
      setTpas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar TPAs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ogmoId) {
      toast({
        title: "Erro",
        description: "ID do OGMO não encontrado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-tpa-user", {
        body: {
          ...formData,
          ogmoId,
        },
      });

      if (error) throw error;

      toast({
        title: "TPA cadastrado com sucesso!",
        description: `Senha padrão: ${formData.cpf}`,
      });

      setDialogOpen(false);
      setFormData({
        nome: "",
        cpf: "",
        matricula: "",
        email: "",
        celular: "",
      });
      loadTpas(ogmoId);
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar TPA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ogmoId) {
      toast({
        title: "Erro",
        description: "ID do OGMO não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          await supabase.functions.invoke("create-tpa-user", {
            body: {
              nome: row.nome || row.Nome,
              cpf: String(row.cpf || row.CPF),
              matricula: String(row.matricula || row.Matrícula || row.Matricula),
              email: row.email || row.Email,
              celular: row.celular || row.Celular || "",
              ogmoId,
            },
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error("Erro ao importar linha:", row, error);
        }
      }

      toast({
        title: "Importação concluída",
        description: `${successCount} TPAs importados, ${errorCount} erros`,
      });

      loadTpas(ogmoId);
    } catch (error: any) {
      toast({
        title: "Erro ao importar arquivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTpa) return;

    try {
      const { error } = await supabase.functions.invoke("reset-tpa-password", {
        body: { tpaId: selectedTpa.id },
      });

      if (error) throw error;

      toast({
        title: "Senha resetada com sucesso!",
        description: `Nova senha: ${selectedTpa.cpf}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao resetar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDetailsDialog = (tpa: TPA) => {
    setSelectedTpa(tpa);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Trabalhadores Portuários Avulsos</h1>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Excel
                </span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar TPA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Trabalhador Portuário Avulso</DialogTitle>
                  <DialogDescription>
                    A senha padrão será o CPF do trabalhador
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : tpas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum TPA cadastrado ainda
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tpas.map((tpa) => (
                  <TableRow 
                    key={tpa.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetailsDialog(tpa)}
                  >
                    <TableCell className="font-medium">{tpa.nome}</TableCell>
                    <TableCell>{tpa.cpf}</TableCell>
                    <TableCell>{tpa.matricula}</TableCell>
                    <TableCell>{tpa.email}</TableCell>
                    <TableCell>{tpa.celular || "-"}</TableCell>
                    <TableCell>
                      {new Date(tpa.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do TPA</DialogTitle>
          </DialogHeader>
          {selectedTpa && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nome</Label>
                <p className="font-medium">{selectedTpa.nome}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">CPF</Label>
                <p className="font-medium">{selectedTpa.cpf}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Matrícula</Label>
                <p className="font-medium">{selectedTpa.matricula}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedTpa.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Celular</Label>
                <p className="font-medium">{selectedTpa.celular || "-"}</p>
              </div>
              <Button 
                onClick={handleResetPassword} 
                className="w-full"
                variant="outline"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Resetar Senha para CPF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrabalhadorAvulso;