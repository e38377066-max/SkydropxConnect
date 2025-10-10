import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={Auth} />
          {!isLoading && isAuthenticated && (
            <>
              <Route path="/cotizar" component={QuotePage} />
              <Route path="/crear-guia" component={CreateShipmentPage} />
              <Route path="/rastrear" component={TrackingPage} />
              <Route path="/envios" component={ShipmentsPage} />
              <Route path="/perfil" component={ProfilePage} />
              <Route path="/admin/usuarios" component={AdminUsersPage} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
