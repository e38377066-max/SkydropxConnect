import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

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

export default function BillingProfilesManager() {
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

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingProfile(null);
      form.reset();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profiles = profilesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Perfiles de Facturación</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona tus perfiles de facturación guardados
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-profile">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Perfil
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-profiles">
              No tienes perfiles de facturación guardados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile: any) => (
            <Card key={profile.id} data-testid={`card-profile-${profile.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {profile.razonSocial}
                      {profile.isDefault === "true" && (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-default-${profile.id}`}>
                          <Star className="h-3 w-3 fill-current" />
                          Predeterminado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{profile.rfc}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(profile)}
                      data-testid={`button-edit-${profile.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(profile.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${profile.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span> {profile.email}
                </div>
                {profile.direccionFiscal && (
                  <div>
                    <span className="text-muted-foreground">Dirección:</span> {profile.direccionFiscal}
                  </div>
                )}
                {profile.usoCFDI && (
                  <div>
                    <span className="text-muted-foreground">Uso CFDI:</span> {profile.usoCFDI}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-billing-profile">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Editar Perfil de Facturación" : "Nuevo Perfil de Facturación"}
            </DialogTitle>
            <DialogDescription>
              {editingProfile
                ? "Actualiza la información de este perfil de facturación"
                : "Guarda un perfil de facturación para usarlo rápidamente"}
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
                      <FormLabel>RFC *</FormLabel>
                      <FormControl>
                        <Input placeholder="XAXX010101000" {...field} data-testid="input-rfc" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="razonSocial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Empresa S.A. de C.V." {...field} data-testid="input-razon-social" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="facturacion@empresa.com" {...field} data-testid="input-email" />
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
                        <Input placeholder="G03" {...field} data-testid="input-uso-cfdi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="direccionFiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección Fiscal</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle, Número, Colonia" {...field} data-testid="input-direccion" />
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
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="06600" {...field} data-testid="input-cp" />
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
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad de México" {...field} data-testid="input-ciudad" />
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
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="CDMX" {...field} data-testid="input-estado" />
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-default"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Establecer como predeterminado
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este perfil se seleccionará automáticamente al crear envíos
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingProfile ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
