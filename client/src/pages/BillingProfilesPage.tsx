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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Pencil, Trash2, Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const billingProfileSchema = z.object({
  rfc: z.string().min(12, "El RFC debe tener al menos 12 caracteres").max(13, "El RFC debe tener máximo 13 caracteres"),
  razonSocial: z.string().min(3, "La razón social debe tener al menos 3 caracteres"),
  usoCFDI: z.string().optional(),
  email: z.string().email("Email inválido"),
  direccionFiscal: z.string().optional(),
  codigoPostalFiscal: z.string().optional(),
  ciudadFiscal: z.string().optional(),
  estadoFiscal: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type BillingProfileForm = z.infer<typeof billingProfileSchema>;

export default function BillingProfilesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  const { data: profilesData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ["/api/billing-profiles"],
  });

  const form = useForm<BillingProfileForm>({
    resolver: zodResolver(billingProfileSchema),
    defaultValues: {
      rfc: "",
      razonSocial: "",
      usoCFDI: "G03",
      email: "",
      direccionFiscal: "",
      codigoPostalFiscal: "",
      ciudadFiscal: "",
      estadoFiscal: "",
      isDefault: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BillingProfileForm) => {
      return apiRequest("POST", "/api/billing-profiles", {
        ...data,
        isDefault: data.isDefault ? "true" : "false",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-profiles"] });
      toast({
        title: "Perfil guardado",
        description: "El perfil de facturación se ha guardado correctamente.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el perfil",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BillingProfileForm }) => {
      return apiRequest("PATCH", `/api/billing-profiles/${id}`, {
        ...data,
        isDefault: data.isDefault ? "true" : "false",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-profiles"] });
      toast({
        title: "Perfil actualizado",
        description: "El perfil de facturación se ha actualizado correctamente.",
      });
      setIsDialogOpen(false);
      setEditingProfile(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/billing-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-profiles"] });
      toast({
        title: "Perfil eliminado",
        description: "El perfil de facturación se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el perfil",
      });
    },
  });

  const profiles = profilesData?.data ?? [];

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    form.reset({
      rfc: profile.rfc,
      razonSocial: profile.razonSocial,
      usoCFDI: profile.usoCFDI || "G03",
      email: profile.email,
      direccionFiscal: profile.direccionFiscal || "",
      codigoPostalFiscal: profile.codigoPostalFiscal || "",
      ciudadFiscal: profile.ciudadFiscal || "",
      estadoFiscal: profile.estadoFiscal || "",
      isDefault: profile.isDefault === "true",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: BillingProfileForm) => {
    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, data });
    } else {
      createMutation.mutate(data);
    }
  };


  return (
    <div className="space-y-6" data-testid="page-billing-profiles">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-billing-profiles-title">
            Perfiles de Facturación
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra múltiples RFC para tus facturas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProfile(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-billing-profile">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Perfil
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-billing-profile-form" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? "Editar Perfil de Facturación" : "Nuevo Perfil de Facturación"}
              </DialogTitle>
              <DialogDescription>
                Completa la información fiscal
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rfc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RFC</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XAXX010101000"
                            {...field}
                            data-testid="input-rfc"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="usoCFDI"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uso CFDI</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="G03 - Gastos en general"
                            {...field}
                            data-testid="input-uso-cfdi"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="razonSocial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre o razón social"
                          {...field}
                          data-testid="input-razon-social"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Facturación</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="facturacion@empresa.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="direccionFiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección Fiscal (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Calle, número, colonia"
                          {...field}
                          data-testid="input-direccion-fiscal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="codigoPostalFiscal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>C.P. (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="01000"
                            {...field}
                            data-testid="input-codigo-postal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ciudadFiscal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CDMX"
                            {...field}
                            data-testid="input-ciudad"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estadoFiscal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ciudad de México"
                            {...field}
                            data-testid="input-estado"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-is-default"
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Usar como perfil predeterminado</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-billing-profile"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-billing-profile"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : editingProfile
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
          <p className="text-muted-foreground">Cargando perfiles...</p>
        </div>
      )}

      {!isLoading && profiles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No tienes perfiles de facturación guardados aún
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-billing-profile">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Perfil
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile: any) => (
            <Card key={profile.id} className="hover-elevate" data-testid={`billing-profile-card-${profile.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{profile.razonSocial}</CardTitle>
                  </div>
                  {profile.isDefault === "true" && (
                    <Badge className="gap-1">
                      <Star className="h-3 w-3" />
                      Predeterminado
                    </Badge>
                  )}
                </div>
                <CardDescription>RFC: {profile.rfc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {profile.email}</p>
                  {profile.usoCFDI && <p><strong>Uso CFDI:</strong> {profile.usoCFDI}</p>}
                  {profile.direccionFiscal && (
                    <p className="text-muted-foreground">{profile.direccionFiscal}</p>
                  )}
                  {(profile.codigoPostalFiscal || profile.ciudadFiscal || profile.estadoFiscal) && (
                    <p className="text-muted-foreground">
                      {profile.codigoPostalFiscal && `${profile.codigoPostalFiscal}`}
                      {profile.ciudadFiscal && `, ${profile.ciudadFiscal}`}
                      {profile.estadoFiscal && `, ${profile.estadoFiscal}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(profile)}
                    data-testid={`button-edit-billing-profile-${profile.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(profile.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-billing-profile-${profile.id}`}
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
