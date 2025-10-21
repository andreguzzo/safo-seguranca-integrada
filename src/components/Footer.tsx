import { Link } from "react-router-dom";
import safoLogo from "@/assets/safo-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={safoLogo} alt="Safo Logo" className="h-10 w-10" />
              <span className="text-xl font-bold">SAFO</span>
            </div>
            <p className="text-sm opacity-90">
              Sistema de Gestão de Segurança do Trabalho Portuário Integrado
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="#" className="hover:text-accent transition-smooth">Funcionalidades</Link></li>
              <li><Link to="#" className="hover:text-accent transition-smooth">Preços</Link></li>
              <li><Link to="#" className="hover:text-accent transition-smooth">Demonstração</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="#" className="hover:text-accent transition-smooth">Documentação</Link></li>
              <li><Link to="#" className="hover:text-accent transition-smooth">Ajuda</Link></li>
              <li><Link to="#" className="hover:text-accent transition-smooth">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="#" className="hover:text-accent transition-smooth">Privacidade</Link></li>
              <li><Link to="#" className="hover:text-accent transition-smooth">Termos de Uso</Link></li>
              <li><Link to="#" className="hover:text-accent transition-smooth">Conformidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm opacity-90">
          <p>&copy; {new Date().getFullYear()} SAFO. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
