import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import safoLogo from "@/assets/safo-logo.png";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center hover:opacity-90 transition-smooth">
            <img src={safoLogo} alt="Safo Logo" className="h-12" />
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="hero">Acessar Sistema</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
