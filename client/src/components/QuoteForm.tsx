import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import QuoteResults from "./QuoteResults";
import ZipCodeInput from "./ZipCodeInput";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();
  const [rates, setRates] = useState<Rate[]>([]);
  const [quoteId, setQuoteId] = useState<string>("");
  const [formData, setFormData] = useState({
    fromZipCode: "",
    fromColonia: "",
    toZipCode: "",
    toColonia: "",
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
        setQuoteId(data.data.quoteId || "");
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

  const handleSelectRate = (rate: Rate) => {
    // Guardar datos de cotización para ir directo a crear envío
    const quoteData = {
      fromZipCode: formData.fromZipCode,
      toZipCode: formData.toZipCode,
      weight: formData.weight,
      length: formData.length,
      width: formData.width,
      height: formData.height,
      quoteId: quoteId,
      selectedRate: {
        id: rate.id,
        provider: rate.provider,
        service_level_name: rate.service_level_name,
        total_pricing: rate.total_pricing,
        currency: rate.currency,
        days: rate.days,
      }
    };
    
    localStorage.setItem('prefilledQuoteData', JSON.stringify(quoteData));
    
    toast({
      title: "Redirigiendo...",
      description: `Creando envío con ${rate.provider}`,
    });
    
    // Navegar a la página de crear envío
    setLocation('/crear-guia');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ZipCodeInput
              label="Código Postal Origen"
              zipCodeValue={formData.fromZipCode}
              coloniaValue={formData.fromColonia}
              onZipCodeChange={(value) => setFormData({ ...formData, fromZipCode: value })}
              onColoniaChange={(value) => setFormData({ ...formData, fromColonia: value })}
              required
              testId="input-from-zipcode"
            />

            <ZipCodeInput
              label="Código Postal Destino"
              zipCodeValue={formData.toZipCode}
              coloniaValue={formData.toColonia}
              onZipCodeChange={(value) => setFormData({ ...formData, toZipCode: value })}
              onColoniaChange={(value) => setFormData({ ...formData, toColonia: value })}
              required
              testId="input-to-zipcode"
            />
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

      {rates.length > 0 && <QuoteResults rates={rates} onSelectRate={handleSelectRate} />}
    </div>
  );
}
