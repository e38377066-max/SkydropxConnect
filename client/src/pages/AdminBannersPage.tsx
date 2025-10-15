import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

type PromotionalBanner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: string;
  displayOrder: string;
  createdAt: string;
};

export default function AdminBannersPage() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
    isActive: "true",
    displayOrder: "0",
  });

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setLocation('/');
    }
  }, [currentUser, setLocation]);

  const { data, isLoading } = useQuery<{ success: boolean; data: PromotionalBanner[] }>({
    queryKey: ['/api/banners'],
    enabled: currentUser?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/banners", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/active'] });
      toast({ title: "Banner creado", description: "El banner se ha creado correctamente" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/banners/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/active'] });
      toast({ title: "Banner actualizado", description: "Los cambios se han guardado" });
      setEditingBanner(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/banners/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners/active'] });
      toast({ title: "Banner eliminado", description: "El banner se ha eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      imageUrl: "",
      linkUrl: "",
      isActive: "true",
      displayOrder: "0",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
    });
  };

  const handleUpdate = () => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    }
  };

  const toggleActive = (banner: PromotionalBanner) => {
    updateMutation.mutate({
      id: banner.id,
      data: { isActive: banner.isActive === 'true' ? 'false' : 'true' }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const banners = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Banners</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-banner">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Banner Promocional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título del banner"
                  data-testid="input-banner-title"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">URL de la Imagen</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-banner-image"
                />
              </div>
              <div>
                <Label htmlFor="linkUrl">URL de Destino (Opcional)</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-banner-link"
                />
              </div>
              <div>
                <Label htmlFor="displayOrder">Orden de Visualización</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  data-testid="input-banner-order"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
                data-testid="button-save-banner"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Banner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {banner.imageUrl ? (
                    <img 
                      src={banner.imageUrl} 
                      alt={banner.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="md:w-2/3 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={banner.isActive === 'true' ? 'default' : 'secondary'}>
                          {banner.isActive === 'true' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Orden: {banner.displayOrder}
                        </span>
                      </div>
                    </div>
                  </div>
                  {banner.linkUrl && (
                    <p className="text-sm text-muted-foreground">
                      Enlace: {banner.linkUrl}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(banner)}
                      data-testid={`button-toggle-${banner.id}`}
                    >
                      {banner.isActive === 'true' ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {banner.isActive === 'true' ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(banner)}
                          data-testid={`button-edit-${banner.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Editar Banner</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-title">Título</Label>
                            <Input
                              id="edit-title"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-imageUrl">URL de la Imagen</Label>
                            <Input
                              id="edit-imageUrl"
                              value={formData.imageUrl}
                              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-linkUrl">URL de Destino</Label>
                            <Input
                              id="edit-linkUrl"
                              value={formData.linkUrl}
                              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-displayOrder">Orden</Label>
                            <Input
                              id="edit-displayOrder"
                              type="number"
                              value={formData.displayOrder}
                              onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                            />
                          </div>
                          <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full">
                            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Cambios
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este banner?')) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                      data-testid={`button-delete-${banner.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay banners creados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
