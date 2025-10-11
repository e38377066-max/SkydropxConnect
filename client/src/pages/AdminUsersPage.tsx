import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Shield, Calendar, UserCog, Settings, Percent, Save } from "lucide-react";
import { SiGoogle, SiFacebook } from "react-icons/si";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AdminUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  googleId?: string;
  facebookId?: string;
  phone?: string;
  createdAt: string;
};

type Setting = {
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profitMargin, setProfitMargin] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setLocation('/');
    }
  }, [currentUser, setLocation]);

  const { data, isLoading, error } = useQuery<{ success: boolean; users: AdminUser[] }>({
    queryKey: ['/api/admin/usuarios'],
    enabled: currentUser?.role === 'admin',
  });

  const { data: settingsData } = useQuery<{ success: boolean; settings: Setting[] }>({
    queryKey: ['/api/admin/settings'],
    enabled: currentUser?.role === 'admin',
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description?: string }) => {
      const response = await apiRequest("PATCH", "/api/admin/settings", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Configuración actualizada",
        description: "El porcentaje de ganancia se ha guardado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    },
  });

  // Load profit margin from settings
  useEffect(() => {
    if (settingsData?.settings) {
      const profitSetting = settingsData.settings.find(s => s.key === 'profit_margin_percentage');
      if (profitSetting) {
        setProfitMargin(profitSetting.value);
      }
    }
  }, [settingsData]);

  const handleSaveProfitMargin = () => {
    const value = parseFloat(profitMargin);
    if (isNaN(value) || value < 0 || value > 100) {
      toast({
        title: "Valor inválido",
        description: "El porcentaje debe ser un número entre 0 y 100",
        variant: "destructive",
      });
      return;
    }

    updateSettingMutation.mutate({
      key: 'profit_margin_percentage',
      value: profitMargin,
      description: 'Porcentaje de ganancia aplicado a las cotizaciones de envío',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error al cargar usuarios. Verifica que tengas permisos de administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = data.users || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-primary/10">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
          </div>
          <p className="text-muted-foreground ml-16">
            Gestiona los usuarios de la plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                  <p className="text-3xl font-bold text-foreground">{users.length}</p>
                </div>
                <User className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-3xl font-bold text-foreground">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Con OAuth</p>
                  <p className="text-3xl font-bold text-foreground">
                    {users.filter(u => u.googleId || u.facebookId).length}
                  </p>
                </div>
                <SiGoogle className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Configuration */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Configuración del Sistema</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profit-margin" className="text-base font-semibold">
                    Porcentaje de Ganancia
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Este porcentaje se suma al precio base de Skydropx en las cotizaciones. Es tu margen de ganancia.
                  </p>
                  <div className="flex gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Input
                        id="profit-margin"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(e.target.value)}
                        placeholder="15"
                        className="pr-10"
                        data-testid="input-profit-margin"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    <Button
                      onClick={handleSaveProfitMargin}
                      disabled={updateSettingMutation.isPending}
                      data-testid="button-save-profit-margin"
                    >
                      {updateSettingMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ejemplo: Con 15%, un envío de $100 se cotiza en $115
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <h2 className="text-2xl font-bold text-foreground">Lista de Usuarios</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Autenticación</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      data-testid={`user-row-${user.id}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              <User className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.firstName || 'Sin nombre'}
                              {user.lastName && ` ${user.lastName}`}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          data-testid={`badge-role-${user.id}`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              Usuario
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          {user.googleId && (
                            <Badge variant="outline" className="gap-1">
                              <SiGoogle className="w-3 h-3" />
                              Google
                            </Badge>
                          )}
                          {user.facebookId && (
                            <Badge variant="outline" className="gap-1">
                              <SiFacebook className="w-3 h-3" />
                              Facebook
                            </Badge>
                          )}
                          {!user.googleId && !user.facebookId && (
                            <Badge variant="outline" className="gap-1">
                              <Mail className="w-3 h-3" />
                              Local
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.createdAt).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay usuarios registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
