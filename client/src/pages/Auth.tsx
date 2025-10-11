import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Loader2, Check, X } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-.,])[A-Za-z\d@$!%*?&_\-.,]{8,}$/;

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(passwordRegex, "Debe contener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&_-.,)"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().optional(),
  birthDay: z.string().min(1, "Selecciona el día"),
  birthMonth: z.string().min(1, "Selecciona el mes"),
  birthYear: z.string().min(1, "Selecciona el año"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [passwordValue, setPasswordValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
    },
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "¡Registro exitoso!",
        description: "Bienvenido a la plataforma",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrarse",
        description: error.message || "Por favor, intenta de nuevo",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    },
  });

  const handleGoogleLogin = () => {
    window.location.href = "/api/login-google";
  };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  // Password requirements validation
  const passwordRequirements = [
    { id: 1, text: "Mínimo 8 caracteres", test: (pw: string) => pw.length >= 8 },
    { id: 2, text: "Una letra mayúscula", test: (pw: string) => /[A-Z]/.test(pw) },
    { id: 3, text: "Una letra minúscula", test: (pw: string) => /[a-z]/.test(pw) },
    { id: 4, text: "Un número", test: (pw: string) => /\d/.test(pw) },
    { id: 5, text: "Un carácter especial (@$!%*?&_-.,)", test: (pw: string) => /[@$!%*?&_\-.,]/.test(pw) },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Package className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">Manuel Dev</span>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(true)}
            data-testid="button-switch-login"
          >
            Iniciar Sesión
          </Button>
          <Button
            variant={!isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(false)}
            data-testid="button-switch-register"
          >
            Registrarse
          </Button>
        </div>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                {...loginForm.register("email")}
                data-testid="input-login-email"
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                {...loginForm.register("password")}
                data-testid="input-login-password"
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-submit-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="register-firstName">Nombre</Label>
                <Input
                  id="register-firstName"
                  type="text"
                  placeholder="Juan"
                  {...registerForm.register("firstName")}
                  data-testid="input-register-firstname"
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive mt-1">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="register-lastName">Apellido (opcional)</Label>
                <Input
                  id="register-lastName"
                  type="text"
                  placeholder="Pérez"
                  {...registerForm.register("lastName")}
                  data-testid="input-register-lastname"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="tu@email.com"
                {...registerForm.register("email")}
                data-testid="input-register-email"
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label>Fecha de Nacimiento</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select onValueChange={(value) => registerForm.setValue("birthDay", value)}>
                  <SelectTrigger data-testid="select-birth-day">
                    <SelectValue placeholder="Día" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => registerForm.setValue("birthMonth", value)}>
                  <SelectTrigger data-testid="select-birth-month">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => registerForm.setValue("birthYear", value)}>
                  <SelectTrigger data-testid="select-birth-year">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(registerForm.formState.errors.birthDay || registerForm.formState.errors.birthMonth || registerForm.formState.errors.birthYear) && (
                <p className="text-sm text-destructive mt-1">
                  {registerForm.formState.errors.birthDay?.message || 
                   registerForm.formState.errors.birthMonth?.message || 
                   registerForm.formState.errors.birthYear?.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="register-password">Contraseña</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="Mín. 8 caracteres"
                {...registerForm.register("password", {
                  onChange: (e) => setPasswordValue(e.target.value)
                })}
                data-testid="input-register-password"
              />
              {passwordValue && (
                <div className="mt-2 space-y-1" data-testid="password-requirements">
                  {passwordRequirements.map((req) => {
                    const isMet = req.test(passwordValue);
                    return (
                      <div
                        key={req.id}
                        className={`flex items-center gap-2 text-sm ${
                          isMet ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                        }`}
                        data-testid={`requirement-${req.id}`}
                      >
                        {isMet ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span>{req.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {registerForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="register-confirmPassword">Repetir Contraseña</Label>
              <Input
                id="register-confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                {...registerForm.register("confirmPassword")}
                data-testid="input-register-confirm-password"
              />
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
              data-testid="button-submit-register"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          data-testid="button-google-login"
        >
          <SiGoogle className="w-4 h-4 mr-2" />
          Google
        </Button>
      </Card>
    </div>
  );
}
