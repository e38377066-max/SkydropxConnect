import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function QuickQuoteSection() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fromZipCode: "",
    toZipCode: "",
    packagingType: "Caja",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const quoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotes", {
        ...data,
        fromColonia: "Centro",
        toColonia: "Centro",
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data.rates) {
        localStorage.setItem('quickQuoteData', JSON.stringify({
          ...formData,
          rates: data.data.rates,
          quoteId: data.data.quoteId,
        }));
        setLocation('/cotizar');
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

  return (
    <section className="py-12 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-primary rounded-3xl shadow-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Cotiza gratis tu envío
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Origen */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Origen</label>
                <Input
                  type="text"
                  placeholder="Código Postal"
                  value={formData.fromZipCode}
                  onChange={(e) => setFormData({ ...formData, fromZipCode: e.target.value })}
                  className="bg-white border-0 h-12"
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  data-testid="quick-input-from-zipcode"
                />
              </div>

              {/* Destino */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Destino</label>
                <Input
                  type="text"
                  placeholder="Código Postal"
                  value={formData.toZipCode}
                  onChange={(e) => setFormData({ ...formData, toZipCode: e.target.value })}
                  className="bg-white border-0 h-12"
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  data-testid="quick-input-to-zipcode"
                />
              </div>

              {/* Tipo de envío */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Tipo de envío</label>
                <Select
                  value={formData.packagingType}
                  onValueChange={(value) => setFormData({ ...formData, packagingType: value })}
                >
                  <SelectTrigger className="bg-white border-0 h-12" data-testid="quick-select-packaging">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Caja">Caja</SelectItem>
                    <SelectItem value="Sobre">Sobre</SelectItem>
                    <SelectItem value="Tarima">Tarima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Peso */}
              <div className="space-y-2">
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

              {/* Dimensiones */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">Tamaño de caja (cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Largo"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="bg-white border-0 h-12 text-sm"
                    data-testid="quick-input-length"
                  />
                  <Input
                    type="number"
                    placeholder="Alto"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="bg-white border-0 h-12 text-sm"
                    data-testid="quick-input-height"
                  />
                  <Input
                    type="number"
                    placeholder="Ancho"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="bg-white border-0 h-12 text-sm"
                    data-testid="quick-input-width"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-12 h-12 text-lg font-semibold rounded-full shadow-lg"
                disabled={quoteMutation.isPending}
                data-testid="quick-button-quote"
              >
                {quoteMutation.isPending ? "Cotizando..." : "Cotizar envío"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
