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
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const packageSchema = z.object({
  alias: z.string().min(3, "El alias debe tener al menos 3 caracteres"),
  weight: z.coerce.number().min(0.1, "El peso mínimo es 0.1 kg").max(1000, "El peso máximo es 1000 kg"),
  length: z.coerce.number().min(1, "La longitud mínima es 1 cm").max(500, "La longitud máxima es 500 cm"),
  width: z.coerce.number().min(1, "El ancho mínimo es 1 cm").max(500, "El ancho máximo es 500 cm"),
  height: z.coerce.number().min(1, "La altura mínima es 1 cm").max(500, "La altura máxima es 500 cm"),
});

type PackageForm = z.infer<typeof packageSchema>;

export default function PackagesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const { data: packagesData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ["/api/packages"],
  });

  const form = useForm<PackageForm>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      alias: "",
      weight: 1,
      length: 10,
      width: 10,
      height: 10,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PackageForm) => {
      return apiRequest("POST", "/api/packages", {
        alias: data.alias,
        weight: data.weight.toString(),
        length: data.length.toString(),
        width: data.width.toString(),
        height: data.height.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Paquete guardado",
        description: "El paquete se ha guardado correctamente.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el paquete",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PackageForm }) => {
      return apiRequest("PATCH", `/api/packages/${id}`, {
        alias: data.alias,
        weight: data.weight.toString(),
        length: data.length.toString(),
        width: data.width.toString(),
        height: data.height.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Paquete actualizado",
        description: "El paquete se ha actualizado correctamente.",
      });
      setIsDialogOpen(false);
      setEditingPackage(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el paquete",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: "Paquete eliminado",
        description: "El paquete se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el paquete",
      });
    },
  });

  const packages = packagesData?.data ?? [];

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    form.reset({
      alias: pkg.alias,
      weight: parseFloat(pkg.weight),
      length: parseFloat(pkg.length),
      width: parseFloat(pkg.width),
      height: parseFloat(pkg.height),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: PackageForm) => {
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };


  return (
    <div className="space-y-6" data-testid="page-packages">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-packages-title">
            Paquetes Guardados
          </h1>
          <p className="text-muted-foreground mt-2">
            Guarda dimensiones de paquetes frecuentes para cotizar más rápido
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPackage(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-package">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paquete
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-package-form">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Editar Paquete" : "Nuevo Paquete"}
              </DialogTitle>
              <DialogDescription>
                Completa la información del paquete
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="alias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias del Paquete</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Caja Blanca Pastel, Sobre"
                          {...field}
                          data-testid="input-package-alias"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          {...field}
                          data-testid="input-package-weight"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largo (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="10"
                            {...field}
                            data-testid="input-package-length"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ancho (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="10"
                            {...field}
                            data-testid="input-package-width"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alto (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="10"
                            {...field}
                            data-testid="input-package-height"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-package"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-package"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : editingPackage
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
          <p className="text-muted-foreground">Cargando paquetes...</p>
        </div>
      )}

      {!isLoading && packages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No tienes paquetes guardados aún
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-package">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Paquete
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && packages.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg: any) => (
            <Card key={pkg.id} className="hover-elevate" data-testid={`package-card-${pkg.id}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{pkg.alias}</CardTitle>
                </div>
                <CardDescription>
                  Peso: {parseFloat(pkg.weight).toFixed(2)} kg
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Largo</p>
                    <p className="font-medium">{parseFloat(pkg.length).toFixed(0)} cm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ancho</p>
                    <p className="font-medium">{parseFloat(pkg.width).toFixed(0)} cm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Alto</p>
                    <p className="font-medium">{parseFloat(pkg.height).toFixed(0)} cm</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(pkg)}
                    data-testid={`button-edit-package-${pkg.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(pkg.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-package-${pkg.id}`}
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
