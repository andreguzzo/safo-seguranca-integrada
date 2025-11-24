import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Users, BarChart3, FileCheck } from "lucide-react";
import { useEffect, useState } from "react";
import portBg1 from "@/assets/port-bg-1.jpg";
import portBg2 from "@/assets/port-bg-2.jpg";
import portBg3 from "@/assets/port-bg-3.jpg";
const backgroundImages = [portBg1, portBg2, portBg3];
export const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);
  return <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image Carousel */}
      {backgroundImages.map((image, index) => <div key={index} className="absolute inset-0 transition-opacity duration-1000" style={{
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: currentImageIndex === index ? 1 : 0
    }} />)}
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-background/70"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iaHNsKDIwMCA0MCUgODUlKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Sistema Integrado de Gestão da 
Segurança do Trabalho Portuário
            <br />
            <span className="text-green-900 text-4xl">Segurança do Trabalho Portuário</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-10 text-stone-800">
            Conectando OGMO's, Operadores Portuários, Terminais e Trabalhadores em uma plataforma única para gestão eficiente e segura das operações portuárias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/login">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Começar Agora
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Saiba Mais
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-smooth">
              <Shield className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-2">Segurança</h3>
              <p className="text-sm text-muted-foreground">Gestão completa de segurança</p>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-smooth">
              <Users className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-2">Integração</h3>
              <p className="text-sm text-muted-foreground">Todos os atores conectados</p>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-smooth">
              <BarChart3 className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-2">Relatórios</h3>
              <p className="text-sm text-muted-foreground">Análises em tempo real</p>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-soft hover:shadow-medium transition-smooth">
              <FileCheck className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-2">Conformidade</h3>
              <p className="text-sm text-muted-foreground">Normas e regulamentos</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};