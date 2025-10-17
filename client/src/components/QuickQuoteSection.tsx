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
    <section className="py-8 bg-gradient-to-b from-background to-primary/5">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-primary rounded-3xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-5">
            Cotiza gratis tu envío
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-end gap-3">
              {/* Origen */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-white text-sm font-medium block mb-1">Origen</label>
                <ZipCodeInput
                  zipCodeValue={formData.fromZipCode}
                  coloniaValue={formData.fromColonia}
                  onZipCodeChange={(value) => setFormData(prev => ({ ...prev, fromZipCode: value }))}
                  onColoniaChange={(value) => setFormData(prev => ({ ...prev, fromColonia: value }))}
                  required
                  testId="quick-input-from-zipcode"
                />
              </div>

              {/* Destino */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-white text-sm font-medium block mb-1">Destino</label>
                <ZipCodeInput
                  zipCodeValue={formData.toZipCode}
                  coloniaValue={formData.toColonia}
                  onZipCodeChange={(value) => setFormData(prev => ({ ...prev, toZipCode: value }))}
                  onColoniaChange={(value) => setFormData(prev => ({ ...prev, toColonia: value }))}
                  required
                  testId="quick-input-to-zipcode"
                />
              </div>

              {/* Tipo de envío */}
              <div className="w-[120px]">
                <label className="text-white text-sm font-medium block mb-1">Tipo de envío</label>
                <Select
                  value={formData.packagingType}
                  onValueChange={(value) => setFormData({ ...formData, packagingType: value })}
                >
                  <SelectTrigger className="bg-white border-0 h-10" data-testid="quick-select-packaging">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XBX-Caja">Caja</SelectItem>
                    <SelectItem value="Sobre">Sobre</SelectItem>
                    <SelectItem value="Tarima">Tarima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Peso */}
              <div className="w-[90px]">
                <label className="text-white text-sm font-medium block mb-1">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-white border-0 h-10"
                  required
                  data-testid="quick-input-weight"
                />
              </div>

              {/* Dimensiones (cm) - agrupado */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-white text-sm font-medium block mb-1">Tamaño en (cm)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Largo"
                    value={formData.length}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    className="bg-white border-0 h-10"
                    data-testid="quick-input-length"
                  />
                  <Input
                    type="number"
                    placeholder="Alto"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="bg-white border-0 h-10"
                    data-testid="quick-input-height"
                  />
                  <Input
                    type="number"
                    placeholder="Ancho"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                    className="bg-white border-0 h-10"
                    data-testid="quick-input-width"
                  />
                </div>
              </div>

              {/* Botón */}
              <div>
                <Button
                  type="submit"
                  className="bg-white text-primary hover:bg-white/90 h-10 px-8 font-bold whitespace-nowrap shadow-md"
                  disabled={quoteMutation.isPending}
                  data-testid="quick-button-quote"
                >
                  {quoteMutation.isPending ? "Cotizando..." : "Cotizar envío"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Resultados de cotización */}
        {rates.length > 0 && <QuoteResults rates={rates} onSelectRate={handleSelectRate} />}
      </div>
    </section>
  );
}
