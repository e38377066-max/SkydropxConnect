import { Package, Menu, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const navItems = [
    { label: "Inicio", path: "/" },
    { label: "Cotizar", path: "/cotizar" },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-card-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-lg -ml-3"
            data-testid="link-home"
          >
            <Package className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Manuel Dev
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "secondary" : "ghost"}
                  className="font-medium"
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {isAuthenticated && user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/dashboard">
                <Button 
                  variant="default"
                  size="sm"
                  data-testid="link-dashboard"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Mi Dashboard
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin/usuarios">
                  <Button 
                    variant={location === '/admin/usuarios' ? "secondary" : "ghost"}
                    size="sm"
                    data-testid="link-admin-panel"
                  >
                    Panel Admin
                  </Button>
                </Link>
              )}
              <Link href="/perfil">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 hover-elevate active-elevate-2"
                  data-testid="button-profile"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {user.firstName || user.email?.split('@')[0] || 'Usuario'}
                  </span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-menu-toggle"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-card-border bg-card">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {user.firstName || user.email?.split('@')[0] || 'Usuario'}
                  </span>
                </div>
                <Link href="/dashboard">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-mobile-dashboard"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Mi Dashboard
                  </Button>
                </Link>
                <Link href="/perfil">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="button-mobile-profile"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin/usuarios">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-admin-panel"
                    >
                      Panel Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
