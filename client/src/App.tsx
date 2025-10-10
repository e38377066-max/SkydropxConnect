import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import HomePage from "@/pages/HomePage";
import QuotePage from "@/pages/QuotePage";
import CreateShipmentPage from "@/pages/CreateShipmentPage";
import TrackingPage from "@/pages/TrackingPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import ProfilePage from "@/pages/ProfilePage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={Auth} />
        </>
      ) : (
        <>
          <Route path="/" component={HomePage} />
          <Route path="/cotizar" component={QuotePage} />
          <Route path="/crear-guia" component={CreateShipmentPage} />
          <Route path="/rastrear" component={TrackingPage} />
          <Route path="/envios" component={ShipmentsPage} />
          <Route path="/perfil" component={ProfilePage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
