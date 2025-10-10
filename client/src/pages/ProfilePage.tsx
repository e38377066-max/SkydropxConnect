import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, CreditCard, Shield, Camera, Link as LinkIcon, Unlink } from "lucide-react";
import { SiGoogle, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const contactSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().optional(),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

const billingSchema = z.object({
  rfc: z.string().optional(),
  razonSocial: z.string().optional(),
  direccionFiscal: z.string().optional(),
  codigoPostalFiscal: z.string().optional(),
  ciudadFiscal: z.string().optional(),
  estadoFiscal: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const avatarSchema = z.object({
  profileImageUrl: z.string().url("URL inválida").min(1, "URL requerida"),
});

type ContactData = z.infer<typeof contactSchema>;
type BillingData = z.infer<typeof billingSchema>;
type PasswordData = z.infer<typeof passwordSchema>;
type AvatarData = z.infer<typeof avatarSchema>;

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("contact");
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [unlinkProvider, setUnlinkProvider] = useState<'google' | 'facebook' | null>(null);

  const hasPassword = !!user?.password;
  const hasGoogle = !!user?.googleId;
  const hasFacebook = !!user?.facebookId;

  const contactForm = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const billingForm = useForm<BillingData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      rfc: user?.rfc || "",
      razonSocial: user?.razonSocial || "",
      direccionFiscal: user?.direccionFiscal || "",
      codigoPostalFiscal: user?.codigoPostalFiscal || "",
      ciudadFiscal: user?.ciudadFiscal || "",
      estadoFiscal: user?.estadoFiscal || "",
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const avatarForm = useForm<AvatarData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      profileImageUrl: user?.profileImageUrl || "",
    },
  });

  // Update forms when user data loads
  useEffect(() => {
    if (user) {
      contactForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });

      billingForm.reset({
        rfc: user.rfc || "",
        razonSocial: user.razonSocial || "",
        direccionFiscal: user.direccionFiscal || "",
        codigoPostalFiscal: user.codigoPostalFiscal || "",
        ciudadFiscal: user.ciudadFiscal || "",
        estadoFiscal: user.estadoFiscal || "",
      });

      avatarForm.reset({
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactData) => {
      const response = await apiRequest("PATCH", "/api/user/contact", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Información actualizada",
        description: "Tus datos de contacto se actualizaron correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update billing mutation
  const updateBillingMutation = useMutation({
    mutationFn: async (data: BillingData) => {
      const response = await apiRequest("PATCH", "/api/user/billing", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Información actualizada",
        description: "Tus datos de facturación se actualizaron correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update/add password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordData) => {
      if (hasPassword) {
        // Change existing password
        const response = await apiRequest("PATCH", "/api/user/password", {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        return await response.json();
      } else {
        // Add new password to OAuth account
        const response = await apiRequest("POST", "/api/user/add-password", {
          newPassword: data.newPassword,
        });
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      passwordForm.reset();
      toast({
        title: hasPassword ? "Contraseña actualizada" : "Contraseña agregada",
        description: hasPassword ? "Tu contraseña se cambió correctamente" : "Tu contraseña se agregó correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (data: AvatarData) => {
      const response = await apiRequest("PATCH", "/api/user/avatar", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowAvatarDialog(false);
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se actualizó correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unlink provider mutation
  const unlinkProviderMutation = useMutation({
    mutationFn: async (provider: 'google' | 'facebook') => {
      const response = await apiRequest("POST", "/api/user/unlink-provider", { provider });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setUnlinkProvider(null);
      toast({
        title: "Proveedor desvinculado",
        description: "La red social se desvinculó correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl sm:text-3xl">
                    <User className="w-12 h-12 sm:w-16 sm:h-16" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full shadow-lg"
                  onClick={() => setShowAvatarDialog(true)}
                  data-testid="button-change-avatar"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {user?.firstName || user?.email?.split('@')[0] || 'Usuario'}
                  {user?.lastName && ` ${user.lastName}`}
                </h1>
                <p className="text-muted-foreground mt-1">{user?.email}</p>
                
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {hasPassword && (
                    <Badge variant="secondary" data-testid="badge-has-password">
                      <Shield className="w-3 h-3 mr-1" />
                      Contraseña configurada
                    </Badge>
                  )}
                  {hasGoogle && (
                    <Badge variant="secondary" data-testid="badge-has-google">
                      <SiGoogle className="w-3 h-3 mr-1" />
                      Google conectado
                    </Badge>
                  )}
                  {hasFacebook && (
                    <Badge variant="secondary" data-testid="badge-has-facebook">
                      <SiFacebook className="w-3 h-3 mr-1" />
                      Facebook conectado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="contact" data-testid="tab-contact">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Datos de Contacto</span>
              <span className="sm:hidden">Contacto</span>
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Facturación</span>
              <span className="sm:hidden">Factura</span>
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Seguridad</span>
              <span className="sm:hidden">Seguridad</span>
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">
                  Información de Contacto
                </h2>
                <p className="text-sm text-muted-foreground">
                  Actualiza tu información personal
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={contactForm.handleSubmit((data) =>
                    updateContactMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        {...contactForm.register("firstName")}
                        data-testid="input-firstname"
                      />
                      {contactForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive mt-1">
                          {contactForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        {...contactForm.register("lastName")}
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...contactForm.register("email")}
                      disabled
                      className="bg-muted"
                      data-testid="input-email"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      El email no puede ser modificado
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      {...contactForm.register("phone")}
                      data-testid="input-phone"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={updateContactMutation.isPending}
                    data-testid="button-save-contact"
                  >
                    {updateContactMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">
                  Datos de Facturación
                </h2>
                <p className="text-sm text-muted-foreground">
                  Información fiscal para tus facturas
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={billingForm.handleSubmit((data) =>
                    updateBillingMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rfc">RFC</Label>
                      <Input
                        id="rfc"
                        placeholder="XAXX010101000"
                        {...billingForm.register("rfc")}
                        data-testid="input-rfc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="razonSocial">Razón Social</Label>
                      <Input
                        id="razonSocial"
                        placeholder="Mi Empresa S.A. de C.V."
                        {...billingForm.register("razonSocial")}
                        data-testid="input-razon-social"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="direccionFiscal">Dirección Fiscal</Label>
                    <Input
                      id="direccionFiscal"
                      placeholder="Calle, Número, Colonia"
                      {...billingForm.register("direccionFiscal")}
                      data-testid="input-direccion-fiscal"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="codigoPostalFiscal">Código Postal</Label>
                      <Input
                        id="codigoPostalFiscal"
                        placeholder="06600"
                        {...billingForm.register("codigoPostalFiscal")}
                        data-testid="input-cp-fiscal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ciudadFiscal">Ciudad</Label>
                      <Input
                        id="ciudadFiscal"
                        placeholder="Ciudad de México"
                        {...billingForm.register("ciudadFiscal")}
                        data-testid="input-ciudad-fiscal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estadoFiscal">Estado</Label>
                      <Input
                        id="estadoFiscal"
                        placeholder="CDMX"
                        {...billingForm.register("estadoFiscal")}
                        data-testid="input-estado-fiscal"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateBillingMutation.isPending}
                    data-testid="button-save-billing"
                  >
                    {updateBillingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Password Section */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">
                  {hasPassword ? "Cambiar Contraseña" : "Agregar Contraseña"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {hasPassword 
                    ? "Actualiza tu contraseña de acceso" 
                    : "Agrega una contraseña para poder iniciar sesión sin redes sociales"}
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit((data) =>
                    updatePasswordMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  {hasPassword && (
                    <div>
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        data-testid="input-current-password"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                      data-testid="input-new-password"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirmar Nueva Contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-save-password"
                  >
                    {updatePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {hasPassword ? "Cambiando..." : "Agregando..."}
                      </>
                    ) : hasPassword ? (
                      "Cambiar Contraseña"
                    ) : (
                      "Agregar Contraseña"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Connected Accounts Section */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">
                  Redes Vinculadas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus métodos de autenticación
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <SiGoogle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Google</p>
                      <p className="text-sm text-muted-foreground">
                        {hasGoogle ? "Conectado" : "No conectado"}
                      </p>
                    </div>
                  </div>
                  {hasGoogle && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnlinkProvider('google')}
                      data-testid="button-unlink-google"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Desvincular
                    </Button>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <SiFacebook className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Facebook</p>
                      <p className="text-sm text-muted-foreground">
                        {hasFacebook ? "Conectado" : "Próximamente"}
                      </p>
                    </div>
                  </div>
                  {hasFacebook && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnlinkProvider('facebook')}
                      data-testid="button-unlink-facebook"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Desvincular
                    </Button>
                  )}
                </div>

                {!hasPassword && (hasGoogle || hasFacebook) && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Agrega una contraseña antes de desvincular tus redes sociales para no perder acceso a tu cuenta.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Avatar Dialog */}
      <AlertDialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar Foto de Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Ingresa la URL de tu nueva foto de perfil
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={avatarForm.handleSubmit((data) => updateAvatarMutation.mutate(data))}>
            <div className="py-4">
              <Label htmlFor="profileImageUrl">URL de la imagen</Label>
              <Input
                id="profileImageUrl"
                placeholder="https://ejemplo.com/mi-foto.jpg"
                {...avatarForm.register("profileImageUrl")}
                data-testid="input-avatar-url"
              />
              {avatarForm.formState.errors.profileImageUrl && (
                <p className="text-sm text-destructive mt-1">
                  {avatarForm.formState.errors.profileImageUrl.message}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button 
                type="submit" 
                disabled={updateAvatarMutation.isPending}
                data-testid="button-save-avatar"
              >
                {updateAvatarMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Provider Confirmation Dialog */}
      <AlertDialog open={!!unlinkProvider} onOpenChange={() => setUnlinkProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de desvincular tu cuenta de {unlinkProvider === 'google' ? 'Google' : 'Facebook'}. 
              {hasPassword 
                ? ' Podrás seguir accediendo con tu contraseña.' 
                : ' Asegúrate de tener otro método de autenticación configurado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkProvider && unlinkProviderMutation.mutate(unlinkProvider)}
              disabled={unlinkProviderMutation.isPending}
              data-testid="button-confirm-unlink"
            >
              {unlinkProviderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Desvinculando...
                </>
              ) : (
                "Desvincular"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
