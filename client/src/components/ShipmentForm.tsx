import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, User, MapPin, Package, Loader2, Download, ArrowLeft, ArrowRight, Check, DollarSign, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ZipCodeLookup from "@/components/ZipCodeLookup";
import { getCarrierLogo } from "@/lib/carrierLogos";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuoteRate {
  id: string;
  provider: string;
  service_level_name: string;
  total_pricing: number;
  currency: string;
  days: number;
}

interface ZipCodeMetadata {
  municipio: string;
  estado: string;
}

export default function ShipmentForm() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [selectedRate, setSelectedRate] = useState<QuoteRate | null>(null);
  const [quoteId, setQuoteId] = useState<string>("");
  const [allRates, setAllRates] = useState<QuoteRate[]>([]);
  
  const [senderMetadata, setSenderMetadata] = useState<ZipCodeMetadata>({ municipio: "", estado: "" });
  const [receiverMetadata, setReceiverMetadata] = useState<ZipCodeMetadata>({ municipio: "", estado: "" });
  
  const [formData, setFormData] = useState({
    // Sender details
    senderName: "",
    senderCompany: "",
    senderEmail: "",
    senderPhone: "",
    senderStreet: "",
    senderExteriorNumber: "",
    senderInteriorNumber: "",
    senderReferences: "",
    senderAddress: "",
    senderZipCode: "",
    senderColonia: "",
    senderMunicipality: "",
    senderCity: "",
    senderState: "",
    senderRFC: "",
    
    // Receiver details
    receiverName: "",
    receiverCompany: "",
    receiverEmail: "",
    receiverPhone: "",
    receiverStreet: "",
    receiverExteriorNumber: "",
    receiverInteriorNumber: "",
    receiverReferences: "",
    receiverAddress: "",
    receiverZipCode: "",
    receiverColonia: "",
    receiverMunicipality: "",
    receiverCity: "",
    receiverState: "",
    receiverRFC: "",
    
    // Package details
    shipmentType: "",
    weight: "1",
    length: "10",
    width: "10",
    height: "10",
    packageAlias: "",
    description: "",
    declaredValue: "",
    productClassification: "",
    packagingType: "XBX-Caja",
    
    // Options
    generateAsOcurre: false,
    sendEmailNotification: false,
    saveOriginAddress: false,
    saveDestinationAddress: false,
    saveDimensions: false,
    addRFC: false,
  });

  const { data: userData } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  const userBalance = userData?.balance ? parseFloat(userData.balance) : 0;

  const { data: packagesData } = useQuery<{ data: any[] }>({
    queryKey: ["/api/packages"],
  });

  const packages = packagesData?.data ?? [];

  const { data: addressesData } = useQuery<{ data: any[] }>({
    queryKey: ["/api/addresses"],
  });

  const addresses = addressesData?.data ?? [];

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

  const handleAddressSelect = (addressId: string, type: 'sender' | 'receiver') => {
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      if (type === 'sender') {
        setFormData({
          ...formData,
          senderName: selectedAddress.contactName || "",
          senderCompany: selectedAddress.company || "",
          senderEmail: selectedAddress.email || "",
          senderPhone: selectedAddress.phone || "",
          senderStreet: selectedAddress.street || "",
          senderExteriorNumber: selectedAddress.exteriorNumber || "",
          senderInteriorNumber: selectedAddress.interiorNumber || "",
          senderReferences: selectedAddress.references || "",
          senderAddress: selectedAddress.address || "",
          senderZipCode: selectedAddress.zipCode || "",
          senderColonia: selectedAddress.colonia || "",
          senderMunicipality: selectedAddress.municipality || "",
          senderCity: selectedAddress.city || selectedAddress.municipality || "",
          senderState: selectedAddress.state || "",
        });
        if (selectedAddress.municipality && selectedAddress.state) {
          setSenderMetadata({ 
            municipio: selectedAddress.municipality, 
            estado: selectedAddress.state 
          });
        }
      } else {
        setFormData({
          ...formData,
          receiverName: selectedAddress.contactName || "",
          receiverCompany: selectedAddress.company || "",
          receiverEmail: selectedAddress.email || "",
          receiverPhone: selectedAddress.phone || "",
          receiverStreet: selectedAddress.street || "",
          receiverExteriorNumber: selectedAddress.exteriorNumber || "",
          receiverInteriorNumber: selectedAddress.interiorNumber || "",
          receiverReferences: selectedAddress.references || "",
          receiverAddress: selectedAddress.address || "",
          receiverZipCode: selectedAddress.zipCode || "",
          receiverColonia: selectedAddress.colonia || "",
          receiverMunicipality: selectedAddress.municipality || "",
          receiverCity: selectedAddress.city || selectedAddress.municipality || "",
          receiverState: selectedAddress.state || "",
        });
        if (selectedAddress.municipality && selectedAddress.state) {
          setReceiverMetadata({ 
            municipio: selectedAddress.municipality, 
            estado: selectedAddress.state 
          });
        }
      }
    }
  };

  const quoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quotes", {
        fromZipCode: formData.senderZipCode,
        fromColonia: formData.senderColonia,
        toZipCode: formData.receiverZipCode,
        toColonia: formData.receiverColonia,
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data.rates) {
        setAllRates(data.data.rates);
        setQuoteId(data.data.quoteId || "");
        setStep(3);
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

  const shipmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRate) throw new Error("No se ha seleccionado una tarifa");

      const response = await apiRequest("POST", "/api/shipments", {
        ...formData,
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length || "0"),
        width: parseFloat(formData.width || "0"),
        height: parseFloat(formData.height || "0"),
        declaredValue: formData.declaredValue ? parseFloat(formData.declaredValue) : undefined,
        carrier: selectedRate.provider,
        rateId: selectedRate.id,
        expectedAmount: selectedRate.total_pricing,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setCreatedShipment(data.data.shipment);
        setStep(4);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
        toast({
          title: "Envío creado exitosamente",
          description: `Tu envío ha sido registrado correctamente`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear envío",
        description: error.message || "No se pudo crear el envío",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    quoteMutation.mutate();
  };

  const handleShipmentSubmit = () => {
    shipmentMutation.mutate();
  };

  const resetForm = () => {
    setStep(1);
    setCreatedShipment(null);
    setSelectedRate(null);
    setQuoteId("");
    setAllRates([]);
    setFormData({
      senderName: "",
      senderCompany: "",
      senderEmail: "",
      senderPhone: "",
      senderStreet: "",
      senderExteriorNumber: "",
      senderInteriorNumber: "",
      senderReferences: "",
      senderAddress: "",
      senderZipCode: "",
      senderColonia: "",
      senderMunicipality: "",
      senderCity: "",
      senderState: "",
      senderRFC: "",
      receiverName: "",
      receiverCompany: "",
      receiverEmail: "",
      receiverPhone: "",
      receiverStreet: "",
      receiverExteriorNumber: "",
      receiverInteriorNumber: "",
      receiverReferences: "",
      receiverAddress: "",
      receiverZipCode: "",
      receiverColonia: "",
      receiverMunicipality: "",
      receiverCity: "",
      receiverState: "",
      receiverRFC: "",
      shipmentType: "",
      weight: "1",
      length: "10",
      width: "10",
      height: "10",
      packageAlias: "",
      description: "",
      declaredValue: "",
      productClassification: "",
      packagingType: "XBX-Caja",
      generateAsOcurre: false,
      sendEmailNotification: false,
      saveOriginAddress: false,
      saveDestinationAddress: false,
      saveDimensions: false,
      addRFC: false,
    });
    setSenderMetadata({ municipio: "", estado: "" });
    setReceiverMetadata({ municipio: "", estado: "" });
  };

  return (
    <Card className="p-8">
      {/* PASO 1: Datos del origen y destino */}
      {step === 1 && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Nueva Cotización</h2>
              <p className="text-sm text-muted-foreground">Datos del origen y destino del envío</p>
            </div>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* DATOS DEL ORIGEN */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Datos del origen del envío
                </h3>

                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Direcciones de origen</Label>
                    <Select onValueChange={(value) => handleAddressSelect(value, 'sender')}>
                      <SelectTrigger data-testid="select-sender-address">
                        <SelectValue placeholder="-- Direcciones guardadas --" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((addr: any) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-normal">Datos origen</Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombre completo"
                      data-testid="input-sender-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input
                      name="senderCompany"
                      value={formData.senderCompany}
                      onChange={handleInputChange}
                      placeholder="Nombre de la empresa"
                      data-testid="input-sender-company"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Correo</Label>
                    <Input
                      type="email"
                      name="senderEmail"
                      value={formData.senderEmail}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                      data-testid="input-sender-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      name="senderPhone"
                      value={formData.senderPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="10 dígitos"
                      data-testid="input-sender-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Calle</Label>
                  <Input
                    name="senderStreet"
                    value={formData.senderStreet}
                    onChange={handleInputChange}
                    placeholder="Nombre de la calle"
                    data-testid="input-sender-street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>No. Exterior</Label>
                    <Input
                      name="senderExteriorNumber"
                      value={formData.senderExteriorNumber}
                      onChange={handleInputChange}
                      placeholder="Número exterior"
                      data-testid="input-sender-exterior"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Interior</Label>
                    <Input
                      name="senderInteriorNumber"
                      value={formData.senderInteriorNumber}
                      onChange={handleInputChange}
                      placeholder="Número interior"
                      data-testid="input-sender-interior"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Referencias / Entre calles</Label>
                    <Input
                      name="senderReferences"
                      value={formData.senderReferences}
                      onChange={handleInputChange}
                      placeholder="Referencias de ubicación"
                      data-testid="input-sender-references"
                    />
                  </div>
                  <div className="space-y-2">
                    <ZipCodeLookup
                      label="Código postal"
                      zipCodeValue={formData.senderZipCode}
                      coloniaValue={formData.senderColonia}
                      onZipCodeChange={(value) => setFormData(prev => ({ ...prev, senderZipCode: value }))}
                      onColoniaChange={(value) => setFormData(prev => ({ ...prev, senderColonia: value }))}
                      onMetadataChange={(metadata) => {
                        setSenderMetadata(metadata);
                        setFormData(prev => ({
                          ...prev,
                          senderMunicipality: metadata.municipio,
                          senderCity: metadata.municipio,
                          senderState: metadata.estado,
                        }));
                      }}
                      required
                      testId="input-sender-zipcode"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Municipio</Label>
                    <Input
                      value={senderMetadata.municipio}
                      disabled
                      className="bg-muted"
                      data-testid="input-sender-municipality"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={senderMetadata.estado}
                      disabled
                      className="bg-muted"
                      data-testid="input-sender-state"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveOriginAddress"
                    checked={formData.saveOriginAddress}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, saveOriginAddress: !!checked })
                    }
                    data-testid="checkbox-save-origin"
                  />
                  <label htmlFor="saveOriginAddress" className="text-sm">
                    Guardar en mi lista de direcciones
                  </label>
                </div>
              </div>

              {/* DATOS DEL DESTINO */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Datos del destino del envío
                </h3>

                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Direcciones de destino</Label>
                    <Select onValueChange={(value) => handleAddressSelect(value, 'receiver')}>
                      <SelectTrigger data-testid="select-receiver-address">
                        <SelectValue placeholder="-- Direcciones guardadas --" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((addr: any) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-muted-foreground font-normal">Datos destinatario</Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      name="receiverName"
                      value={formData.receiverName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombre completo"
                      data-testid="input-receiver-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input
                      name="receiverCompany"
                      value={formData.receiverCompany}
                      onChange={handleInputChange}
                      placeholder="Nombre de la empresa"
                      data-testid="input-receiver-company"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Correo</Label>
                    <Input
                      type="email"
                      name="receiverEmail"
                      value={formData.receiverEmail}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                      data-testid="input-receiver-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      name="receiverPhone"
                      value={formData.receiverPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="10 dígitos"
                      data-testid="input-receiver-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Calle</Label>
                  <Input
                    name="receiverStreet"
                    value={formData.receiverStreet}
                    onChange={handleInputChange}
                    placeholder="Nombre de la calle"
                    data-testid="input-receiver-street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>No. Exterior</Label>
                    <Input
                      name="receiverExteriorNumber"
                      value={formData.receiverExteriorNumber}
                      onChange={handleInputChange}
                      placeholder="Número exterior"
                      data-testid="input-receiver-exterior"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Interior</Label>
                    <Input
                      name="receiverInteriorNumber"
                      value={formData.receiverInteriorNumber}
                      onChange={handleInputChange}
                      placeholder="Número interior"
                      data-testid="input-receiver-interior"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Referencias / Entre calles</Label>
                    <Input
                      name="receiverReferences"
                      value={formData.receiverReferences}
                      onChange={handleInputChange}
                      placeholder="Referencias de ubicación"
                      data-testid="input-receiver-references"
                    />
                  </div>
                  <div className="space-y-2">
                    <ZipCodeLookup
                      label="Código postal"
                      zipCodeValue={formData.receiverZipCode}
                      coloniaValue={formData.receiverColonia}
                      onZipCodeChange={(value) => setFormData(prev => ({ ...prev, receiverZipCode: value }))}
                      onColoniaChange={(value) => setFormData(prev => ({ ...prev, receiverColonia: value }))}
                      onMetadataChange={(metadata) => {
                        setReceiverMetadata(metadata);
                        setFormData(prev => ({
                          ...prev,
                          receiverMunicipality: metadata.municipio,
                          receiverCity: metadata.municipio,
                          receiverState: metadata.estado,
                        }));
                      }}
                      required
                      testId="input-receiver-zipcode"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Municipio</Label>
                    <Input
                      value={receiverMetadata.municipio}
                      disabled
                      className="bg-muted"
                      data-testid="input-receiver-municipality"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={receiverMetadata.estado}
                      disabled
                      className="bg-muted"
                      data-testid="input-receiver-state"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateAsOcurre"
                      checked={formData.generateAsOcurre}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, generateAsOcurre: !!checked })
                      }
                      data-testid="checkbox-ocurre"
                    />
                    <label htmlFor="generateAsOcurre" className="text-sm">
                      Generar guía como Ocurre?
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendEmailNotification"
                      checked={formData.sendEmailNotification}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, sendEmailNotification: !!checked })
                      }
                      data-testid="checkbox-notification"
                    />
                    <label htmlFor="sendEmailNotification" className="text-sm">
                      Notificación usuario? <span className="text-muted-foreground">(Notifica al destinatario del envío por correo)</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveDestinationAddress"
                      checked={formData.saveDestinationAddress}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, saveDestinationAddress: !!checked })
                      }
                      data-testid="checkbox-save-destination"
                    />
                    <label htmlFor="saveDestinationAddress" className="text-sm">
                      Guardar en mi lista de direcciones
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" data-testid="button-next-step1">
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </>
      )}

      {/* PASO 2: Información del paquete */}
      {step === 2 && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Información del paquete</h2>
              <p className="text-sm text-muted-foreground">Dimensiones, peso y valor del envío</p>
            </div>
          </div>

          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Dimensiones y peso del envío</h3>

              {packages.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label>Selecciona un paquete guardado</Label>
                  <Select onValueChange={handlePackageSelect}>
                    <SelectTrigger data-testid="select-saved-package">
                      <SelectValue placeholder="-- Directorio de paquetes guardados --" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.alias}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <Label>Ingresa las dimensiones del envío</Label>
                <Select
                  value={formData.shipmentType}
                  onValueChange={(value) => setFormData({ ...formData, shipmentType: value })}
                >
                  <SelectTrigger data-testid="select-shipment-type">
                    <SelectValue placeholder="-- Selecciona el tipo de envío --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paquete">Paquete</SelectItem>
                    <SelectItem value="sobre">Sobre</SelectItem>
                    <SelectItem value="caja">Caja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso</Label>
                  <div className="flex gap-2">
                    <Input
                      name="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                      placeholder="Peso del paquete"
                      data-testid="input-weight"
                    />
                    <span className="flex items-center px-3 border rounded-md bg-muted">KG</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contenido del envío</Label>
                  <Input
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descripción del contenido"
                    data-testid="input-description"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <Checkbox
                  id="saveDimensions"
                  checked={formData.saveDimensions}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, saveDimensions: !!checked })
                  }
                  data-testid="checkbox-save-dimensions"
                />
                <label htmlFor="saveDimensions" className="text-sm">
                  Guardar dimensiones <span className="text-primary cursor-pointer">¿Cómo funciona?</span>
                </label>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Valor del paquete</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Declara el valor real en pesos mexicanos de lo que estás enviando. Esto servirá para proteger tu envío y solicitar un seguro si lo necesitas.
              </p>

              <div className="space-y-2">
                <Label>Valor declarado</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 border rounded-md bg-muted">$</span>
                  <Input
                    name="declaredValue"
                    type="number"
                    step="0.01"
                    value={formData.declaredValue}
                    onChange={handleInputChange}
                    placeholder="Valor real en pesos"
                    data-testid="input-declared-value"
                  />
                  <span className="flex items-center px-3 border rounded-md bg-muted">MXN</span>
                </div>
              </div>
            </div>

            {formData.saveDimensions && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Alias o nombre de las dimensiones</Label>
                  <Input
                    name="packageAlias"
                    value={formData.packageAlias}
                    onChange={handleInputChange}
                    placeholder="Ej: Caja blanca pastel"
                    data-testid="input-package-alias"
                  />
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Información Carta Porte</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Descripción de lo que estás enviando según los requisitos de la autoridad SAT.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Como clasificas el producto que envías</Label>
                  <Input
                    name="productClassification"
                    value={formData.productClassification}
                    onChange={handleInputChange}
                    placeholder="Clasificación del producto"
                    data-testid="input-product-classification"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de embalaje</Label>
                  <Select
                    value={formData.packagingType}
                    onValueChange={(value) => setFormData({ ...formData, packagingType: value })}
                  >
                    <SelectTrigger data-testid="select-packaging-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XBX-Caja">XBX-Caja</SelectItem>
                      <SelectItem value="XSB-Sobre">XSB-Sobre</SelectItem>
                      <SelectItem value="XPK-Paquete">XPK-Paquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Opciones adicionales</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addRFC"
                    checked={formData.addRFC}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, addRFC: !!checked })
                    }
                    data-testid="checkbox-add-rfc"
                  />
                  <label htmlFor="addRFC" className="text-sm">
                    Añadir RFC de remitente y destinatario
                  </label>
                </div>
              </div>

              {formData.addRFC && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>RFC Remitente</Label>
                    <Input
                      name="senderRFC"
                      value={formData.senderRFC}
                      onChange={handleInputChange}
                      placeholder="RFC del remitente"
                      data-testid="input-sender-rfc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RFC Destinatario</Label>
                    <Input
                      name="receiverRFC"
                      value={formData.receiverRFC}
                      onChange={handleInputChange}
                      placeholder="RFC del destinatario"
                      data-testid="input-receiver-rfc"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Objetos prohibidos para envío
              </h3>

              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { icon: "🔫", label: "Armas" },
                  { icon: "🔥", label: "Encendedores" },
                  { icon: "💧", label: "Inflamables" },
                  { icon: "☠️", label: "Materiales tóxicos" },
                  { icon: "💨", label: "Vapes" },
                  { icon: "💥", label: "Explosivos" },
                  { icon: "⚗️", label: "Químicos" },
                  { icon: "🔋", label: "Baterías" },
                  { icon: "⛽", label: "Gasolina" },
                  { icon: "⚔️", label: "Arma blanca" },
                  { icon: "💊", label: "Drogas" },
                  { icon: "🧴", label: "Gas aerosol" },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center justify-center p-3 border rounded-lg bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <p className="text-xs text-center text-red-700 dark:text-red-400">{item.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Al dar clic en Siguiente, reconozco que mi envío no incluye objetos prohibidos.{" "}
                <a href="#" className="text-primary underline">
                  Ver lista de artículos prohibidos
                </a>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                data-testid="button-back-step2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={quoteMutation.isPending}
                data-testid="button-next-step2"
              >
                {quoteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cotizando...
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </>
      )}

      {/* PASO 3: Selección de paquetería */}
      {step === 3 && allRates.length > 0 && (() => {
        const sortedRates = [...allRates].sort((a, b) => a.total_pricing - b.total_pricing);
        const lowestPrice = sortedRates[0]?.total_pricing;

        return (
          <>
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
                {sortedRates.map((rate: QuoteRate) => {
                  const logo = getCarrierLogo(rate.provider);
                  const isSelected = selectedRate?.id === rate.id;
                  const hasEnoughBalance = userBalance >= rate.total_pricing;
                  const isBestPrice = rate.total_pricing === lowestPrice;

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
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{rate.provider}</h3>
                              {isBestPrice && (
                                <Badge variant="default" className="text-xs">
                                  Mejor Precio
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{rate.service_level_name}</p>
                            <p className="text-sm text-muted-foreground">Entrega: {rate.days} días hábiles</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            ${rate.total_pricing.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">{rate.currency}</p>
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
                  onClick={() => setStep(2)}
                  data-testid="button-back-step3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleShipmentSubmit}
                  disabled={!selectedRate || shipmentMutation.isPending}
                  data-testid="button-create-shipment"
                >
                  {shipmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando Envío...
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
          </>
        );
      })()}

      {/* PASO 4: Guía creada */}
      {step === 4 && createdShipment && (
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
  );
}
