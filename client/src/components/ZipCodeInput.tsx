import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";

interface ZipCodeSuggestion {
  codigo_postal: string;
  colonia: string;
  municipio: string;
  estado: string;
}

interface ZipCodeInputProps {
  label?: string;
  zipCodeValue: string;
  coloniaValue: string;
  onZipCodeChange: (value: string) => void;
  onColoniaChange: (value: string) => void;
  required?: boolean;
  testId?: string;
}

export default function ZipCodeInput({ 
  label = "Código Postal",
  zipCodeValue, 
  coloniaValue,
  onZipCodeChange, 
  onColoniaChange,
  required = false,
  testId = "input-zipcode"
}: ZipCodeInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [suggestions, setSuggestions] = useState<ZipCodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<ZipCodeSuggestion | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastValidSelection = useRef<ZipCodeSuggestion | null>(null);
  const isHydrating = useRef(false);

  // Sync display value with props and fetch metadata if needed
  useEffect(() => {
    if (zipCodeValue && coloniaValue) {
      // Full selection from props
      const newDisplay = `${zipCodeValue} - ${coloniaValue}`;
      setDisplayValue(newDisplay);
      
      if (!selectedInfo || selectedInfo.codigo_postal !== zipCodeValue || selectedInfo.colonia !== coloniaValue) {
        // Check if we have cached metadata
        if (lastValidSelection.current && 
            lastValidSelection.current.codigo_postal === zipCodeValue && 
            lastValidSelection.current.colonia === coloniaValue) {
          setSelectedInfo(lastValidSelection.current);
        } else {
          // Need to fetch metadata for this CP-Colonia combination
          isHydrating.current = true; // Start hydration
          const fetchMetadata = async () => {
            try {
              const response = await fetch(`/api/zipcodes/search?q=${encodeURIComponent(zipCodeValue)}`);
              const data = await response.json();
              
              if (data.success && Array.isArray(data.data)) {
                const match = data.data.find((s: ZipCodeSuggestion) => 
                  s.codigo_postal === zipCodeValue && s.colonia === coloniaValue
                );
                
                if (match) {
                  setSelectedInfo(match);
                  lastValidSelection.current = match;
                } else {
                  // Fallback without metadata
                  setSelectedInfo({
                    codigo_postal: zipCodeValue,
                    colonia: coloniaValue,
                    municipio: '',
                    estado: ''
                  });
                }
              }
            } catch (error) {
              console.error("Error fetching metadata:", error);
            } finally {
              isHydrating.current = false; // End hydration
            }
          };
          
          fetchMetadata();
        }
      }
    } else if (zipCodeValue && !coloniaValue) {
      // Only zip code from props
      setDisplayValue(zipCodeValue);
      if (selectedInfo) {
        setSelectedInfo(null);
      }
    } else if (!zipCodeValue && !coloniaValue) {
      // Reset state
      setDisplayValue("");
      setSelectedInfo(null);
      lastValidSelection.current = null;
    }
  }, [zipCodeValue, coloniaValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search as user types
  useEffect(() => {
    const search = async () => {
      const trimmed = displayValue.trim();
      
      if (trimmed.length < 3) {
        setSuggestions([]);
        return;
      }

      // Don't search while hydrating metadata
      if (isHydrating.current) {
        return;
      }

      // Don't search if we already have a valid selection matching the display
      if (selectedInfo && displayValue === `${selectedInfo.codigo_postal} - ${selectedInfo.colonia}`) {
        setShowSuggestions(false);
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/zipcodes/search?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setSuggestions(data.data);
          
          // Auto-select if exactly 5 digits and single match
          if (/^\d{5}$/.test(trimmed) && data.data.length === 1) {
            const suggestion = data.data[0];
            handleSelect(suggestion);
          } else {
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error fetching zip codes:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [displayValue, selectedInfo]);

  const handleSelect = (suggestion: ZipCodeSuggestion) => {
    setSelectedInfo(suggestion);
    lastValidSelection.current = suggestion; // Save for later sync
    setDisplayValue(`${suggestion.codigo_postal} - ${suggestion.colonia}`);
    onZipCodeChange(suggestion.codigo_postal);
    onColoniaChange(suggestion.colonia);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (value: string) => {
    setDisplayValue(value);
    
    // If user is typing and had a selection, clear it
    if (selectedInfo) {
      setSelectedInfo(null);
      onColoniaChange("");
    }
    
    // If it looks like a zip code (numeric), update the zip code value
    const numeric = value.replace(/[^\d]/g, '');
    if (numeric.length <= 5) {
      onZipCodeChange(numeric);
    }
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label htmlFor={testId}>{label}</Label>
      <div className="relative">
        <Input
          id={testId}
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          required={required}
          data-testid={testId}
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.codigo_postal}-${suggestion.colonia}-${index}`}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0 flex items-start gap-3"
                data-testid={`zipcode-suggestion-${index}`}
              >
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">
                    {suggestion.codigo_postal} - {suggestion.colonia}
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
      
      {selectedInfo && (
        <p className="text-sm text-muted-foreground">
          {selectedInfo.municipio}, {selectedInfo.estado}
        </p>
      )}
    </div>
  );
}
