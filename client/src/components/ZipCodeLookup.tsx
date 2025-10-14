import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ChevronDown } from "lucide-react";
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
  const [suggestions, setSuggestions] = useState<ColoniaOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState("");

  // Actualizar displayValue cuando cambian los props
  useEffect(() => {
    if (zipCodeValue && coloniaValue) {
      setDisplayValue(`${zipCodeValue} - ${coloniaValue}`);
    } else if (zipCodeValue) {
      setDisplayValue(zipCodeValue);
    } else {
      setDisplayValue("");
    }
  }, [zipCodeValue, coloniaValue]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar automáticamente cuando el usuario escribe
  useEffect(() => {
    const searchZipCode = async () => {
      const query = displayValue.trim();
      
      if (!query || query.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/zipcodes/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setSuggestions(data.data);
          setShowDropdown(data.data.length > 0);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error("Error searching zip codes:", error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchZipCode, 300);
    return () => clearTimeout(timeoutId);
  }, [displayValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayValue(value);
    
    // Limpiar selección actual
    onZipCodeChange("");
    onColoniaChange("");
    if (onMetadataChange) {
      onMetadataChange({ municipio: "", estado: "" });
    }
  };

  const handleSelectSuggestion = (suggestion: ColoniaOption) => {
    onZipCodeChange(suggestion.codigo_postal);
    onColoniaChange(suggestion.colonia);
    setDisplayValue(`${suggestion.codigo_postal} - ${suggestion.colonia}`);
    
    if (onMetadataChange) {
      onMetadataChange({
        municipio: suggestion.municipio,
        estado: suggestion.estado
      });
    }
    
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 relative" ref={dropdownRef}>
        <Label htmlFor={testId} className="text-base">{label}</Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id={testId}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder="Escribe código postal o colonia..."
            required={required}
            data-testid={testId}
            className="text-lg h-12 w-full pr-10"
            autoComplete="off"
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.codigo_postal}-${suggestion.colonia}-${index}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 focus:bg-accent focus:outline-none"
                  data-testid={`${testId}-suggestion-${index}`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-base">
                        {suggestion.codigo_postal} - {suggestion.colonia}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.municipio}, {suggestion.estado}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {isSearching && (
          <div className="text-sm text-muted-foreground">Buscando...</div>
        )}
      </div>
    </div>
  );
}
