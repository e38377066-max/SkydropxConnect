import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, CreditCard, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual requerida"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ContactData = z.infer<typeof contactSchema>;
type BillingData = z.infer<typeof billingSchema>;
type SecurityData = z.infer<typeof securitySchema>;

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("contact");

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

  const securityForm = useForm<SecurityData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
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
    }
  }, [user]);

  // Update contact information mutation
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

  // Update billing information mutation
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

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: SecurityData) => {
      const response = await apiRequest("PATCH", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await response.json();
    },
    onSuccess: () => {
      securityForm.reset();
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente",
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Mi Perfil</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="contact" data-testid="tab-contact">
              <User className="w-4 h-4 mr-2" />
              Datos de Contacto
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Información de Contacto
              </h2>
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
                    <Label htmlFor="lastName">Apellido (opcional)</Label>
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
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
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
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Datos de Facturación
              </h2>
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
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Cambiar Contraseña
              </h2>
              {user?.password ? (
                <form
                  onSubmit={securityForm.handleSubmit((data) =>
                    updatePasswordMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...securityForm.register("currentPassword")}
                      data-testid="input-current-password"
                    />
                    {securityForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {securityForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...securityForm.register("newPassword")}
                      data-testid="input-new-password"
                    />
                    {securityForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {securityForm.formState.errors.newPassword.message}
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
                      {...securityForm.register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                    {securityForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {securityForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                    data-testid="button-change-password"
                  >
                    {updatePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      "Cambiar Contraseña"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Tu cuenta usa autenticación con Google.
                    <br />
                    No es necesario establecer una contraseña.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
