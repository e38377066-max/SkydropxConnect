import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, User, MapPin, Package, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ShipmentForm() {
  const { toast } = useToast();
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    senderZipCode: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverZipCode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    description: "",
    carrier: "Estafeta",
  });

  const shipmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/shipments", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data) {
        setCreatedShipment(data.data);
        queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
        toast({
          title: "¡Guía creada exitosamente!",
          description: `Número de rastreo: ${data.data.trackingNumber}`,
        });
        
        setFormData({
          senderName: "",
          senderPhone: "",
          senderAddress: "",
          senderZipCode: "",
          receiverName: "",
          receiverPhone: "",
          receiverAddress: "",
          receiverZipCode: "",
          weight: "",
          length: "",
          width: "",
          height: "",
          description: "",
          carrier: "Estafeta",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear la guía",
        description: error.message || "No se pudo crear la guía de envío",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    shipmentMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      {createdShipment && (
        <Card className="p-6 bg-primary/5 border-primary">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Guía Creada Exitosamente
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Número de rastreo: <span className="font-mono font-semibold">{createdShipment.trackingNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Paquetería: {createdShipment.carrier} | Monto: ${parseFloat(createdShipment.amount).toFixed(2)} {createdShipment.currency}
              </p>
            </div>
            {createdShipment.labelUrl && (
              <Button asChild data-testid="button-download-label">
                <a href={createdShipment.labelUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Etiqueta
                </a>
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Crear Guía de Envío</h2>
            <p className="text-sm text-muted-foreground">Completa los datos para generar tu etiqueta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Datos del Remitente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Nombre Completo</Label>
                <Input
                  id="senderName"
                  name="senderName"
                  placeholder="Juan Pérez"
                  value={formData.senderName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-sender-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderPhone">Teléfono</Label>
                <Input
                  id="senderPhone"
                  name="senderPhone"
                  placeholder="5512345678"
                  value={formData.senderPhone}
                  onChange={handleInputChange}
                  required
                  data-testid="input-sender-phone"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="senderAddress">Dirección Completa</Label>
                <Input
                  id="senderAddress"
                  name="senderAddress"
                  placeholder="Calle, Número, Colonia"
                  value={formData.senderAddress}
                  onChange={handleInputChange}
                  required
                  data-testid="input-sender-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderZipCode">Código Postal</Label>
                <Input
                  id="senderZipCode"
                  name="senderZipCode"
                  placeholder="06600"
                  value={formData.senderZipCode}
                  onChange={handleInputChange}
                  required
                  data-testid="input-sender-zipcode"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Datos del Destinatario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiverName">Nombre Completo</Label>
                <Input
                  id="receiverName"
                  name="receiverName"
                  placeholder="María García"
                  value={formData.receiverName}
                  onChange={handleInputChange}
                  required
                  data-testid="input-receiver-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiverPhone">Teléfono</Label>
                <Input
                  id="receiverPhone"
                  name="receiverPhone"
                  placeholder="8112345678"
                  value={formData.receiverPhone}
                  onChange={handleInputChange}
                  required
                  data-testid="input-receiver-phone"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="receiverAddress">Dirección Completa</Label>
                <Input
                  id="receiverAddress"
                  name="receiverAddress"
                  placeholder="Calle, Número, Colonia"
                  value={formData.receiverAddress}
                  onChange={handleInputChange}
                  required
                  data-testid="input-receiver-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiverZipCode">Código Postal</Label>
                <Input
                  id="receiverZipCode"
                  name="receiverZipCode"
                  placeholder="64000"
                  value={formData.receiverZipCode}
                  onChange={handleInputChange}
                  required
                  data-testid="input-receiver-zipcode"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Datos del Paquete
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                  data-testid="input-shipment-weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del contenido</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe brevemente el contenido del paquete"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  data-testid="input-description"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={shipmentMutation.isPending} data-testid="button-submit-shipment">
            {shipmentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando Guía...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Crear Guía de Envío
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
