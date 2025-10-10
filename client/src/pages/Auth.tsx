import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Package, Loader2 } from "lucide-react";
import { SiGoogle, SiX } from "react-icons/si";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
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

  const handleTwitterLogin = () => {
    window.location.href = "/api/login-twitter";
  };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

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
              <Label htmlFor="register-password">Contraseña</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...registerForm.register("password")}
                data-testid="input-register-password"
              />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {registerForm.formState.errors.password.message}
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

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            data-testid="button-google-login"
          >
            <SiGoogle className="w-4 h-4 mr-2" />
            Google
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleTwitterLogin}
            data-testid="button-twitter-login"
          >
            <SiX className="w-4 h-4 mr-2" />
            X
          </Button>
        </div>
      </Card>
    </div>
  );
}
