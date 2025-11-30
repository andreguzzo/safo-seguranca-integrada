import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import AdminDashboard from "./pages/AdminDashboard";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import FinanceiroAdmin from "./pages/FinanceiroAdmin";
import DashboardFinanceiro from "./pages/DashboardFinanceiro";
import RelatoriosFinanceiros from "./pages/RelatoriosFinanceiros";
import DetalhesFinanceirosOgmo from "./pages/DetalhesFinanceirosOgmo";
import OgmoDashboard from "./pages/OgmoDashboard";
import FuncionariosOgmo from "./pages/FuncionariosOgmo";
import GerenciarPerfis from "./pages/GerenciarPerfis";
import FuncionariosSindicato from "./pages/FuncionariosSindicato";
import TerminaisPortuarios from "./pages/TerminaisPortuarios";
import OperadoresPortuarios from "./pages/OperadoresPortuarios";
import TrabalhadorAvulso from "./pages/TrabalhadorAvulso";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<GerenciarUsuarios />} />
          <Route path="/admin/financeiro" element={<FinanceiroAdmin />} />
          <Route path="/admin/financeiro/dashboard" element={<DashboardFinanceiro />} />
          <Route path="/admin/financeiro/relatorios" element={<RelatoriosFinanceiros />} />
          <Route path="/admin/financeiro/:ogmoId" element={<DetalhesFinanceirosOgmo />} />
          <Route path="/ogmo/:ogmoId" element={<OgmoDashboard />} />
          <Route path="/ogmo/:ogmoId/funcionarios" element={<FuncionariosOgmo />} />
          <Route path="/ogmo/:ogmoId/perfis" element={<GerenciarPerfis />} />
          <Route path="/ogmo/:ogmoId/sindicatos" element={<FuncionariosSindicato />} />
          <Route path="/ogmo/:ogmoId/terminais" element={<TerminaisPortuarios />} />
          <Route path="/ogmo/:ogmoId/operadores" element={<OperadoresPortuarios />} />
          <Route path="/ogmo/:ogmoId/tpas" element={<TrabalhadorAvulso />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
