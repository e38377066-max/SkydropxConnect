import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ZipCodeInput from "./ZipCodeInput";
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

export default function QuickQuoteSection() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [rates, setRates] = useState<Rate[]>([]);
  const [quoteId, setQuoteId] = useState<string>("");
  const [formData, setFormData] = useState({
    fromZipCode: "",
    fromColonia: "",
    toZipCode: "",
    toColonia: "",
    packagingType: "XBX-Caja",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    quoteMutation.mutate(formData);
  };

  const handleSelectRate = (rate: Rate) => {
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
    
    setLocation('/crear-guia');
  };

  return (
    <section className="py-12 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="bg-primary rounded-3xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Cotiza gratis tu envío
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Origen - 2 columnas */}
              <div className="space-y-2 lg:col-span-2">
                <label className="text-white text-sm font-medium block">Origen</label>
                <ZipCodeInput
                  zipCodeValue={formData.fromZipCode}
                  coloniaValue={formData.fromColonia}
                  onZipCodeChange={(value) => setFormData({ ...formData, fromZipCode: value })}
                  onColoniaChange={(value) => setFormData({ ...formData, fromColonia: value })}
                  required
                  testId="quick-input-from-zipcode"
                />
              </div>

              {/* Destino - 2 columnas */}
              <div className="space-y-2 lg:col-span-2">
                <label className="text-white text-sm font-medium block">Destino</label>
                <ZipCodeInput
                  zipCodeValue={formData.toZipCode}
                  coloniaValue={formData.toColonia}
                  onZipCodeChange={(value) => setFormData({ ...formData, toZipCode: value })}
                  onColoniaChange={(value) => setFormData({ ...formData, toColonia: value })}
                  required
                  testId="quick-input-to-zipcode"
                />
              </div>

              {/* Tipo de envío - 1 columna */}
              <div className="space-y-2 lg:col-span-1">
                <label className="text-white text-sm font-medium block">Tipo de envío</label>
                <Select
                  value={formData.packagingType}
                  onValueChange={(value) => setFormData({ ...formData, packagingType: value })}
                >
                  <SelectTrigger className="bg-white border-0 h-12" data-testid="quick-select-packaging">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XBX-Caja">Caja</SelectItem>
                    <SelectItem value="Sobre">Sobre</SelectItem>
                    <SelectItem value="Tarima">Tarima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Peso - 1 columna */}
              <div className="space-y-2 lg:col-span-1">
                <label className="text-white text-sm font-medium block">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-white border-0 h-12"
                  required
                  data-testid="quick-input-weight"
                />
              </div>
            </div>

            {/* Dimensiones en segunda fila */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Largo (cm)</label>
                <Input
                  type="number"
                  placeholder="Largo"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="bg-white border-0 h-12"
                  data-testid="quick-input-length"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Alto (cm)</label>
                <Input
                  type="number"
                  placeholder="Alto"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="bg-white border-0 h-12"
                  data-testid="quick-input-height"
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Ancho (cm)</label>
                <Input
                  type="number"
                  placeholder="Ancho"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  className="bg-white border-0 h-12"
                  data-testid="quick-input-width"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                className="bg-white text-primary hover:bg-white/90 px-12 h-12 text-lg font-semibold rounded-full shadow-lg"
                disabled={quoteMutation.isPending}
                data-testid="quick-button-quote"
              >
                {quoteMutation.isPending ? "Cotizando..." : "Cotizar envío"}
              </Button>
            </div>
          </form>
        </div>

        {/* Resultados de cotización */}
        {rates.length > 0 && <QuoteResults rates={rates} onSelectRate={handleSelectRate} />}
      </div>
    </section>
  );
}
