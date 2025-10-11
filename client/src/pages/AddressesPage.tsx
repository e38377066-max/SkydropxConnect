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
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const addressSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  contactName: z.string().min(3, "El nombre de contacto debe tener al menos 3 caracteres"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  address: z.string().min(10, "La dirección debe tener al menos 10 caracteres"),
  zipCode: z.string().min(5, "El código postal debe tener al menos 5 dígitos"),
  city: z.string().optional(),
  state: z.string().optional(),
  type: z.enum(["origin", "destination", "both"], {
    required_error: "Selecciona el tipo de dirección",
  }),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const { data: addressesData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ["/api/addresses"],
  });

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      contactName: "",
      phone: "",
      address: "",
      zipCode: "",
      city: "",
      state: "",
      type: "both",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      return apiRequest("POST", "/api/addresses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Dirección guardada",
        description: "La dirección se ha guardado correctamente.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la dirección",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressForm }) => {
      return apiRequest("PATCH", `/api/addresses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Dirección actualizada",
        description: "La dirección se ha actualizado correctamente.",
      });
      setIsDialogOpen(false);
      setEditingAddress(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la dirección",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Dirección eliminada",
        description: "La dirección se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la dirección",
      });
    },
  });

  const addresses = addressesData?.data ?? [];

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    form.reset({
      name: address.name,
      contactName: address.contactName,
      phone: address.phone,
      address: address.address,
      zipCode: address.zipCode,
      city: address.city || "",
      state: address.state || "",
      type: address.type,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: AddressForm) => {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data });
    } else {
      createMutation.mutate(data);
    }
  };


  const getTypeLabel = (type: string) => {
    switch (type) {
      case "origin":
        return "Origen";
      case "destination":
        return "Destino";
      case "both":
        return "Ambos";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6" data-testid="page-addresses">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-addresses-title">
            Direcciones Guardadas
          </h1>
          <p className="text-muted-foreground mt-2">
            Guarda direcciones frecuentes para crear envíos más rápido
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAddress(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-address">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Dirección
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-address-form" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Editar Dirección" : "Nueva Dirección"}
              </DialogTitle>
              <DialogDescription>
                Completa la información de la dirección
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Dirección</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Oficina Principal, Casa"
                          {...field}
                          data-testid="input-address-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Contacto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre completo"
                            {...field}
                            data-testid="input-contact-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="5512345678"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Calle, número, colonia"
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="01000"
                            {...field}
                            data-testid="input-zip-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CDMX"
                            {...field}
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ciudad de México"
                            {...field}
                            data-testid="input-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Dirección</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-address-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="origin">Solo Origen</SelectItem>
                          <SelectItem value="destination">Solo Destino</SelectItem>
                          <SelectItem value="both">Ambos (Origen y Destino)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-address"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-address"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : editingAddress
                      ? "Actualizar"
                      : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando direcciones...</p>
        </div>
      )}

      {!isLoading && addresses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No tienes direcciones guardadas aún
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-address">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Dirección
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && addresses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address: any) => (
            <Card key={address.id} className="hover-elevate" data-testid={`address-card-${address.id}`}>
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{address.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{getTypeLabel(address.type)}</Badge>
                </div>
                <CardDescription>{address.contactName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{address.address}</p>
                <p className="text-sm text-muted-foreground">
                  {address.zipCode}
                  {address.city && `, ${address.city}`}
                  {address.state && `, ${address.state}`}
                </p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(address)}
                    data-testid={`button-edit-address-${address.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(address.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-address-${address.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
