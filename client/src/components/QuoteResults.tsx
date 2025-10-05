import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, Check } from "lucide-react";

interface Rate {
  id: string;
  provider: string;
  service_level_name: string;
  total_pricing: number;
  currency: string;
  days: number;
  available_for_pickup: boolean;
}

interface QuoteResultsProps {
  rates: Rate[];
  onSelectRate?: (rate: Rate) => void;
}

export default function QuoteResults({ rates, onSelectRate }: QuoteResultsProps) {
  if (rates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">
        Opciones de Envío Disponibles
      </h3>

      <div className="space-y-3">
        {rates.map((rate, index) => (
          <Card
            key={rate.id}
            className="p-6 hover-elevate active-elevate-2 transition-all"
            data-testid={`card-rate-${index}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      {rate.provider}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {rate.service_level_name}
                    </p>
                  </div>
                  {index === 0 && (
                    <Badge variant="default" className="ml-2" data-testid={`badge-best-rate`}>
                      Mejor Precio
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{rate.days} {rate.days === 1 ? 'día' : 'días'} hábiles</span>
                  </div>
                  {rate.available_for_pickup && (
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Recolección disponible</span>
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
                    Seleccionar
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
