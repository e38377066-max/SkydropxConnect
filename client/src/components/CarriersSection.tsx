import { Card } from "@/components/ui/card";
import { Truck, Package, Plane, Ship } from "lucide-react";

const carriers = [
  { name: "DHL", icon: Truck },
  { name: "FedEx", icon: Plane },
  { name: "Estafeta", icon: Package },
  { name: "UPS", icon: Ship },
  { name: "Redpack", icon: Truck },
  { name: "99 Minutos", icon: Package },
];

export default function CarriersSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Paqueterías Integradas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Accede a las mejores tarifas de las principales paqueterías de México
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {carriers.map((carrier, index) => (
            <Card 
              key={index} 
              className="p-6 flex flex-col items-center justify-center gap-3 hover-elevate active-elevate-2 transition-all"
              data-testid={`card-carrier-${carrier.name.toLowerCase().replace(' ', '-')}`}
            >
              <carrier.icon className="w-10 h-10 text-primary" />
              <span className="font-semibold text-foreground text-center">{carrier.name}</span>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
