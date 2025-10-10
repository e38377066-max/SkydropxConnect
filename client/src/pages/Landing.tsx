import { Button } from "@/components/ui/button";
import { Package, Truck, MapPin, ShieldCheck } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen">
      <div 
        className="relative bg-gradient-to-br from-primary/20 via-background to-background min-h-[600px] flex items-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Gestiona tus envíos de forma profesional
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Cotiza tarifas en tiempo real, crea guías de envío y rastrea tus paquetes con la plataforma más completa de México.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                data-testid="button-login"
              >
                Iniciar Sesión
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleLogin}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                data-testid="button-signup"
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Cotizaciones Instantáneas</h3>
            <p className="text-muted-foreground">
              Compara tarifas de múltiples paqueterías en segundos
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Creación de Guías</h3>
            <p className="text-muted-foreground">
              Genera etiquetas de envío listas para imprimir
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Rastreo en Tiempo Real</h3>
            <p className="text-muted-foreground">
              Monitorea tus paquetes en cada etapa del envío
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Integración Segura</h3>
            <p className="text-muted-foreground">
              Conectado con la API oficial de Skydropx
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border-t border-card-border py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">¿Listo para empezar?</h2>
          <p className="text-muted-foreground mb-8">
            Únete a miles de empresas que confían en nuestra plataforma para gestionar sus envíos
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            data-testid="button-get-started"
          >
            Comenzar Ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
