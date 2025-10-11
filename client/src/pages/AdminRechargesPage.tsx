import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RechargeRequest {
  id: string;
  userId: string;
  amount: string;
  paymentMethod: string;
  paymentReference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  adminId: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminRechargesPage() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: pendingRequests, isLoading: isLoadingPending } = useQuery<RechargeRequest[]>({
    queryKey: ["/api/admin/recharge/requests?status=pending"],
  });

  const { data: allRequests, isLoading: isLoadingAll } = useQuery<RechargeRequest[]>({
    queryKey: ["/api/admin/recharge/requests"],
  });

  const processedRequests = allRequests?.filter(r => r.status !== 'pending') || [];

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: 'approved' | 'rejected'; adminNotes?: string }) => {
      return await apiRequest(`/api/admin/recharge/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recharge/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recharge/requests?status=pending"] });
      setIsApproveDialogOpen(false);
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      toast({
        title: "Solicitud actualizada",
        description: "La solicitud de recarga ha sido procesada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: RechargeRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (request: RechargeRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        id: selectedRequest.id,
        status: 'approved',
        adminNotes: adminNotes || undefined,
      });
    }
  };

  const confirmReject = () => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        id: selectedRequest.id,
        status: 'rejected',
        adminNotes: adminNotes || undefined,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" data-testid={`badge-status-pending`}>Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-600 hover:bg-green-700" data-testid={`badge-status-approved`}>Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" data-testid={`badge-status-rejected`}>Rechazada</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-unknown`}>{status}</Badge>;
    }
  };

  const renderRequestCard = (request: RechargeRequest, showActions: boolean = true) => (
    <Card key={request.id} data-testid={`card-recharge-${request.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg" data-testid={`text-request-id-${request.id}`}>
              Solicitud #{request.id.slice(0, 8)}
            </CardTitle>
            <CardDescription data-testid={`text-request-date-${request.id}`}>
              {format(new Date(request.createdAt), "PPP 'a las' p", { locale: es })}
            </CardDescription>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Usuario ID</p>
            <p className="font-medium" data-testid={`text-user-id-${request.id}`}>{request.userId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monto</p>
            <p className="font-medium text-lg" data-testid={`text-amount-${request.id}`}>
              ${parseFloat(request.amount).toFixed(2)} MXN
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Método de pago</p>
            <p className="font-medium" data-testid={`text-payment-method-${request.id}`}>{request.paymentMethod}</p>
          </div>
          {request.paymentReference && (
            <div>
              <p className="text-muted-foreground">Referencia</p>
              <p className="font-medium" data-testid={`text-payment-reference-${request.id}`}>{request.paymentReference}</p>
            </div>
          )}
        </div>

        {request.adminNotes && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Notas del administrador</p>
            <p className="text-sm mt-1" data-testid={`text-admin-notes-${request.id}`}>{request.adminNotes}</p>
          </div>
        )}

        {request.processedAt && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Procesada el</p>
            <p className="text-sm mt-1" data-testid={`text-processed-date-${request.id}`}>
              {format(new Date(request.processedAt), "PPP 'a las' p", { locale: es })}
            </p>
          </div>
        )}

        {showActions && request.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleApprove(request)}
              disabled={updateRequestMutation.isPending}
              data-testid={`button-approve-${request.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleReject(request)}
              disabled={updateRequestMutation.isPending}
              data-testid={`button-reject-${request.id}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-admin-recharges">Gestión de Recargas</h1>
        <p className="text-muted-foreground" data-testid="text-admin-recharges-description">
          Administra las solicitudes de recarga de los usuarios
        </p>
      </div>

      <Tabs defaultValue="pending" data-testid="tabs-recharge-requests">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2" data-testid="badge-pending-count">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" data-testid="tab-processed">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4" data-testid="content-pending">
          {isLoadingPending ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="grid gap-4">
              {pendingRequests
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(request => renderRequestCard(request, true))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground" data-testid="text-no-pending">
                  No hay solicitudes pendientes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4" data-testid="content-processed">
          {isLoadingAll ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : processedRequests && processedRequests.length > 0 ? (
            <div className="grid gap-4">
              {processedRequests
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map(request => renderRequestCard(request, false))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground" data-testid="text-no-processed">
                  No hay solicitudes procesadas
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent data-testid="dialog-approve">
          <DialogHeader>
            <DialogTitle>Aprobar Solicitud de Recarga</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas aprobar esta solicitud de recarga por{" "}
              <strong>${selectedRequest ? parseFloat(selectedRequest.amount).toFixed(2) : '0.00'} MXN</strong>?
              El saldo del usuario será actualizado automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-notes">Notas (opcional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Agrega notas sobre esta aprobación..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                data-testid="textarea-approve-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setAdminNotes("");
              }}
              disabled={updateRequestMutation.isPending}
              data-testid="button-cancel-approve"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={confirmApprove}
              disabled={updateRequestMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {updateRequestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aprobar Recarga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud de Recarga</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar esta solicitud de recarga?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-notes">Motivo del rechazo (opcional)</Label>
              <Textarea
                id="reject-notes"
                placeholder="Explica el motivo del rechazo..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                data-testid="textarea-reject-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setAdminNotes("");
              }}
              disabled={updateRequestMutation.isPending}
              data-testid="button-cancel-reject"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={updateRequestMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {updateRequestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rechazar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
