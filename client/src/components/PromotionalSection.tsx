import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: string;
  displayOrder: string;
}

export default function PromotionalSection() {
  const { data: bannersData } = useQuery<{ data: Banner[] }>({
    queryKey: ["/api/banners/active"],
  });

  const activeBanners = bannersData?.data?.filter(banner => banner.isActive === "true") || [];
  
  // Obtener el primer banner activo
  const mainBanner = activeBanners.sort((a, b) => 
    parseInt(a.displayOrder) - parseInt(b.displayOrder)
  )[0];

  if (!mainBanner) {
    // Banner por defecto si no hay ninguno configurado
    return (
      <section className="py-16 bg-gradient-to-br from-background to-primary/5">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-6 h-6 text-primary" />
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Envíos baratos desde $89 mxn
                </p>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Obtén hasta{" "}
                <span className="text-orange-500">70% de descuento</span>{" "}
                en el envío de tus paquetes
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Descubre cómo hacer crecer tu negocio enviando a todo México usando guías prepagadas desde una misma plataforma mientras ahorras dinero.
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 h-12 text-lg font-semibold rounded-full shadow-lg"
                data-testid="button-register-promo"
              >
                Regístrate gratis
              </Button>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=800&fit=crop"
                  alt="Persona empacando"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decoración */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background to-primary/5">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-6 h-6 text-primary" />
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                Envíos baratos desde $89 mxn
              </p>
            </div>
            <div 
              className="text-5xl md:text-6xl font-bold mb-6"
              dangerouslySetInnerHTML={{ __html: mainBanner.title }}
            />
            <p className="text-lg text-muted-foreground mb-8">
              Descubre cómo hacer crecer tu negocio enviando a todo México usando guías prepagadas desde una misma plataforma mientras ahorras dinero.
            </p>
            {mainBanner.linkUrl && (
              <a href={mainBanner.linkUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white px-8 h-12 text-lg font-semibold rounded-full shadow-lg"
                  data-testid="button-promo-cta"
                >
                  Regístrate gratis
                </Button>
              </a>
            )}
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={mainBanner.imageUrl}
                alt={mainBanner.title.replace(/<[^>]*>/g, '')}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decoración */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
