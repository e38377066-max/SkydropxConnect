import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator, Package, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import QuoteResults from "./QuoteResults";

interface Rate {
  id: string;
  provider: string;
  service_level_name: string;
  total_pricing: number;
  currency: string;
  days: number;
  available_for_pickup: boolean;
}

export default function QuoteForm() {
  const { toast } = useToast();
  const [rates, setRates] = useState<Rate[]>([]);
  const [formData, setFormData] = useState({
    fromZipCode: "",
    toZipCode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const quoteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/quotes", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data.rates) {
        setRates(data.data.rates);
        toast({
          title: "Cotización generada",
          description: `Se encontraron ${data.data.rates.length} opciones de envío disponibles`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al cotizar",
        description: error.message || "No se pudieron obtener las cotizaciones",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    quoteMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cotizar Envío</h2>
            <p className="text-sm text-muted-foreground">Compara tarifas de múltiples paqueterías</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromZipCode" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Código Postal Origen
              </Label>
              <Input
                id="fromZipCode"
                name="fromZipCode"
                placeholder="06600"
                value={formData.fromZipCode}
                onChange={handleInputChange}
                required
                data-testid="input-from-zipcode"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toZipCode" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Código Postal Destino
              </Label>
              <Input
                id="toZipCode"
                name="toZipCode"
                placeholder="64000"
                value={formData.toZipCode}
                onChange={handleInputChange}
                required
                data-testid="input-to-zipcode"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Peso (kg)
            </Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              placeholder="1.5"
              value={formData.weight}
              onChange={handleInputChange}
              required
              data-testid="input-weight"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Largo (cm)</Label>
              <Input
                id="length"
                name="length"
                type="number"
                placeholder="30"
                value={formData.length}
                onChange={handleInputChange}
                data-testid="input-length"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Ancho (cm)</Label>
              <Input
                id="width"
                name="width"
                type="number"
                placeholder="20"
                value={formData.width}
                onChange={handleInputChange}
                data-testid="input-width"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Alto (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                placeholder="15"
                value={formData.height}
                onChange={handleInputChange}
                data-testid="input-height"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={quoteMutation.isPending} data-testid="button-submit-quote">
            {quoteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cotizando...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Cotizar Envío
              </>
            )}
          </Button>
        </form>
      </Card>

      {rates.length > 0 && <QuoteResults rates={rates} />}
    </div>
  );
}
