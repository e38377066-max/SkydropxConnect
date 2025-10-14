import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator, Package, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import QuoteResults from "./QuoteResults";
import ZipCodeInput from "./ZipCodeInput";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    packagingType: "",
  });

  const { data: packagesData } = useQuery<{ data: any[] }>({
    queryKey: ["/api/packages"],
  });

  const packages = packagesData?.data ?? [];

  const handlePackageSelect = (packageId: string) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      setFormData({
        ...formData,
        weight: selectedPackage.weight,
        length: selectedPackage.length,
        width: selectedPackage.width,
        height: selectedPackage.height,
      });
    }
  };

  const quoteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log("📤 Datos enviados a /api/quotes:", data);
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
    <div className="space-y-6 sm:space-y-8">
      <Card className="p-6 sm:p-8 lg:p-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cotizar Envío</h2>
            <p className="text-sm text-muted-foreground">Compara tarifas de múltiples paqueterías</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ZipCodeInput
              label="Código Postal Origen"
              zipCodeValue={formData.fromZipCode}
              coloniaValue={formData.fromColonia}
              onZipCodeChange={(value) => {
                console.log("🔵 Origen - CP cambiado a:", value);
                setFormData(prev => ({ ...prev, fromZipCode: value }));
              }}
              onColoniaChange={(value) => {
                console.log("🔵 Origen - Colonia cambiada a:", value);
                setFormData(prev => ({ ...prev, fromColonia: value }));
              }}
              required
              testId="input-from-zipcode"
            />

            <ZipCodeInput
              label="Código Postal Destino"
              zipCodeValue={formData.toZipCode}
              coloniaValue={formData.toColonia}
              onZipCodeChange={(value) => {
                console.log("🟢 Destino - CP cambiado a:", value);
                setFormData(prev => ({ ...prev, toZipCode: value }));
              }}
              onColoniaChange={(value) => {
                console.log("🟢 Destino - Colonia cambiada a:", value);
                setFormData(prev => ({ ...prev, toColonia: value }));
              }}
              required
              testId="input-to-zipcode"
            />
          </div>

          {packages.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="saved-package">Usar Paquete Guardado (Opcional)</Label>
              <Select onValueChange={handlePackageSelect}>
                <SelectTrigger data-testid="select-saved-package">
                  <SelectValue placeholder="Selecciona un paquete guardado" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg: any) => (
                    <SelectItem key={pkg.id} value={pkg.id} data-testid={`package-option-${pkg.id}`}>
                      {pkg.alias}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="packaging-type">Tipo de empaque</Label>
            <Select
              value={formData.packagingType}
              onValueChange={(value) => setFormData({ ...formData, packagingType: value })}
            >
              <SelectTrigger id="packaging-type" data-testid="select-packaging-type">
                <SelectValue placeholder="Selecciona el tipo de empaque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XBX-Caja">Caja de cartón</SelectItem>
                <SelectItem value="Tarima">Tarima</SelectItem>
                <SelectItem value="Sobre">Sobre</SelectItem>
                <SelectItem value="Otros">Otros empaques</SelectItem>
                <SelectItem value="Saco-Plastico">Saco (bolsa) de película de plástico</SelectItem>
                <SelectItem value="Saco-Papel">Saco (bolsa) de papel de varias hojas</SelectItem>
                <SelectItem value="Bulto-Plastico">Bulto de plástico</SelectItem>
              </SelectContent>
            </Select>
            {formData.packagingType === "Sobre" && parseFloat(formData.weight) >= 1 && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                El sobre debe pesar menos de 1 kg
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Peso
            </Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={handleInputChange}
              placeholder="Peso"
              required
              data-testid="input-weight"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <Label htmlFor="length">Largo (cm)</Label>
              <Input
                id="length"
                name="length"
                type="number"
                value={formData.length}
                onChange={handleInputChange}
                placeholder="Largo"
                data-testid="input-length"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="width">Ancho (cm)</Label>
              <Input
                id="width"
                name="width"
                type="number"
                value={formData.width}
                onChange={handleInputChange}
                placeholder="Ancho"
                data-testid="input-width"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="height">Alto (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="Alto"
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
