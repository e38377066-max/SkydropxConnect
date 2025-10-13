import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {isAuthenticated ? "¿Listo para Empezar a Enviar?" : "¿Listo para Comenzar?"}
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          {isAuthenticated 
            ? "Cotiza gratis y descubre las mejores tarifas para tus envíos."
            : "Únete a miles de usuarios que confían en nosotros para sus envíos. Regístrate y obtén acceso completo a la plataforma."
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
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
              <Link href="/crear-guia">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg h-12 px-8 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                  data-testid="button-cta-create-shipment"
                >
                  Crear Envío
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="text-lg h-12 px-8 bg-white text-primary hover:bg-white/90 border-2 border-white"
                  data-testid="button-cta-get-started"
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
