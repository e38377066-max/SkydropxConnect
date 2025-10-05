import TrackingTimeline from '../TrackingTimeline'

const mockEvents = [
  {
    id: "1",
    status: "in_transit",
    description: "El paquete está en tránsito",
    location: "Centro de Distribución Monterrey, NL",
    eventDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    status: "in_transit",
    description: "El paquete llegó al centro de distribución",
    location: "Centro de Distribución CDMX",
    eventDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    status: "pickup",
    description: "Paquete recolectado",
    location: "Sucursal Roma Norte, CDMX",
    eventDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockShipment = {
  trackingNumber: "SKY123456789MX",
  carrier: "DHL",
  status: "in_transit",
}

export default function TrackingTimelineExample() {
  return (
    <div className="p-6 max-w-4xl">
      <TrackingTimeline events={mockEvents} shipment={mockShipment} />
    </div>
  )
}
