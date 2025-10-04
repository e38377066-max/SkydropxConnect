import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import { Link } from "wouter";

export default function CTASection() {
  return (
    <section className="py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          ¿Listo para Empezar a Enviar?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Únete a miles de usuarios que confían en nosotros para sus envíos. 
          Cotiza gratis y descubre las mejores tarifas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cotizar">
            <Button 
              size="lg" 
              className="text-lg h-12 px-8 bg-white text-primary hover:bg-white/90 border-2 border-white"
              data-testid="button-cta-quote"
            >
              Cotizar Ahora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg h-12 px-8 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
            data-testid="button-cta-contact"
          >
            Contactar Ventas
          </Button>
        </div>
      </div>
    </section>
  );
}
