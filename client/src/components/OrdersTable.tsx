import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Download, Search, Package } from "lucide-react";
import { useState } from "react";

type OrderStatus = "pending" | "in-transit" | "delivered" | "cancelled";

interface Order {
  id: string;
  trackingNumber: string;
  carrier: string;
  from: string;
  to: string;
  date: string;
  status: OrderStatus;
  amount: string;
}

const mockOrders: Order[] = [
  {
    id: "1",
    trackingNumber: "SKY123456789MX",
    carrier: "DHL",
    from: "CDMX",
    to: "Monterrey",
    date: "2024-10-01",
    status: "delivered",
    amount: "$245.00",
  },
  {
    id: "2",
    trackingNumber: "SKY987654321MX",
    carrier: "FedEx",
    from: "Guadalajara",
    to: "Tijuana",
    date: "2024-10-02",
    status: "in-transit",
    amount: "$320.00",
  },
  {
    id: "3",
    trackingNumber: "SKY456789123MX",
    carrier: "Estafeta",
    from: "Puebla",
    to: "Cancún",
    date: "2024-10-03",
    status: "pending",
    amount: "$180.00",
  },
];

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  "in-transit": { label: "En Tránsito", variant: "default" },
  delivered: { label: "Entregado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

export default function OrdersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders] = useState<Order[]>(mockOrders);

  const filteredOrders = orders.filter(
    (order) =>
      order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.to.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Mis Envíos</h2>
            <p className="text-sm text-muted-foreground">{filteredOrders.length} envíos registrados</p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por guía, paquetería..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-orders"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Número de Guía</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Paquetería</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Origen → Destino</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Fecha</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Estado</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Monto</th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border hover-elevate transition-colors"
                data-testid={`row-order-${order.id}`}
              >
                <td className="py-4 px-4">
                  <code className="text-sm font-mono text-foreground">{order.trackingNumber}</code>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-foreground">{order.carrier}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-foreground">
                    {order.from} → {order.to}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground">{order.date}</span>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={statusConfig[order.status].variant} data-testid={`badge-status-${order.id}`}>
                    {statusConfig[order.status].label}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-foreground">{order.amount}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => console.log("Ver detalles:", order.id)}
                      data-testid={`button-view-${order.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => console.log("Descargar etiqueta:", order.id)}
                      data-testid={`button-download-${order.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron envíos</p>
          </div>
        )}
      </div>
    </Card>
  );
}
