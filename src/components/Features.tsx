import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, Building2, HardHat, ClipboardCheck, Bell, Lock } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Anchor,
      title: "OGMO's",
      description: "Gestão completa de órgãos gestores de mão de obra, com controle de escalas e registros."
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Funcionalidades Integradas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para gerenciar todos os aspectos da segurança do trabalho portuário
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:border-accent transition-smooth shadow-soft hover:shadow-medium">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
