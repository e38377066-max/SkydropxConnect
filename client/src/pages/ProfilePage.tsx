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
import { 
  Loader2, 
  User, 
  CreditCard, 
  Shield, 
  Camera, 
  Link as LinkIcon, 
  Unlink,
  Check,
  X,
  Mail,
  Phone,
  Building,
  MapPin,
  Lock,
  Key,
  AlertCircle
} from "lucide-react";
import { SiGoogle, SiFacebook, SiX } from "react-icons/si";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [unlinkProvider, setUnlinkProvider] = useState<'google' | 'facebook' | 'twitter' | null>(null);

  const hasPassword = !!user?.password;
  const hasGoogle = !!user?.googleId;
  const hasFacebook = !!user?.facebookId;
  const hasTwitter = !!user?.twitterId;

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
    mutationFn: async (provider: 'google' | 'facebook' | 'twitter') => {
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

  const handleLinkProvider = (provider: 'google' | 'facebook' | 'twitter') => {
    if (provider === 'google') {
      window.location.href = '/api/login-google';
    } else if (provider === 'twitter') {
      window.location.href = '/api/login-twitter';
    } else if (provider === 'facebook') {
      toast({
        title: "Próximamente",
        description: "La integración con Facebook estará disponible pronto",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Header - Enhanced */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <Avatar className="relative w-28 h-28 sm:w-36 sm:h-36 border-4 border-background shadow-2xl">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <User className="w-14 h-14 sm:w-20 sm:h-20 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full shadow-xl hover:scale-110 transition-transform"
                  onClick={() => setShowAvatarDialog(true)}
                  data-testid="button-change-avatar"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {user?.firstName || user?.email?.split('@')[0] || 'Usuario'}
                    {user?.lastName && ` ${user.lastName}`}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {hasPassword && (
                    <Badge variant="secondary" className="shadow-md" data-testid="badge-has-password">
                      <Shield className="w-3 h-3 mr-1" />
                      Contraseña
                    </Badge>
                  )}
                  {hasGoogle && (
                    <Badge variant="secondary" className="shadow-md" data-testid="badge-has-google">
                      <SiGoogle className="w-3 h-3 mr-1" />
                      Google
                    </Badge>
                  )}
                  {hasFacebook && (
                    <Badge variant="secondary" className="shadow-md" data-testid="badge-has-facebook">
                      <SiFacebook className="w-3 h-3 mr-1" />
                      Facebook
                    </Badge>
                  )}
                  {hasTwitter && (
                    <Badge variant="secondary" className="shadow-md" data-testid="badge-has-twitter">
                      <SiX className="w-3 h-3 mr-1" />
                      X/Twitter
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - Enhanced */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="contact" 
              data-testid="tab-contact"
              className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Datos de Contacto</span>
              <span className="sm:hidden">Contacto</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              data-testid="tab-billing"
              className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Facturación</span>
              <span className="sm:hidden">Factura</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              data-testid="tab-security"
              className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-md"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Seguridad</span>
              <span className="sm:hidden">Seguridad</span>
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab - Enhanced */}
          <TabsContent value="contact">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Información de Contacto
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Actualiza tu información personal
                    </p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form
                  onSubmit={contactForm.handleSubmit((data) =>
                    updateContactMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-base font-medium">Nombre</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          {...contactForm.register("firstName")}
                          className="pl-10"
                          data-testid="input-firstname"
                        />
                      </div>
                      {contactForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {contactForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-base font-medium">Apellido</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          {...contactForm.register("lastName")}
                          className="pl-10"
                          data-testid="input-lastname"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        {...contactForm.register("email")}
                        disabled
                        className="pl-10 bg-muted/50"
                        data-testid="input-email"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      El email no puede ser modificado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        {...contactForm.register("phone")}
                        className="pl-10"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateContactMutation.isPending}
                    className="w-full sm:w-auto shadow-lg"
                    size="lg"
                    data-testid="button-save-contact"
                  >
                    {updateContactMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando cambios...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab - Enhanced */}
          <TabsContent value="billing">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Datos de Facturación
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Información fiscal para tus facturas
                    </p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form
                  onSubmit={billingForm.handleSubmit((data) =>
                    updateBillingMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rfc" className="text-base font-medium">RFC</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="rfc"
                          placeholder="XAXX010101000"
                          {...billingForm.register("rfc")}
                          className="pl-10"
                          data-testid="input-rfc"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razonSocial" className="text-base font-medium">Razón Social</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="razonSocial"
                          placeholder="Mi Empresa S.A. de C.V."
                          {...billingForm.register("razonSocial")}
                          className="pl-10"
                          data-testid="input-razon-social"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccionFiscal" className="text-base font-medium">Dirección Fiscal</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="direccionFiscal"
                        placeholder="Calle, Número, Colonia"
                        {...billingForm.register("direccionFiscal")}
                        className="pl-10"
                        data-testid="input-direccion-fiscal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="codigoPostalFiscal" className="text-base font-medium">Código Postal</Label>
                      <Input
                        id="codigoPostalFiscal"
                        placeholder="06600"
                        {...billingForm.register("codigoPostalFiscal")}
                        data-testid="input-cp-fiscal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudadFiscal" className="text-base font-medium">Ciudad</Label>
                      <Input
                        id="ciudadFiscal"
                        placeholder="Ciudad de México"
                        {...billingForm.register("ciudadFiscal")}
                        data-testid="input-ciudad-fiscal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estadoFiscal" className="text-base font-medium">Estado</Label>
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
                    className="w-full sm:w-auto shadow-lg"
                    size="lg"
                    data-testid="button-save-billing"
                  >
                    {updateBillingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando cambios...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab - Enhanced */}
          <TabsContent value="security" className="space-y-6">
            {/* Password Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {hasPassword ? "Cambiar Contraseña" : "Agregar Contraseña"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {hasPassword 
                        ? "Actualiza tu contraseña de acceso" 
                        : "Agrega una contraseña para poder iniciar sesión sin redes sociales"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <form
                  onSubmit={passwordForm.handleSubmit((data) =>
                    updatePasswordMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  {hasPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-base font-medium">Contraseña Actual</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          type="password"
                          {...passwordForm.register("currentPassword")}
                          className="pl-10"
                          data-testid="input-current-password"
                        />
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-base font-medium">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register("newPassword")}
                        className="pl-10"
                        data-testid="input-new-password"
                      />
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-base font-medium">
                      Confirmar Nueva Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                        className="pl-10"
                        data-testid="input-confirm-password"
                      />
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    className="w-full sm:w-auto shadow-lg"
                    size="lg"
                    data-testid="button-save-password"
                  >
                    {updatePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {hasPassword ? "Cambiando..." : "Agregando..."}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {hasPassword ? "Cambiar Contraseña" : "Agregar Contraseña"}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Connected Accounts Section - Enhanced */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LinkIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Redes Vinculadas
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Gestiona tus métodos de autenticación
                    </p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                {/* Google */}
                <div className="flex items-center justify-between p-5 border-2 rounded-xl hover:border-primary/50 transition-colors bg-gradient-to-r from-card to-card/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      hasGoogle ? 'bg-gradient-to-br from-red-500/20 to-yellow-500/20' : 'bg-muted'
                    }`}>
                      <SiGoogle className={`w-6 h-6 ${hasGoogle ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Google</p>
                      <div className="flex items-center gap-2 mt-1">
                        {hasGoogle ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-green-500 font-medium">Conectado</p>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No conectado</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {hasGoogle ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnlinkProvider('google')}
                      className="gap-2"
                      data-testid="button-unlink-google"
                    >
                      <Unlink className="w-4 h-4" />
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleLinkProvider('google')}
                      className="gap-2 shadow-md"
                      data-testid="button-link-google"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Vincular
                    </Button>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex items-center justify-between p-5 border-2 rounded-xl hover:border-primary/50 transition-colors bg-gradient-to-r from-card to-card/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      hasFacebook ? 'bg-gradient-to-br from-blue-500/20 to-blue-700/20' : 'bg-muted'
                    }`}>
                      <SiFacebook className={`w-6 h-6 ${hasFacebook ? 'text-blue-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Facebook</p>
                      <div className="flex items-center gap-2 mt-1">
                        {hasFacebook ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-green-500 font-medium">Conectado</p>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Próximamente</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {hasFacebook ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnlinkProvider('facebook')}
                      className="gap-2"
                      data-testid="button-unlink-facebook"
                    >
                      <Unlink className="w-4 h-4" />
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkProvider('facebook')}
                      className="gap-2"
                      data-testid="button-link-facebook"
                      disabled
                    >
                      <LinkIcon className="w-4 h-4" />
                      Próximamente
                    </Button>
                  )}
                </div>

                {/* Twitter/X */}
                <div className="flex items-center justify-between p-5 border-2 rounded-xl hover:border-primary/50 transition-colors bg-gradient-to-r from-card to-card/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      hasTwitter ? 'bg-gradient-to-br from-black/20 to-black/40 dark:from-white/20 dark:to-white/40' : 'bg-muted'
                    }`}>
                      <SiX className={`w-6 h-6 ${hasTwitter ? 'text-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">X (Twitter)</p>
                      <div className="flex items-center gap-2 mt-1">
                        {hasTwitter ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-green-500 font-medium">Conectado</p>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No conectado</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {hasTwitter ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnlinkProvider('twitter')}
                      className="gap-2"
                      data-testid="button-unlink-twitter"
                    >
                      <Unlink className="w-4 h-4" />
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkProvider('twitter')}
                      className="gap-2 shadow-md"
                      data-testid="button-link-twitter"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Vincular
                    </Button>
                  )}
                </div>

                {!hasPassword && (hasGoogle || hasFacebook || hasTwitter) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                    <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Importante:</strong> Agrega una contraseña antes de desvincular tus redes sociales para no perder acceso a tu cuenta.
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Avatar Dialog - Enhanced */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cambiar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Ingresa la URL de tu nueva foto de perfil
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={avatarForm.handleSubmit((data) => updateAvatarMutation.mutate(data))}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profileImageUrl" className="text-base font-medium">URL de la imagen</Label>
                <Input
                  id="profileImageUrl"
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                  {...avatarForm.register("profileImageUrl")}
                  data-testid="input-avatar-url"
                />
                {avatarForm.formState.errors.profileImageUrl && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {avatarForm.formState.errors.profileImageUrl.message}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Puedes usar servicios como <a href="https://dicebear.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DiceBear</a> para generar avatares únicos
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowAvatarDialog(false)}>
                Cancelar
              </Button>
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
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unlink Provider Confirmation Dialog */}
      <AlertDialog open={!!unlinkProvider} onOpenChange={() => setUnlinkProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">¿Desvincular cuenta?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Estás a punto de desvincular tu cuenta de {unlinkProvider === 'google' ? 'Google' : unlinkProvider === 'twitter' ? 'X (Twitter)' : 'Facebook'}. 
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
