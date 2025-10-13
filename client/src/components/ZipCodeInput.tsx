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
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  testId?: string;
}

export default function ZipCodeInput({ 
  label, 
  value, 
  onChange, 
  placeholder,
  required,
  testId 
}: ZipCodeInputProps) {
  const [suggestions, setSuggestions] = useState<ZipCodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  useEffect(() => {
    const searchZipCodes = async () => {
      if (value.length < 4) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/zipcodes/search?q=${value}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setSuggestions(data.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching zip codes:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchZipCodes, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleSelect = (suggestion: ZipCodeSuggestion) => {
    onChange(suggestion.codigo_postal);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label htmlFor={testId}>{label}</Label>
      <div className="relative">
        <Input
          id={testId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "54120"}
          required={required}
          data-testid={testId}
          maxLength={5}
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
                key={`${suggestion.codigo_postal}-${index}`}
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
    </div>
  );
}
