import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import RegisterInstitution from "@/pages/RegisterInstitution";
//commit test
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ParentLookup from "@/pages/parent-lookup";
import ParentRegistry from "@/pages/parent-registry";
import ChildProfiles from "@/pages/child-profiles";
import DaycareCenters from "@/pages/daycare-centers";
import Users from "@/pages/users";
import PaymentTracking from "@/pages/payment-tracking";
import Alerts from "@/pages/alerts";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

/** tiny redirect helper for wouter */
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation(to), [to, setLocation]);
  return null;
}

/** protect routes: show component if authed, else go to /login */
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

/** prevent logged-in users from seeing /login */
function PublicOnlyRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={PublicOnlyRoute.bind(null, { component: Login } as any)} />

      {/* Protected */}
      <Route path="/dashboard" component={ProtectedRoute.bind(null, { component: Dashboard } as any)} />
      <Route path="/parent-lookup" component={ProtectedRoute.bind(null, { component: ParentLookup } as any)} />
      <Route path="/parent-registry" component={ProtectedRoute.bind(null, { component: ParentRegistry } as any)} />
      <Route path="/child-profiles" component={ProtectedRoute.bind(null, { component: ChildProfiles } as any)} />
      <Route path="/daycare-centers" component={ProtectedRoute.bind(null, { component: DaycareCenters } as any)} />
  <Route path="/users" component={ProtectedRoute.bind(null, { component: Users } as any)} />
      <Route path="/payment-tracking" component={ProtectedRoute.bind(null, { component: PaymentTracking } as any)} />
  <Route path="/alerts" component={ProtectedRoute.bind(null, { component: Alerts } as any)} />
    <Route path="/settings" component={ProtectedRoute.bind(null, { component: Settings } as any)} />
      <Route path="/register-institution" component={RegisterInstitution} />
      {/* Catch-all */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
