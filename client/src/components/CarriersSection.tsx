import { Card } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { getCarrierLogo } from "@/lib/carrierLogos";

const carriers = [
  { name: "DHL" },
  { name: "FedEx" },
  { name: "Estafeta" },
  { name: "UPS" },
  { name: "Redpack" },
  { name: "99 Minutos" },
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
          {carriers.map((carrier, index) => {
            const logo = getCarrierLogo(carrier.name);
            
            return (
              <Card 
                key={index} 
                className="p-6 flex flex-col items-center justify-center gap-3 hover-elevate active-elevate-2 transition-all bg-white dark:bg-card"
                data-testid={`card-carrier-${carrier.name.toLowerCase().replace(' ', '-')}`}
              >
                <div className="w-20 h-20 flex items-center justify-center">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt={`${carrier.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Truck className="w-10 h-10 text-primary" />
                  )}
                </div>
                <span className="font-semibold text-foreground text-center">{carrier.name}</span>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
