import dhlLogo from '@assets/stock_images/dhl_logo_official_f7ef5380.jpg';
import fedexLogo from '@assets/stock_images/fedex_logo_official_3ed84a71.jpg';
import estafetaLogo from '@assets/stock_images/estafeta_logo_mexico_8b9b0b35.jpg';
import upsLogo from '@assets/stock_images/ups_logo_official_aee353be.jpg';
import ninetyNineMinutosLogo from '@assets/stock_images/99_minutos_mexico_de_f2abf246.jpg';
import paquetexpressLogo from '@assets/stock_images/paquetexpress_mexico_e87cfeea.jpg';
import quikenLogo from '@assets/stock_images/quiken_mexico_delive_847e023f.jpg';
import sendexLogo from '@assets/stock_images/sendex_mexico_delive_1e63b73f.jpg';
import ampmLogo from '@assets/stock_images/ampm_mexico_delivery_689e09bf.jpg';
import jtExpressLogo from '@assets/stock_images/jt_express_logistics_d36d92c4.jpg';

// Mapeo de nombres de paqueterías a sus logos
const carrierLogos: Record<string, string> = {
  // Skydropx IDs
  'ninetynineminutes': ninetyNineMinutosLogo,
  'paquetexpress': paquetexpressLogo,
  'quiken': quikenLogo,
  'sendex': sendexLogo,
  'dhl': dhlLogo,
  'estafeta': estafetaLogo,
  'fedex': fedexLogo,
  'ups': upsLogo,
  'ampm': ampmLogo,
  'jtexpress': jtExpressLogo,
  
  // Nombres comunes
  'DHL': dhlLogo,
  'FedEx': fedexLogo,
  'Estafeta': estafetaLogo,
  'UPS': upsLogo,
  '99 Minutos': ninetyNineMinutosLogo,
  '99 minutos': ninetyNineMinutosLogo,
  'Paquetexpress': paquetexpressLogo,
  'Quiken': quikenLogo,
  'Sendex': sendexLogo,
  'AMPM': ampmLogo,
  'J&T Express': jtExpressLogo,
  'JT Express': jtExpressLogo,
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
