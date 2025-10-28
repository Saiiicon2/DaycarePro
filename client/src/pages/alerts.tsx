import Sidebar from "@/components/sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Info, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

function getAlertIcon(alertType: string, severity: string) {
  if (severity === 'high') return <XCircle className="h-5 w-5 text-red-600" />;
  if (severity === 'medium') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  return <Info className="h-5 w-5 text-blue-600" />;
}

function getSeverityBadgeColor(severity: string) {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
}

export default function AlertsPage() {
  const [refreshCount, setRefreshCount] = useState(0);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts', refreshCount],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const { data: memberships } = useQuery({
    queryKey: ['/api/memberships/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    staleTime: 60_000,
  });
  const membershipsArr = Array.isArray(memberships) ? memberships : [];

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PUT', `/api/alerts/${id}/resolve`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({ title: 'Alert resolved' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to resolve', description: err?.message ?? String(err), variant: 'destructive' });
    },
  });

  const items = (alerts as any[]) || [];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alerts</CardTitle>
                  <CardDescription>All payment alerts across your accessible daycares</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRefreshCount(c => c + 1)}>Refresh</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">Loading…</div>
              ) : items && items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((alert: any) => {
                    // determine permission: global admin roles or daycare membership manager/admin
                    const isGlobalAdmin = (user?.role ?? '').toLowerCase() === 'admin' || (user?.role ?? '').toLowerCase() === 'system_admin';
                    const daycareMembership = membershipsArr.find((m: any) => m.daycareId === alert.daycareId && m.isActive);
                    const isDaycareManager = daycareMembership && (daycareMembership.role === 'manager' || daycareMembership.role === 'admin');
                    const canResolve = !!(isGlobalAdmin || isDaycareManager);

                    return (
                      <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex-shrink-0 mt-0.5">
                          {getAlertIcon(alert.alertType, alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-slate-900 dark:text-white">{alert.parent?.firstName} {alert.parent?.lastName}</h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityBadgeColor(alert.severity)}>{alert.severity}</Badge>
                              <span className="text-xs text-slate-500 dark:text-gray-400">{format(new Date(alert.createdAt), 'PPP')}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-gray-300 mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {alert.alertType}</span>
                            <span>at {alert.daycare?.name}</span>
                          </div>
                        </div>
                        {canResolve && (
                          <div className="flex-shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => resolveMutation.mutate(alert.id)} disabled={resolveMutation.isPending}>
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-gray-400">No alerts</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
