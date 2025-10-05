import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock } from "lucide-react";

interface TrackingEvent {
  id: string;
  status: string;
  description: string | null;
  location: string | null;
  eventDate: string | null;
  createdAt: string;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
  shipment?: {
    trackingNumber: string;
    carrier: string;
    status: string;
  };
}

const statusColors: Record<string, string> = {
  created: "bg-muted",
  pending: "bg-muted",
  pickup: "bg-primary",
  in_transit: "bg-primary",
  out_for_delivery: "bg-primary",
  delivered: "bg-chart-2",
  cancelled: "bg-destructive",
};

export default function TrackingTimeline({ events, shipment }: TrackingTimelineProps) {
  if (!shipment) {
    return null;
  }

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estado del Envío</h2>
          <p className="text-sm text-muted-foreground">
            Guía: <span className="font-mono font-semibold">{shipment.trackingNumber}</span> | {shipment.carrier}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <Badge variant="default" className="text-base px-4 py-2" data-testid="badge-current-status">
          {shipment.status === "in_transit" && "En Tránsito"}
          {shipment.status === "delivered" && "Entregado"}
          {shipment.status === "pending" && "Pendiente"}
          {shipment.status === "created" && "Creado"}
          {!["in_transit", "delivered", "pending", "created"].includes(shipment.status) && shipment.status}
        </Badge>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Historial de Rastreo</h3>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-6 pb-8 last:pb-0" data-testid={`event-${index}`}>
              <div className={`w-12 h-12 rounded-full ${statusColors[event.status] || "bg-muted"} flex items-center justify-center flex-shrink-0 relative z-10`}>
                <MapPin className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 pt-2">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{event.description || event.status}</h4>
                    {event.location && (
                      <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                    )}
                  </div>
                  {event.eventDate && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.eventDate).toLocaleString('es-MX')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay eventos de rastreo disponibles</p>
          </div>
        )}
      </div>
    </Card>
  );
}
