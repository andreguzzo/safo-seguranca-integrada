import { Link } from "react-router-dom";
import safoLogo from "@/assets/safo-logo.png";
export const Footer = () => {
  return <footer className="bg-card border-t border-border py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="mb-6">
              <img alt="Safo Logo" className="h-20" src="/lovable-uploads/2a389ffd-6e61-4350-b59a-2109d92dbee5.png" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistema de Gestão de Segurança do Trabalho Portuário Integrado
            </p>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-6 text-lg">Produto</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Funcionalidades</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Preços</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Demonstração</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-6 text-lg">Suporte</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Documentação</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Ajuda</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-6 text-lg">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Privacidade</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Termos de Uso</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-primary transition-smooth">Conformidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SAFO. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>;
};