import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, Ticket, Percent, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type PromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string;
  isActive: string;
  usageLimit?: string;
  usedCount: string;
  expiresAt?: string;
  createdAt: string;
};

export default function AdminPromoCodesPage() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    usageLimit: "",
    expiresAt: "",
  });

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setLocation('/');
    }
  }, [currentUser, setLocation]);

  const { data, isLoading } = useQuery<{ success: boolean; data: PromoCode[] }>({
    queryKey: ['/api/promo-codes'],
    enabled: currentUser?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isActive: "true",
      };
      const response = await apiRequest("POST", "/api/promo-codes", payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      toast({ title: "Código creado", description: "El código promocional se ha creado correctamente" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/promo-codes/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      toast({ title: "Código actualizado", description: "Los cambios se han guardado" });
      setEditingCode(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/promo-codes/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      toast({ title: "Código eliminado", description: "El código se ha eliminado correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      usageLimit: "",
      expiresAt: "",
    });
  };

  const handleCreate = () => {
    if (!formData.code || !formData.discountValue) {
      toast({ title: "Error", description: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discountType: code.discountType as "percentage" | "fixed",
      discountValue: code.discountValue,
      usageLimit: code.usageLimit || "",
      expiresAt: code.expiresAt ? format(new Date(code.expiresAt), 'yyyy-MM-dd') : "",
    });
  };

  const handleUpdate = () => {
    if (editingCode) {
      const payload = {
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      };
      updateMutation.mutate({ id: editingCode.id, data: payload });
    }
  };

  const toggleActive = (code: PromoCode) => {
    updateMutation.mutate({
      id: code.id,
      data: { isActive: code.isActive === 'true' ? 'false' : 'true' }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const promoCodes = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Códigos Promocionales</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-promo-code">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Código
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Código Promocional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DESCUENTO10"
                  data-testid="input-promo-code"
                />
              </div>
              <div>
                <Label htmlFor="discountType">Tipo de Descuento</Label>
                <Select 
                  value={formData.discountType} 
                  onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">
                  {formData.discountType === 'percentage' ? 'Porcentaje de Descuento' : 'Monto de Descuento (MXN)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                  data-testid="input-discount-value"
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Límite de Usos (Opcional)</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Sin límite"
                  data-testid="input-usage-limit"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Fecha de Expiración (Opcional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  data-testid="input-expires-at"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
                data-testid="button-save-promo-code"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Código
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promoCodes.map((code) => (
          <Card key={code.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg font-mono">{code.code}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={code.isActive === 'true' ? 'default' : 'secondary'}>
                        {code.isActive === 'true' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline">
                        {code.discountType === 'percentage' ? (
                          <><Percent className="w-3 h-3 mr-1" /> {code.discountValue}%</>
                        ) : (
                          <><DollarSign className="w-3 h-3 mr-1" /> ${code.discountValue}</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Usos:</span>
                    <span className="font-medium">
                      {code.usedCount || '0'}{code.usageLimit ? ` / ${code.usageLimit}` : ''}
                    </span>
                  </div>
                  {code.expiresAt && (
                    <div className="flex justify-between">
                      <span>Expira:</span>
                      <span className="font-medium">
                        {format(new Date(code.expiresAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(code)}
                    data-testid={`button-toggle-${code.id}`}
                  >
                    {code.isActive === 'true' ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {code.isActive === 'true' ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(code)}
                        data-testid={`button-edit-${code.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar Código</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Código</Label>
                          <Input value={formData.code} disabled className="font-mono" />
                        </div>
                        <div>
                          <Label htmlFor="edit-discountType">Tipo de Descuento</Label>
                          <Select 
                            value={formData.discountType} 
                            onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                              <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-discountValue">Valor del Descuento</Label>
                          <Input
                            id="edit-discountValue"
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-usageLimit">Límite de Usos</Label>
                          <Input
                            id="edit-usageLimit"
                            type="number"
                            value={formData.usageLimit}
                            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-expiresAt">Fecha de Expiración</Label>
                          <Input
                            id="edit-expiresAt"
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
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
                      if (confirm('¿Estás seguro de eliminar este código?')) {
                        deleteMutation.mutate(code.id);
                      }
                    }}
                    data-testid={`button-delete-${code.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {promoCodes.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center">
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay códigos promocionales creados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
