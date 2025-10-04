import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator, Package, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuoteForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromZipCode: "",
    toZipCode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Cotizando envío:", formData);
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Cotización generada",
        description: "Se encontraron 5 opciones de envío disponibles",
      });
    }, 1500);
  };

  return (
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
              required
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
              required
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
              required
              data-testid="input-height"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading} data-testid="button-submit-quote">
          {loading ? (
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
  );
}
