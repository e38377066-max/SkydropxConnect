import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, Clock } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/Modern_logistics_warehouse_interior_5aaae5e4.png";

export default function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-12 z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Envía Fácil, Rápido y Seguro
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-8 leading-relaxed">
            Cotiza y compara tarifas de múltiples paqueterías en tiempo real. 
            Crea guías de envío y rastrea tus paquetes desde un solo lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/cotizar">
              <Button size="lg" className="text-lg h-12 px-8 bg-white text-primary hover:bg-white/90 border-2 border-white" data-testid="button-quote-hero">
                Cotizar Envío Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/rastrear">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-12 px-8 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                data-testid="button-track-hero"
              >
                Rastrear Paquete
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 text-white">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">100% Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span className="text-sm font-medium">Múltiples Paqueterías</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Cotización Instantánea</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
