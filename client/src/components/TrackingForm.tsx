import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Search, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import TrackingTimeline from "./TrackingTimeline";

export default function TrackingForm() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingData, setTrackingData] = useState<any>(null);

  const trackMutation = useMutation({
    mutationFn: async (number: string) => {
      const response = await apiRequest("GET", `/api/tracking/${number}`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data) {
        setTrackingData(data.data);
        toast({
          title: "Paquete encontrado",
          description: `Estado: ${data.data.tracking.status}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al rastrear",
        description: error.message || "No se pudo encontrar el paquete",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackMutation.mutate(trackingNumber);
  };

  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Rastrear Paquete</h2>
            <p className="text-sm text-muted-foreground">Consulta el estado de tu envío en tiempo real</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber" className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Número de Guía
            </Label>
            <Input
              id="trackingNumber"
              name="trackingNumber"
              placeholder="SKY123456789MX"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              required
              className="font-mono"
              data-testid="input-tracking-number"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el número de guía que recibiste al crear tu envío
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={trackMutation.isPending} data-testid="button-submit-tracking">
            {trackMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Rastrear Paquete
              </>
            )}
          </Button>
        </form>
      </Card>

      {trackingData && (
        <TrackingTimeline
          events={trackingData.tracking.history}
          shipment={trackingData.shipment}
        />
      )}
    </div>
  );
}
