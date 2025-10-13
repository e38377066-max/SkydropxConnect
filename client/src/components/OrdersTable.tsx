import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Download, Search, Package, Loader2, RefreshCcw, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type OrderStatus = "pending" | "in_transit" | "in-transit" | "delivered" | "cancelled" | "created";

interface Order {
  id: string;
  trackingNumber: string;
  carrier: string;
  senderZipCode: string;
  receiverZipCode: string;
  createdAt: string;
  status: OrderStatus;
  amount: string;
  currency: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  created: { label: "Creada", variant: "outline" },
  "in-transit": { label: "En Tránsito", variant: "default" },
  in_transit: { label: "En Tránsito", variant: "default" },
  delivered: { label: "Entregado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

export default function OrdersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: Order[] }>({
    queryKey: ['/api/shipments'],
  });

  const syncMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await apiRequest("POST", `/api/shipments/${shipmentId}/sync`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      toast({
        title: "Estado sincronizado",
        description: data.message || "El estado del envío se actualizó correctamente",
      });
      setSyncingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al sincronizar",
        description: error.message || "No se pudo actualizar el estado del envío",
        variant: "destructive",
      });
      setSyncingId(null);
    },
  });

  const handleSync = (shipmentId: string) => {
    setSyncingId(shipmentId);
    syncMutation.mutate(shipmentId);
  };

  const cancelMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await apiRequest("POST", `/api/shipments/${shipmentId}/cancel`, {
        reason: "Ya no es necesario",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      toast({
        title: "Envío cancelado",
        description: data.message || "El envío fue cancelado y se reembolsó el monto a tu billetera",
      });
      setCancellingId(null);
      setOrderToCancel(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar el envío",
        variant: "destructive",
      });
      setCancellingId(null);
      setOrderToCancel(null);
    },
  });

  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      setCancellingId(orderToCancel.id);
      cancelMutation.mutate(orderToCancel.id);
    }
  };

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error al cargar envíos",
        description: "No se pudieron cargar los envíos. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const orders = data?.data || [];

  const filteredOrders = orders.filter(
    (order) =>
      order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.senderZipCode.includes(searchTerm) ||
      order.receiverZipCode.includes(searchTerm)
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
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Cargando..." : `${filteredOrders.length} envíos registrados`}
            </p>
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

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Cargando envíos...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-2">Error al cargar los envíos</p>
          <p className="text-muted-foreground mb-4">No se pudieron cargar los envíos. Por favor, intenta de nuevo.</p>
        </div>
      ) : (
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
                    <code className="text-sm font-mono text-foreground">
                      {order.trackingNumber || <span className="text-muted-foreground italic">Procesando...</span>}
                    </code>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-foreground">{order.carrier}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-foreground">
                      {order.senderZipCode} → {order.receiverZipCode}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('es-MX')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={statusConfig[order.status]?.variant || "outline"}
                      data-testid={`badge-status-${order.id}`}
                    >
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-foreground">
                      ${parseFloat(order.amount).toFixed(2)} {order.currency}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === "pending" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSync(order.id)}
                          disabled={syncingId === order.id}
                          data-testid={`button-sync-${order.id}`}
                          title="Sincronizar estado"
                        >
                          <RefreshCcw className={`w-4 h-4 ${syncingId === order.id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCancelClick(order)}
                          disabled={cancellingId === order.id}
                          data-testid={`button-cancel-${order.id}`}
                          title="Cancelar envío"
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => order.trackingNumber && (window.location.href = `/rastrear?tracking=${order.trackingNumber}`)}
                        disabled={!order.trackingNumber}
                        data-testid={`button-view-${order.id}`}
                        title="Ver rastreo"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => console.log("Descargar etiqueta:", order.id)}
                        data-testid={`button-download-${order.id}`}
                        title="Descargar etiqueta"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron envíos</p>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar este envío?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará el envío y se reembolsará el monto de <strong>${orderToCancel ? parseFloat(orderToCancel.amount).toFixed(2) : '0.00'} MXN</strong> a tu billetera.
              {orderToCancel?.trackingNumber && (
                <span className="block mt-2 font-mono text-sm">
                  Guía: {orderToCancel.trackingNumber}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingId === orderToCancel?.id}>
              No, mantener envío
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancellingId === orderToCancel?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingId === orderToCancel?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sí, cancelar envío'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
