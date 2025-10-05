import QuoteResults from '../QuoteResults'

const mockRates = [
  {
    id: "rate_dhl_express",
    provider: "DHL",
    service_level_name: "Express",
    total_pricing: 245.00,
    currency: "MXN",
    days: 1,
    available_for_pickup: true,
  },
  {
    id: "rate_fedex_standard",
    provider: "FedEx",
    service_level_name: "Standard",
    total_pricing: 280.00,
    currency: "MXN",
    days: 2,
    available_for_pickup: true,
  },
  {
    id: "rate_estafeta_terrestre",
    provider: "Estafeta",
    service_level_name: "Terrestre",
    total_pricing: 180.00,
    currency: "MXN",
    days: 3,
    available_for_pickup: false,
  },
]

export default function QuoteResultsExample() {
  return (
    <div className="p-6 max-w-4xl">
      <QuoteResults 
        rates={mockRates} 
        onSelectRate={(rate) => console.log('Selected rate:', rate)}
      />
    </div>
  )
}
