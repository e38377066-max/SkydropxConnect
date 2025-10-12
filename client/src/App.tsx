import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import HomePage from "@/pages/HomePage";
import QuotePage from "@/pages/QuotePage";
import CreateShipmentPage from "@/pages/CreateShipmentPage";
import TrackingPage from "@/pages/TrackingPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import DashboardPage from "@/pages/DashboardPage";
import WalletPage from "@/pages/WalletPage";
import AddressesPage from "@/pages/AddressesPage";
import PackagesPage from "@/pages/PackagesPage";
import BillingProfilesPage from "@/pages/BillingProfilesPage";
import AdminRechargesPage from "@/pages/AdminRechargesPage";
import { Redirect } from "wouter";

// Public routes (no sidebar)
function PublicRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={Auth} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

// Protected routes (with sidebar)
function ProtectedRoutes() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/cotizar" component={QuotePage} />
      <Route path="/crear-guia" component={CreateShipmentPage} />
      <Route path="/rastrear" component={TrackingPage} />
      <Route path="/envios" component={ShipmentsPage} />
      <Route path="/perfil" component={ProfilePage} />
      <Route path="/billetera" component={WalletPage} />
      <Route path="/configuracion/direcciones" component={AddressesPage} />
      <Route path="/configuracion/paquetes" component={PackagesPage} />
      <Route path="/admin/usuarios" component={AdminUsersPage} />
      <Route path="/admin/recargas" component={AdminRechargesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show public routes if not authenticated
  if (!isAuthenticated || isLoading) {
    return <PublicRoutes />;
  }

  // Show dashboard with sidebar for authenticated users
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex items-center gap-4">
            {/* Additional header content can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <ProtectedRoutes />
        </main>
      </div>
    </div>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <Toaster />
          <Router />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
