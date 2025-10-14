import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColoniaOption {
  codigo_postal: string;
  colonia: string;
  municipio: string;
  estado: string;
}

interface ZipCodeLookupProps {
  label?: string;
  zipCodeValue: string;
  coloniaValue: string;
  onZipCodeChange: (value: string) => void;
  onColoniaChange: (value: string) => void;
  onMetadataChange?: (metadata: { municipio: string; estado: string }) => void;
  required?: boolean;
  testId?: string;
}

export default function ZipCodeLookup({ 
  label = "Código Postal",
  zipCodeValue, 
  coloniaValue,
  onZipCodeChange, 
  onColoniaChange,
  onMetadataChange,
  required = false,
  testId = "input-zipcode"
}: ZipCodeLookupProps) {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [colonias, setColonias] = useState<ColoniaOption[]>([]);
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");

  const handleSearch = async () => {
    if (!zipCodeValue || zipCodeValue.length !== 5) {
      toast({
        title: "Código postal inválido",
        description: "Por favor ingresa un código postal de 5 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/zipcodes/search?q=${zipCodeValue}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setColonias(data.data);
        
        // Si solo hay una colonia, seleccionarla automáticamente
        if (data.data.length === 1) {
          const colonia = data.data[0];
          onColoniaChange(colonia.colonia);
          setMunicipio(colonia.municipio);
          setEstado(colonia.estado);
          if (onMetadataChange) {
            onMetadataChange({ municipio: colonia.municipio, estado: colonia.estado });
          }
          toast({
            title: "Código postal encontrado",
            description: `${colonia.colonia}, ${colonia.municipio}`,
          });
        } else {
          toast({
            title: "Código postal encontrado",
            description: `${data.data.length} colonias encontradas. Selecciona una.`,
          });
        }
      } else {
        toast({
          title: "Código postal no encontrado",
          description: "No se encontraron resultados para este código postal",
          variant: "destructive",
        });
        setColonias([]);
      }
    } catch (error) {
      console.error("Error searching zip code:", error);
      toast({
        title: "Error",
        description: "No se pudo buscar el código postal",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleColoniaSelect = (value: string) => {
    const selected = colonias.find(c => c.colonia === value);
    if (selected) {
      onColoniaChange(selected.colonia);
      setMunicipio(selected.municipio);
      setEstado(selected.estado);
      if (onMetadataChange) {
        onMetadataChange({ municipio: selected.municipio, estado: selected.estado });
      }
    }
  };

  const handleZipCodeChange = (value: string) => {
    // Solo permitir números y máximo 5 dígitos
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(cleaned);
    
    // Limpiar colonias y metadata cuando cambia el CP
    if (cleaned !== zipCodeValue) {
      setColonias([]);
      onColoniaChange("");
      setMunicipio("");
      setEstado("");
      if (onMetadataChange) {
        onMetadataChange({ municipio: "", estado: "" });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label htmlFor={testId} className="text-base">{label}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto] gap-2">
          <Input
            id={testId}
            type="text"
            value={zipCodeValue}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            placeholder="00000"
            required={required}
            data-testid={testId}
            maxLength={5}
            className="text-lg h-12 w-full"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || zipCodeValue.length !== 5}
            data-testid={`${testId}-search-button`}
            className="h-12 w-full sm:w-auto px-6 text-base whitespace-nowrap"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </>
            )}
          </Button>
        </div>
      </div>

      {colonias.length > 1 && (
        <div className="space-y-3">
          <Label htmlFor={`${testId}-colonia`} className="text-base">Colonia</Label>
          <Select value={coloniaValue} onValueChange={handleColoniaSelect} required={required}>
            <SelectTrigger id={`${testId}-colonia`} data-testid={`${testId}-colonia-select`} className="h-12 text-base">
              <SelectValue placeholder="Selecciona una colonia" />
            </SelectTrigger>
            <SelectContent>
              {colonias.map((colonia, index) => (
                <SelectItem 
                  key={`${colonia.codigo_postal}-${colonia.colonia}-${index}`} 
                  value={colonia.colonia}
                  data-testid={`${testId}-colonia-option-${index}`}
                  className="text-base"
                >
                  {colonia.colonia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {coloniaValue && (municipio || estado) && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{coloniaValue}</p>
            <p className="text-muted-foreground">
              {municipio}{estado ? `, ${estado}` : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
