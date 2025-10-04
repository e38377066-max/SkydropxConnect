import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import QuotePage from "@/pages/QuotePage";
import CreateShipmentPage from "@/pages/CreateShipmentPage";
import TrackingPage from "@/pages/TrackingPage";
import ShipmentsPage from "@/pages/ShipmentsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/cotizar" component={QuotePage} />
      <Route path="/crear-guia" component={CreateShipmentPage} />
      <Route path="/rastrear" component={TrackingPage} />
      <Route path="/envios" component={ShipmentsPage} />
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
