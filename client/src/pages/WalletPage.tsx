import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const rechargeSchema = z.object({
  amount: z.coerce.number().min(100, "El monto mínimo es $100 MXN").max(50000, "El monto máximo es $50,000 MXN"),
  paymentMethod: z.enum(["transferencia", "deposito", "oxxo"], {
    required_error: "Selecciona un método de pago",
  }),
  paymentReference: z.string().min(5, "La referencia debe tener al menos 5 caracteres"),
});

type RechargeForm = z.infer<typeof rechargeSchema>;

export default function WalletPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: balanceData, isLoading: isLoadingBalance } = useQuery<{ data: { balance: string } }>({
    queryKey: ["/api/wallet/balance"],
  });

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery<{ data: any[] }>({
    queryKey: ["/api/wallet/transactions"],
  });

  const { data: rechargeRequestsData, isLoading: isLoadingRequests } = useQuery<{ data: any[] }>({
    queryKey: ["/api/wallet/recharge-requests"],
  });

  const form = useForm<RechargeForm>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      amount: 500,
      paymentMethod: "transferencia",
      paymentReference: "",
    },
  });

  const rechargeMutation = useMutation({
    mutationFn: async (data: RechargeForm) => {
      return apiRequest("POST", "/api/wallet/recharge", {
        amount: data.amount.toString(),
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/recharge-requests"] });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de recarga ha sido enviada y está pendiente de aprobación.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud de recarga",
      });
    },
  });

  const balance = balanceData?.data?.balance ?? "0";
  const transactions = transactionsData?.data ?? [];
  const rechargeRequests = rechargeRequestsData?.data ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Aprobada</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rechazada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="page-wallet">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-wallet-title">
            Billetera
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra tu saldo y solicita recargas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-request-recharge">
              <DollarSign className="mr-2 h-4 w-4" />
              Solicitar Recarga
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-recharge-request">
            <DialogHeader>
              <DialogTitle>Solicitar Recarga</DialogTitle>
              <DialogDescription>
                Completa el formulario para solicitar una recarga a tu billetera
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => rechargeMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto (MXN)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          {...field}
                          data-testid="input-recharge-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue placeholder="Selecciona un método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                          <SelectItem value="deposito">Depósito en Efectivo</SelectItem>
                          <SelectItem value="oxxo">Pago en OXXO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia de Pago</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Transferencia 12345"
                          {...field}
                          data-testid="input-payment-reference"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-recharge"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={rechargeMutation.isPending}
                    data-testid="button-submit-recharge"
                  >
                    {rechargeMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="card-balance">
        <CardHeader className="pb-3">
          <CardDescription>Saldo Disponible</CardDescription>
          <CardTitle className="text-4xl flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            ${parseFloat(balance).toFixed(2)} MXN
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBalance && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!isLoadingBalance && parseFloat(balance) < 100 && (
            <p className="text-sm text-orange-600">
              Tu saldo está por debajo de $100 MXN. Considera recargar para crear envíos.
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            Transacciones
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Solicitudes de Recarga
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card data-testid="card-transactions">
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
              <CardDescription>
                Todas tus transacciones de depósitos y retiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions && (
                <p className="text-sm text-muted-foreground">Cargando transacciones...</p>
              )}
              {!isLoadingTransactions && transactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tienes transacciones aún
                </p>
              )}
              {!isLoadingTransactions && transactions.length > 0 && (
                <div className="space-y-2">
                  {transactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {transaction.type === "deposit" ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.type === "deposit" ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: ${parseFloat(transaction.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card data-testid="card-recharge-requests">
            <CardHeader>
              <CardTitle>Solicitudes de Recarga</CardTitle>
              <CardDescription>
                Historial de tus solicitudes de recarga
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests && (
                <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
              )}
              {!isLoadingRequests && rechargeRequests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tienes solicitudes de recarga aún
                </p>
              )}
              {!isLoadingRequests && rechargeRequests.length > 0 && (
                <div className="space-y-2">
                  {rechargeRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`recharge-request-${request.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">${parseFloat(request.amount).toFixed(2)} MXN</p>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.paymentMethod} - {request.paymentReference}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado: {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}
                        </p>
                        {request.processedAt && (
                          <p className="text-xs text-muted-foreground">
                            Procesado: {format(new Date(request.processedAt), "dd/MM/yyyy HH:mm")}
                          </p>
                        )}
                        {request.adminNotes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Notas:</strong> {request.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
