import { Calculator, FileText, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Calculator,
    title: "1. Cotiza",
    description: "Ingresa los datos de origen, destino y paquete. Compara tarifas de DHL, FedEx, Estafeta y más en segundos.",
  },
  {
    icon: FileText,
    title: "2. Genera tu Guía",
    description: "Elige la mejor opción y crea tu guía de envío. Descarga e imprime tu etiqueta al instante.",
  },
  {
    icon: MapPin,
    title: "3. Rastrea",
    description: "Sigue tu paquete en tiempo real. Recibe actualizaciones del estado de tu envío hasta la entrega.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-background">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Cómo Funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tres pasos simples para enviar tus paquetes de forma profesional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="p-8 hover-elevate active-elevate-2 transition-shadow"
              data-testid={`card-step-${index + 1}`}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
