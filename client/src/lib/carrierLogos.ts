import dhlLogo from '@assets/stock_images/dhl_logo_official_f7ef5380.jpg';
import fedexLogo from '@assets/stock_images/fedex_logo_official_3ed84a71.jpg';
import estafetaLogo from '@assets/stock_images/estafeta_logo_mexico_8b9b0b35.jpg';
import upsLogo from '@assets/stock_images/ups_logo_official_aee353be.jpg';

// Mapeo de nombres de paqueterías a sus logos
const carrierLogos: Record<string, string> = {
  'DHL': dhlLogo,
  'FedEx': fedexLogo,
  'Estafeta': estafetaLogo,
  'UPS': upsLogo,
  // Aliases comunes
  'dhl': dhlLogo,
  'fedex': fedexLogo,
  'estafeta': estafetaLogo,
  'ups': upsLogo,
};

export function getCarrierLogo(carrierName: string): string | null {
  if (!carrierName) return null;
  
  // Buscar coincidencia exacta
  if (carrierLogos[carrierName]) {
    return carrierLogos[carrierName];
  }
  
  // Buscar por nombre que contenga el carrier (case insensitive)
  const normalizedName = carrierName.toLowerCase();
  const matchingKey = Object.keys(carrierLogos).find(key => 
    normalizedName.includes(key.toLowerCase())
  );
  
  return matchingKey ? carrierLogos[matchingKey] : null;
}
