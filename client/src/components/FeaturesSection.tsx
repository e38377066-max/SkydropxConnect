import { Shield, Clock, BarChart3, MapPin, FileCheck, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Truck,
    title: "Múltiples Paqueterías",
    description: "Compara tarifas de DHL, FedEx, Estafeta, UPS y más en tiempo real",
  },
  {
    icon: Clock,
    title: "Cotización Instantánea",
    description: "Obtén precios actualizados al instante sin esperas ni complicaciones",
  },
  {
    icon: Shield,
    title: "Envíos Seguros",
    description: "Protección total de tus paquetes con seguro incluido",
  },
  {
    icon: BarChart3,
    title: "Panel de Control",
    description: "Administra todos tus envíos desde un solo lugar",
  },
  {
    icon: MapPin,
    title: "Rastreo en Tiempo Real",
    description: "Sigue tus paquetes paso a paso hasta su destino final",
  },
  {
    icon: FileCheck,
    title: "Guías Automáticas",
    description: "Genera y descarga etiquetas de envío al instante",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Características de la Plataforma
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todo lo que necesitas para gestionar tus envíos de forma profesional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover-elevate active-elevate-2 transition-all"
              data-testid={`card-feature-${index}`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
