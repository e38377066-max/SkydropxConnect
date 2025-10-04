import { Package, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-card-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">EnvíosExpress</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plataforma más completa para gestionar tus envíos en México.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cotizar">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-quote">
                    Cotizar Envío
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/crear-guia">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-create">
                    Crear Guía
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/rastrear">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-track">
                    Rastrear Paquete
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/envios">
                  <a className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-shipments">
                    Mis Envíos
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                contacto@enviosexpress.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                01 800 123 4567
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                Ciudad de México, México
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 EnvíosExpress. Todos los derechos reservados. Integración con Skydropx API.
          </p>
        </div>
      </div>
    </footer>
  );
}
