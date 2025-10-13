import dhlLogo from '@assets/stock_images/dhl-logo.svg';
import fedexLogo from '@assets/stock_images/fedex-logo.svg';
import estafetaLogo from '@assets/stock_images/estafeta_mexico_logi_9c26e8e6.jpg';
import upsLogo from '@assets/stock_images/ups_united_parcel_se_8e50abd7.jpg';
import ninetyNineMinutosLogo from '@assets/stock_images/99minutos-logo.svg';
import paquetexpressLogo from '@assets/stock_images/Paquetexpress_idKtwMJZ1Z_1.svg';
import quikenLogo from '@assets/stock_images/Quiken_Logo_color-03.7e65efc7.svg';
import sendexLogo from '@assets/stock_images/sendex-paquetera-37287.png';
import ampmLogo from '@assets/stock_images/ampm-logo.svg';
import jtExpressLogo from '@assets/stock_images/jt-express-logo.svg';

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
