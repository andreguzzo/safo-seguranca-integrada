import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Users, BarChart3, FileCheck } from "lucide-react";
import { useEffect, useState } from "react";
import heroPort1 from "@/assets/hero-port-1.jpg";
import heroPort2 from "@/assets/hero-port-2.jpg";
import heroPort3 from "@/assets/hero-port-3.jpg";
const backgroundImages = [heroPort1, heroPort2, heroPort3];
export const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);
  return <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image Carousel */}
      {backgroundImages.map((image, index) => <div key={index} className="absolute inset-0 transition-opacity duration-2000" style={{
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: currentImageIndex === index ? 1 : 0
    }} />)}
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/70"></div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center space-y-8">
          <div className="inline-block mb-4">
            
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mt-8">
            Sistema Integrado de Gestão da
            <br />
            <span className="text-primary">Segurança do Trabalho Portuário</span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto text-muted-foreground font-light leading-relaxed">
            Conectando OGMO's, Operadores Portuários, Terminais e Trabalhadores em uma plataforma única para gestão eficiente e segura das operações portuárias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Link to="/login">
              <Button variant="hero" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-glow">
                Começar Agora
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 border-2">
              Saiba Mais
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="bg-card/90 backdrop-blur-sm p-6 rounded-2xl shadow-medium hover:shadow-elegant transition-smooth border border-border/50">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2 text-lg">Segurança</h3>
              <p className="text-sm text-muted-foreground">Gestão completa de segurança</p>
            </div>
            <div className="bg-card/90 backdrop-blur-sm p-6 rounded-2xl shadow-medium hover:shadow-elegant transition-smooth border border-border/50">
              <Users className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2 text-lg">Integração</h3>
              <p className="text-sm text-muted-foreground">Todos os atores conectados</p>
            </div>
            <div className="bg-card/90 backdrop-blur-sm p-6 rounded-2xl shadow-medium hover:shadow-elegant transition-smooth border border-border/50">
              <BarChart3 className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2 text-lg">Relatórios</h3>
              <p className="text-sm text-muted-foreground">Análises em tempo real</p>
            </div>
            <div className="bg-card/90 backdrop-blur-sm p-6 rounded-2xl shadow-medium hover:shadow-elegant transition-smooth border border-border/50">
              <FileCheck className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2 text-lg">Conformidade</h3>
              <p className="text-sm text-muted-foreground">Normas e regulamentos</p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};