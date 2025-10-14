import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, Check, MapPin, Home, AlertCircle, Shield } from "lucide-react";
import { getCarrierLogo } from "@/lib/carrierLogos";

interface Rate {
  id: string;
  provider: string;
  service_level_name: string;
  total_pricing: number;
  currency: string;
  days: number;
  available_for_pickup: boolean;
  // Campos adicionales
  out_of_area_service?: boolean;
  out_of_area_pricing?: number;
  is_occure?: boolean;
  insurable?: boolean;
  amount_local?: number;
  extra_fees?: Array<{
    name: string;
    amount: number;
  }>;
}

interface QuoteResultsProps {
  rates: Rate[];
  onSelectRate?: (rate: Rate) => void;
}

export default function QuoteResults({ rates, onSelectRate }: QuoteResultsProps) {
  if (rates.length === 0) {
    return null;
  }

  // Ordenar rates por precio (más barato primero)
  const sortedRates = [...rates].sort((a, b) => a.total_pricing - b.total_pricing);
  
  // Encontrar el precio más bajo para marcar como "Mejor Precio"
  const lowestPrice = sortedRates[0]?.total_pricing;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Opciones de Envío Disponibles
      </h3>

      <div className="space-y-3">
        {sortedRates.map((rate, index) => (
          <Card
            key={rate.id}
            className="p-6 hover-elevate active-elevate-2 transition-all"
            data-testid={`card-rate-${index}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-100 border border-border flex items-center justify-center p-2">
                    {getCarrierLogo(rate.provider) ? (
                      <img 
                        src={getCarrierLogo(rate.provider)!} 
                        alt={`${rate.provider} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Truck className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      {rate.provider}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {rate.service_level_name}
                    </p>
                  </div>
                  {rate.total_pricing === lowestPrice && (
                    <Badge variant="default" className="ml-2" data-testid={`badge-best-rate`}>
                      Mejor Precio
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{rate.days} {rate.days === 1 ? 'día' : 'días'} hábiles</span>
                    </div>
                    
                    {/* Tipo de entrega */}
                    {rate.is_occure ? (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <MapPin className="w-4 h-4" />
                        <span>Entrega a paquetería</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        <span>Entrega a domicilio</span>
                      </div>
                    )}
                    
                    {rate.available_for_pickup && (
                      <div className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-primary" />
                        <span>Recolección disponible</span>
                      </div>
                    )}
                    
                    {rate.insurable && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Shield className="w-4 h-4" />
                        <span>Asegurable</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Cargos extra */}
                  {rate.extra_fees && rate.extra_fees.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div className="text-amber-600 dark:text-amber-400">
                        <span className="font-medium">Cargos extra: </span>
                        {rate.extra_fees.map((fee, idx) => (
                          <span key={idx}>
                            {fee.name} ${fee.amount.toFixed(2)}
                            {idx < rate.extra_fees!.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">
                    ${rate.total_pricing.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">{rate.currency}</p>
                </div>

                {onSelectRate && (
                  <Button
                    onClick={() => onSelectRate(rate)}
                    data-testid={`button-select-rate-${index}`}
                  >
                    Enviar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
