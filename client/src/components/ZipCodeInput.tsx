import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";

interface ZipCodeSuggestion {
  codigo_postal: string;
  municipio: string;
  estado: string;
}

interface ZipCodeInputProps {
  zipCodeLabel?: string;
  coloniaLabel?: string;
  zipCodeValue: string;
  coloniaValue: string;
  onZipCodeChange: (value: string) => void;
  onColoniaChange: (value: string) => void;
  required?: boolean;
  zipCodeTestId?: string;
  coloniaTestId?: string;
}

export default function ZipCodeInput({ 
  zipCodeLabel = "Código Postal",
  coloniaLabel = "Colonia",
  zipCodeValue, 
  coloniaValue,
  onZipCodeChange, 
  onColoniaChange,
  required = false,
  zipCodeTestId = "input-zipcode",
  coloniaTestId = "select-colonia"
}: ZipCodeInputProps) {
  const [suggestions, setSuggestions] = useState<ZipCodeSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [colonias, setColonias] = useState<string[]>([]);
  const [isLoadingColonias, setIsLoadingColonias] = useState(false);
  const [selectedZipInfo, setSelectedZipInfo] = useState<ZipCodeSuggestion | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for zip codes as user types
  useEffect(() => {
    const searchZipCodes = async () => {
      if (zipCodeValue.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/zipcodes/search?q=${zipCodeValue}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setSuggestions(data.data);
          
          // If exactly 5 digits and only one match, auto-select it
          if (zipCodeValue.length === 5 && data.data.length === 1) {
            const suggestion = data.data[0];
            setSelectedZipInfo(suggestion);
            setShowSuggestions(false);
            loadColonias(suggestion.codigo_postal);
          } else {
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error fetching zip codes:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(searchZipCodes, 300);
    return () => clearTimeout(debounceTimer);
  }, [zipCodeValue]);

  // Load colonias when a zip code is selected
  const loadColonias = async (codigoPostal: string) => {
    setIsLoadingColonias(true);
    try {
      const response = await fetch(`/api/zipcodes/${codigoPostal}/colonias`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setColonias(data.data);
        // Auto-select if only one colonia
        if (data.data.length === 1) {
          onColoniaChange(data.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching colonias:", error);
      setColonias([]);
    } finally {
      setIsLoadingColonias(false);
    }
  };

  const handleSelectZipCode = (suggestion: ZipCodeSuggestion) => {
    onZipCodeChange(suggestion.codigo_postal);
    setSelectedZipInfo(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    onColoniaChange(""); // Reset colonia when changing zip code
    loadColonias(suggestion.codigo_postal);
  };

  const handleZipCodeInputChange = (value: string) => {
    onZipCodeChange(value);
    
    // Clear colonias if:
    // 1. Input is not 5 digits
    // 2. Input is 5 digits but different from the selected ZIP (user edited it)
    if (value.length !== 5 || (selectedZipInfo && value !== selectedZipInfo.codigo_postal)) {
      setColonias([]);
      onColoniaChange("");
      setSelectedZipInfo(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zip Code Input with Autocomplete */}
      <div className="space-y-2" ref={wrapperRef}>
        <Label htmlFor={zipCodeTestId}>{zipCodeLabel}</Label>
        <div className="relative">
          <Input
            id={zipCodeTestId}
            type="text"
            value={zipCodeValue}
            onChange={(e) => handleZipCodeInputChange(e.target.value)}
            placeholder="54120"
            required={required}
            data-testid={zipCodeTestId}
            maxLength={5}
            className="pr-10"
          />
          {isLoadingSuggestions && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.codigo_postal}-${index}`}
                  type="button"
                  onClick={() => handleSelectZipCode(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0 flex items-start gap-3"
                  data-testid={`zipcode-suggestion-${index}`}
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">
                      {suggestion.codigo_postal}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {suggestion.municipio}, {suggestion.estado}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Show selected zip code info */}
        {selectedZipInfo && (
          <p className="text-sm text-muted-foreground">
            {selectedZipInfo.municipio}, {selectedZipInfo.estado}
          </p>
        )}
      </div>

      {/* Colonia Select - Only shown when zip code is selected */}
      {zipCodeValue.length === 5 && colonias.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor={coloniaTestId}>{coloniaLabel}</Label>
          <Select
            value={coloniaValue}
            onValueChange={onColoniaChange}
            disabled={isLoadingColonias}
          >
            <SelectTrigger id={coloniaTestId} data-testid={coloniaTestId}>
              <SelectValue placeholder={isLoadingColonias ? "Cargando colonias..." : "Selecciona una colonia"} />
            </SelectTrigger>
            <SelectContent>
              {colonias.map((colonia, index) => (
                <SelectItem 
                  key={`${colonia}-${index}`} 
                  value={colonia}
                  data-testid={`colonia-option-${index}`}
                >
                  {colonia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
