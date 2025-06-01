import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ParentLookup from "@/pages/parent-lookup";
import ParentRegistry from "@/pages/parent-registry";
import ChildProfiles from "@/pages/child-profiles";
import DaycareCenters from "@/pages/daycare-centers";
import PaymentTracking from "@/pages/payment-tracking";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // ⏳ Don't render until auth is ready

  return (
    <Switch>
      <Route path="/login" component={Login} /> {/* ✅ Always available */}

      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} /> {/* Optional fallback */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/parent-lookup" component={ParentLookup} />
          <Route path="/parent-registry" component={ParentRegistry} />
          <Route path="/child-profiles" component={ChildProfiles} />
          <Route path="/daycare-centers" component={DaycareCenters} />
          <Route path="/payment-tracking" component={PaymentTracking} />
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
