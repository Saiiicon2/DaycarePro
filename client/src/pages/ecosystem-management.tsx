import Sidebar from "@/components/sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Info, AlertCircle, TrendingUp, Users, Shield, Toggle2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function getAlertTypeBadge(alertType: string) {
  switch (alertType) {
    case 'simultaneous_enrollment': return <Badge className="bg-purple-100 text-purple-800">Dual Enrollment</Badge>;
    case 'suspicious_transfer': return <Badge className="bg-orange-100 text-orange-800">Suspicious Transfer</Badge>;
    case 'enrollment_attempt': return <Badge className="bg-red-100 text-red-800">Enrollment Blocked</Badge>;
    default: return <Badge>{alertType}</Badge>;
  }
}

export default function EcosystemManagementPage() {
  const [activeEcosystemId, setActiveEcosystemId] = useState<number | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch list of ecosystems
  const { data: ecosystems, isLoading: ecosystemsLoading } = useQuery({
    queryKey: ['/api/ecosystems'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch suspicious activity for selected ecosystem
  const { data: suspiciousActivity } = useQuery({
    queryKey: ['/api/ecosystems', activeEcosystemId, 'suspicious-activity', refreshCount],
    queryFn: activeEcosystemId ? getQueryFn({ on401: 'returnNull' }) : () => Promise.resolve(null),
    enabled: !!activeEcosystemId,
  });

  // Fetch all alerts for selected ecosystem
  const { data: allAlerts } = useQuery({
    queryKey: ['/api/ecosystems', activeEcosystemId, 'alerts', refreshCount],
    queryFn: activeEcosystemId ? getQueryFn({ on401: 'returnNull' }) : () => Promise.resolve(null),
    enabled: !!activeEcosystemId,
  });

  const ecosystemsArr = Array.isArray(ecosystems) ? ecosystems : [];
  const suspiciousArr = suspiciousActivity as any;
  const alertsArr = Array.isArray(allAlerts) ? allAlerts : [];

  // Determine which ecosystem to display
  const selectedEcosystem = activeEcosystemId 
    ? ecosystemsArr.find(e => e.id === activeEcosystemId) 
    : ecosystemsArr[0];

  if (!selectedEcosystem && activeEcosystemId === null && ecosystemsArr.length > 0) {
    setActiveEcosystemId(ecosystemsArr[0].id);
  }

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PUT', `/api/alerts/${id}/resolve`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/ecosystems'] });
      setRefreshCount(c => c + 1);
      toast({ title: 'Alert resolved' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to resolve', description: err?.message ?? String(err), variant: 'destructive' });
    },
  });

  const enforcementMutation = useMutation({
    mutationFn: async (enforceAlerts: boolean) => {
      const res = await apiRequest('PUT', `/api/ecosystems/${activeEcosystemId}/enforcement`, { enforceAlerts });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['/api/ecosystems'] });
      setRefreshCount(c => c + 1);
      toast({ 
        title: 'Enforcement mode updated', 
        description: `Switched to ${data.mode}`,
        variant: 'default'
      });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update', description: err?.message ?? String(err), variant: 'destructive' });
    },
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                Ecosystem Safety & Monitoring
              </h1>
              <p className="text-slate-600 dark:text-gray-400 mt-1">
                Cross-daycare fraud detection and family payment pattern analysis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={showSettings ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
              >
                ⚙️ Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRefreshCount(c => c + 1)}>
                Refresh
              </Button>
            </div>
          </div>
          </div>

          {/* Settings Panel */}
          {showSettings && selectedEcosystem && (
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Toggle2 className="h-5 w-5" />
                  Enforcement Settings: {selectedEcosystem.name}
                </CardTitle>
                <CardDescription>
                  Choose how this ecosystem handles suspicious activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Monitor Mode */}
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    !selectedEcosystem.enforceAlerts 
                      ? 'border-blue-500 bg-white dark:bg-gray-800' 
                      : 'border-gray-300 dark:border-gray-600 opacity-60'
                  }`}
                    onClick={() => !enforcementMutation.isPending && enforcementMutation.mutate(false)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Monitor Mode
                      </h3>
                      {!selectedEcosystem.enforceAlerts && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-gray-400 space-y-2">
                      <li>✓ Detects all suspicious activity</li>
                      <li>✓ Creates detailed alerts</li>
                      <li>✓ Sends notifications to staff</li>
                      <li>✗ Does NOT block enrollments</li>
                      <li className="text-xs pt-2 text-amber-600 dark:text-amber-400 font-medium">
                        Best for: Learning patterns, testing
                      </li>
                    </ul>
                  </div>

                  {/* Enforce Mode */}
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEcosystem.enforceAlerts 
                      ? 'border-red-500 bg-white dark:bg-gray-800' 
                      : 'border-gray-300 dark:border-gray-600 opacity-60'
                  }`}
                    onClick={() => !enforcementMutation.isPending && enforcementMutation.mutate(true)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        Enforce Mode
                      </h3>
                      {selectedEcosystem.enforceAlerts && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-gray-400 space-y-2">
                      <li>✓ Detects all suspicious activity</li>
                      <li>✓ Creates detailed alerts</li>
                      <li>✓ BLOCKS fraudulent enrollments</li>
                      <li>✓ Prevents payment dodging</li>
                      <li className="text-xs pt-2 text-red-600 dark:text-red-400 font-medium">
                        Best for: Full protection, enforcement
                      </li>
                    </ul>
                  </div>
                </div>

                {selectedEcosystem.enforceAlerts && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-800 dark:text-red-100">
                    <strong>⚠️ Active:</strong> Enrollments with duplicate/suspicious activity will be REJECTED. Staff will see clear error messages.
                  </div>
                )}

                {enforcementMutation.isPending && (
                  <div className="text-center py-2 text-sm text-slate-600 dark:text-gray-400">
                    Updating enforcement mode...
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ecosystem Selector */}
          {ecosystemsArr.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Ecosystem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ecosystemsArr.map((ecosystem: any) => (
                    <Button
                      key={ecosystem.id}
                      variant={activeEcosystemId === ecosystem.id ? "default" : "outline"}
                      onClick={() => setActiveEcosystemId(ecosystem.id)}
                      className="flex items-center gap-2"
                    >
                      {ecosystem.name}
                      <Badge variant={ecosystem.enforceAlerts ? "destructive" : "secondary"} className="ml-2">
                        {ecosystem.enforceAlerts ? "🛑 ENFORCE" : "👀 MONITOR"}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedEcosystem && (
            <>
              {/* Summary Cards */}
              {suspiciousArr && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">Unresolved Alerts</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {suspiciousArr.totalUnresolvedAlerts}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">Dual Enrollments</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {suspiciousArr.simultaneousEnrollments}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">Suspicious Transfers</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {suspiciousArr.suspiciousTransfers}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-gray-400">High Severity</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {suspiciousArr.highSeverityCount}
                          </p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Alerts & Investigation</CardTitle>
                  <CardDescription>Monitor and resolve suspicious activity in {selectedEcosystem.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">
                        All ({alertsArr.length})
                      </TabsTrigger>
                      <TabsTrigger value="high">
                        High Severity ({alertsArr.filter((a: any) => a.severity === 'high').length})
                      </TabsTrigger>
                      <TabsTrigger value="transfers">
                        Transfers ({alertsArr.filter((a: any) => a.alertType === 'suspicious_transfer').length})
                      </TabsTrigger>
                      <TabsTrigger value="dual">
                        Dual Enroll ({alertsArr.filter((a: any) => a.alertType === 'simultaneous_enrollment').length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4 mt-6">
                      {alertsArr.length === 0 ? (
                        <div className="text-center py-12">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No alerts in this ecosystem</p>
                        </div>
                      ) : (
                        alertsArr.map((alert: any) => (
                          <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex-shrink-0 mt-0.5">
                              {getAlertIcon(alert.alertType, alert.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-slate-900 dark:text-white">
                                  {alert.parentName}
                                </h3>
                                <div className="flex items-center gap-2">
                                  {getAlertTypeBadge(alert.alertType)}
                                  <Badge className={getSeverityBadgeColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  <span className="text-xs text-slate-500 dark:text-gray-400">
                                    {format(new Date(alert.createdAt), 'PPP')}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                {alert.message}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-gray-500">
                                {alert.daycareName}
                              </p>
                              {!alert.isResolved && (
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveMutation.mutate(alert.id)}
                                    disabled={resolveMutation.isPending}
                                  >
                                    {resolveMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
                                  </Button>
                                </div>
                              )}
                              {alert.isResolved && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Resolved</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="high" className="space-y-4 mt-6">
                      {alertsArr.filter((a: any) => a.severity === 'high').length === 0 ? (
                        <div className="text-center py-12">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No high-severity alerts</p>
                        </div>
                      ) : (
                        alertsArr
                          .filter((a: any) => a.severity === 'high')
                          .map((alert: any) => (
                            <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-900">
                              <div className="flex-shrink-0 mt-0.5">
                                <XCircle className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-slate-900 dark:text-white">{alert.parentName}</h3>
                                  <div className="flex items-center gap-2">
                                    {getAlertTypeBadge(alert.alertType)}
                                    <span className="text-xs text-slate-500 dark:text-gray-400">
                                      {format(new Date(alert.createdAt), 'PPP')}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                  {alert.message}
                                </p>
                                {!alert.isResolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveMutation.mutate(alert.id)}
                                    disabled={resolveMutation.isPending}
                                  >
                                    {resolveMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </TabsContent>

                    <TabsContent value="transfers" className="space-y-4 mt-6">
                      {alertsArr.filter((a: any) => a.alertType === 'suspicious_transfer').length === 0 ? (
                        <div className="text-center py-12">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No suspicious transfer alerts</p>
                        </div>
                      ) : (
                        alertsArr
                          .filter((a: any) => a.alertType === 'suspicious_transfer')
                          .map((alert: any) => (
                            <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
                              <div className="flex-shrink-0 mt-0.5">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-slate-900 dark:text-white">{alert.parentName}</h3>
                                  <span className="text-xs text-slate-500 dark:text-gray-400">
                                    {format(new Date(alert.createdAt), 'PPP')}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                  {alert.message}
                                </p>
                                {!alert.isResolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveMutation.mutate(alert.id)}
                                    disabled={resolveMutation.isPending}
                                  >
                                    {resolveMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </TabsContent>

                    <TabsContent value="dual" className="space-y-4 mt-6">
                      {alertsArr.filter((a: any) => a.alertType === 'simultaneous_enrollment').length === 0 ? (
                        <div className="text-center py-12">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No dual enrollment alerts</p>
                        </div>
                      ) : (
                        alertsArr
                          .filter((a: any) => a.alertType === 'simultaneous_enrollment')
                          .map((alert: any) => (
                            <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-purple-50 dark:bg-purple-950 dark:border-purple-900">
                              <div className="flex-shrink-0 mt-0.5">
                                <AlertTriangle className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-slate-900 dark:text-white">{alert.parentName}</h3>
                                  <span className="text-xs text-slate-500 dark:text-gray-400">
                                    {format(new Date(alert.createdAt), 'PPP')}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                                  {alert.message}
                                </p>
                                {!alert.isResolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveMutation.mutate(alert.id)}
                                    disabled={resolveMutation.isPending}
                                  >
                                    {resolveMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Information Card */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">How We Protect Your Ecosystem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-blue-900 dark:text-blue-100 text-sm">
                  <div>
                    <strong>🔍 Simultaneous Enrollment Detection:</strong> Alerts when a child is enrolled at multiple daycares in your ecosystem at the same time. This helps identify splitting payments across centers.
                  </div>
                  <div>
                    <strong>🚨 Suspicious Transfer Detection:</strong> Flags parents who move their children to other daycares within 30 days of incurring overdue payments. Indicates potential payment evasion.
                  </div>
                  <div>
                    <strong>📊 Family Payment History:</strong> Tracks total amounts owed across all daycares in the ecosystem per family, not just per center.
                  </div>
                  <div>
                    <strong>🛑 Cross-Ecosystem Blacklist:</strong> Enforces payment restrictions across all daycares in your ecosystem to prevent families from evading fees.
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
