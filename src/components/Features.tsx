import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, Building2, HardHat, ClipboardCheck, Bell, Lock } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Anchor,
      title: "OGMO's",
      description: "Gestão completa da Segurança do Trabalho na competência dos  Órgãos Gestores de Mão de Obra"
    },
    {
      icon: Building2,
      title: "Operadores Portuários",
      description: "Integração com operadores para acompanhamento em tempo real das operações."
    },
    {
      icon: HardHat,
      title: "Trabalhadores",
      description: "Controle de trabalhadores avulsos e terceirizados, com histórico completo."
    },
    {
      icon: ClipboardCheck,
      title: "Conformidade",
      description: "Garantia de atendimento às normas regulamentadoras e padrões de segurança."
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Alertas instantâneos sobre eventos críticos e atualizações importantes."
    },
    {
      icon: Lock,
      title: "Segurança de Dados",
      description: "Proteção avançada de informações sensíveis com criptografia de ponta."
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Funcionalidades Integradas
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Uma plataforma completa para gerenciar todos os aspectos da segurança do trabalho portuário com tecnologia de ponta
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-smooth shadow-soft hover:shadow-elegant bg-card/80 backdrop-blur-sm group">
              <CardHeader className="pb-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-smooth">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-foreground font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
