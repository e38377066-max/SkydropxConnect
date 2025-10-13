import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, User, MapPin, Package, Loader2, Download, ArrowLeft, ArrowRight, Check, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ZipCodeInput from "@/components/ZipCodeInput";
import { getCarrierLogo } from "@/lib/carrierLogos";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface QuoteRate {
  id: string;
  provider: string;
  service_level_name: string;
  total_pricing: number;
  currency: string;
  days: number;
}

export default function ShipmentForm() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [selectedRate, setSelectedRate] = useState<QuoteRate | null>(null);
  const [quoteId, setQuoteId] = useState<string>("");
  const [allRates, setAllRates] = useState<QuoteRate[]>([]);
  const [fromQuote, setFromQuote] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    senderZipCode: "",
    senderColonia: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverZipCode: "",
    receiverColonia: "",
    weight: "1",
    length: "10",
    width: "10",
    height: "10",
    description: "",
  });

  // Obtener saldo del usuario
  const { data: userData } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  const userBalance = userData?.balance ? parseFloat(userData.balance) : 0;

  // Cargar datos pre-llenados desde cotización (si existen)
  useEffect(() => {
    const prefilledData = localStorage.getItem('prefilledQuoteData');
    if (prefilledData) {
      try {
        const data = JSON.parse(prefilledData);
        
        // Pre-llenar datos del paquete
        setFormData(prev => ({
          ...prev,
          senderZipCode: data.fromZipCode || "",
          receiverZipCode: data.toZipCode || "",
          weight: data.weight || "1",
          length: data.length || "10",
          width: data.width || "10",
          height: data.height || "10",
        }));
        
        // Si hay cotización completa (quoteId + selectedRate), quedarse en paso 1 pero marcar como fromQuote
        if (data.quoteId && data.selectedRate) {
          setQuoteId(data.quoteId);
          setSelectedRate(data.selectedRate);
          setFromQuote(true);
          
          toast({
            title: "Cotización cargada",
            description: `${data.selectedRate.provider} seleccionada. Completa los datos del envío.`,
          });
        }
        
        // Limpiar localStorage después de cargar
        localStorage.removeItem('prefilledQuoteData');
      } catch (error) {
        console.error('Error loading prefilled data:', error);
      }
    }
  }, []);

  // Mutación para cotizar
  const quoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quotes", {
        fromZipCode: formData.senderZipCode,
        toZipCode: formData.receiverZipCode,
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data) {
        setQuoteId(data.data.quoteId);
        if (data.data.rates && data.data.rates.length > 0) {
          setAllRates(data.data.rates);
          
          // Si venía de cotización, intentar auto-seleccionar la misma paquetería
          if (fromQuote && selectedRate) {
            const matchingRate = data.data.rates.find(
              (rate: QuoteRate) => rate.provider === selectedRate.provider
            );
            if (matchingRate) {
              setSelectedRate(matchingRate);
              // Si encontramos la misma paquetería, crear el envío automáticamente
              toast({
                title: "Cotización actualizada",
                description: `${matchingRate.provider} confirmada. Creando envío...`,
              });
              // Crear envío después de un pequeño delay para que se vea el toast
              setTimeout(() => {
                shipmentMutation.mutate();
              }, 500);
            } else {
              // Si no encontramos la paquetería, ir al paso 2 para seleccionar
              setFromQuote(false);
              setStep(2);
              toast({
                title: "Paquetería no disponible",
                description: "La paquetería seleccionada ya no está disponible. Por favor, selecciona otra.",
                variant: "destructive",
              });
            }
          } else {
            setStep(2);
          }
        } else {
          toast({
            title: "No hay cotizaciones disponibles",
            description: "No se encontraron opciones para esta ruta",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al cotizar",
        description: error.message || "No se pudo obtener cotizaciones",
        variant: "destructive",
      });
    },
  });

  // Mutación para crear envío
  const shipmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRate) throw new Error("No hay cotización seleccionada");
      
      const response = await apiRequest("POST", "/api/shipments", {
        ...formData,
        carrier: selectedRate.provider,
        rateId: selectedRate.id,
        expectedAmount: selectedRate.total_pricing,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data) {
        setCreatedShipment(data.data);
        queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
        setStep(3);
        toast({
          title: "¡Guía creada exitosamente!",
          description: data.data.trackingNumber 
            ? `Número de rastreo: ${data.data.trackingNumber}` 
            : "Tu envío está siendo procesado por la paquetería",
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
    
    // Si modifica datos del paquete y venía de cotización, resetear y volver al paso 1
    const packageFields = ['weight', 'length', 'width', 'height', 'senderZipCode', 'receiverZipCode'];
    if (packageFields.includes(e.target.name) && fromQuote) {
      setSelectedRate(null);
      setAllRates([]);
      setQuoteId("");
      setFromQuote(false);
      setStep(1);
      toast({
        title: "Datos modificados",
        description: "Deberás cotizar nuevamente con los nuevos datos.",
      });
    }
  };

  const handleZipCodeChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Si modifica códigos postales y venía de cotización, resetear y volver al paso 1
    if ((field === 'senderZipCode' || field === 'receiverZipCode') && fromQuote) {
      setSelectedRate(null);
      setAllRates([]);
      setQuoteId("");
      setFromQuote(false);
      setStep(1);
      toast({
        title: "Datos modificados",
        description: "Deberás cotizar nuevamente con los nuevos datos.",
      });
    }
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Siempre re-cotizar para obtener rate_id fresco (evita errores de expiración)
    quoteMutation.mutate();
  };

  const handleShipmentSubmit = () => {
    if (!selectedRate) {
      toast({
        title: "Selecciona una paquetería",
        description: "Debes seleccionar una opción para continuar",
        variant: "destructive",
      });
      return;
    }

    // Verificar saldo
    if (userBalance < selectedRate.total_pricing) {
      toast({
        title: "Saldo insuficiente",
        description: `Necesitas $${selectedRate.total_pricing.toFixed(2)} MXN pero solo tienes $${userBalance.toFixed(2)} MXN`,
        variant: "destructive",
      });
      return;
    }

    shipmentMutation.mutate();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedRate(null);
    setQuoteId("");
    setCreatedShipment(null);
    setFormData({
      senderName: "",
      senderPhone: "",
      senderAddress: "",
      senderZipCode: "",
      senderColonia: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      receiverZipCode: "",
      receiverColonia: "",
      weight: "1",
      length: "10",
      width: "10",
      height: "10",
      description: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="text-sm font-medium">Datos</span>
        </div>
        <div className="w-16 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {step > 2 ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="text-sm font-medium">Cotizaciones</span>
        </div>
        <div className="w-16 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {step === 3 ? <Check className="w-4 h-4" /> : '3'}
          </div>
          <span className="text-sm font-medium">Guía Creada</span>
        </div>
      </div>

      <Card className="p-8">
        {/* PASO 1: Formulario de datos */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">Crear Envío</h2>
                <p className="text-sm text-muted-foreground">Completa los datos para generar tu etiqueta</p>
              </div>
              {fromQuote && selectedRate && (
                <Badge variant="default" className="gap-2">
                  <Check className="w-4 h-4" />
                  {selectedRate.provider} - ${selectedRate.total_pricing.toFixed(2)}
                </Badge>
              )}
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-8">
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
              <div className="md:col-span-2">
                <ZipCodeInput
                  zipCodeLabel="Código Postal de Origen"
                  coloniaLabel="Colonia de Origen"
                  zipCodeValue={formData.senderZipCode}
                  coloniaValue={formData.senderColonia}
                  onZipCodeChange={(value) => handleZipCodeChange('senderZipCode', value)}
                  onColoniaChange={(value) => setFormData({ ...formData, senderColonia: value })}
                  required
                  zipCodeTestId="input-sender-zipcode"
                  coloniaTestId="select-sender-colonia"
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
              <div className="md:col-span-2">
                <ZipCodeInput
                  zipCodeLabel="Código Postal de Destino"
                  coloniaLabel="Colonia de Destino"
                  zipCodeValue={formData.receiverZipCode}
                  coloniaValue={formData.receiverColonia}
                  onZipCodeChange={(value) => handleZipCodeChange('receiverZipCode', value)}
                  onColoniaChange={(value) => setFormData({ ...formData, receiverColonia: value })}
                  required
                  zipCodeTestId="input-receiver-zipcode"
                  coloniaTestId="select-receiver-colonia"
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

              <Button type="submit" className="w-full" disabled={quoteMutation.isPending || shipmentMutation.isPending} data-testid="button-get-quotes">
                {quoteMutation.isPending || shipmentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {shipmentMutation.isPending ? 'Creando Envío...' : 'Verificando tarifa...'}
                  </>
                ) : (
                  <>
                    {fromQuote && selectedRate ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Crear Envío con {selectedRate.provider}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Continuar
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {/* PASO 2: Selección de paquetería */}
        {step === 2 && allRates.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Selecciona tu Paquetería</h2>
                <p className="text-sm text-muted-foreground">Elige la mejor opción para tu envío</p>
              </div>
              <Badge variant="outline" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Saldo: ${userBalance.toFixed(2)} MXN
              </Badge>
            </div>

            <div className="space-y-3">
              {allRates.map((rate: QuoteRate) => {
                const logo = getCarrierLogo(rate.provider);
                const isSelected = selectedRate?.id === rate.id;
                const hasEnoughBalance = userBalance >= rate.total_pricing;

                return (
                  <Card
                    key={rate.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    } ${!hasEnoughBalance ? 'opacity-50' : ''}`}
                    onClick={() => hasEnoughBalance && setSelectedRate(rate)}
                    data-testid={`card-rate-${rate.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 flex items-center justify-center bg-white dark:bg-card rounded-lg border p-2">
                          {logo ? (
                            <img src={logo} alt={rate.provider} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{rate.provider}</h3>
                          <p className="text-sm text-muted-foreground">{rate.service_level_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Entrega: {rate.days} {rate.days === 1 ? 'día' : 'días'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          ${rate.total_pricing.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{rate.currency}</p>
                        {!hasEnoughBalance && (
                          <p className="text-xs text-destructive mt-1">Saldo insuficiente</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                data-testid="button-back-to-form"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Regresar
              </Button>
              <Button
                onClick={handleShipmentSubmit}
                disabled={!selectedRate || shipmentMutation.isPending}
                className="flex-1"
                data-testid="button-create-shipment"
              >
                {shipmentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando Guía...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Crear Envío
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3: Guía creada */}
        {step === 3 && createdShipment && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">¡Guía Creada Exitosamente!</h2>
              <p className="text-muted-foreground">Tu guía de envío ha sido generada correctamente</p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Número de Rastreo</Label>
                  <p className="text-xl font-mono font-semibold text-foreground">
                    {createdShipment.trackingNumber || <span className="text-muted-foreground italic">Procesando...</span>}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Paquetería</Label>
                    <p className="font-semibold">{createdShipment.carrier}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Monto</Label>
                    <p className="font-semibold">${parseFloat(createdShipment.amount).toFixed(2)} {createdShipment.currency}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              {createdShipment.labelUrl && (
                <Button asChild className="flex-1" data-testid="button-download-label">
                  <a href={createdShipment.labelUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Etiqueta
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={resetForm} className="flex-1" data-testid="button-create-another">
                <FileText className="w-4 h-4 mr-2" />
                Crear Otra Guía
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
