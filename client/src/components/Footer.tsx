import { Package } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-card-border">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">
                Manuel Dev
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plataforma más completa para gestionar tus envíos en México.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-footer-home"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/cotizar"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-footer-quote"
                >
                  Cotizar Envío
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Manuel Dev. Todos los derechos reservados. Integración con
            Skydropx API.
          </p>
        </div>
      </div>
    </footer>
  );
}
