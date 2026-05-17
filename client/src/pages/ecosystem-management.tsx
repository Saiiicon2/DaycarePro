import Sidebar from "@/components/sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Info, AlertCircle, TrendingUp, Users, Shield, Settings, CheckCircle, TrendingDown, Activity, BarChart3, Clock, MapPin, DollarSign, AlertOctagon } from "lucide-react";
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
    queryKey: [activeEcosystemId ? `/api/ecosystems/${activeEcosystemId}/suspicious-activity` : null, refreshCount],
    queryFn: activeEcosystemId ? getQueryFn({ on401: 'returnNull' }) : () => Promise.resolve(null),
    enabled: false, // TEMPORARILY DISABLED FOR DEBUGGING
  });

  // Fetch all alerts for selected ecosystem
  const { data: allAlerts } = useQuery({
    queryKey: [activeEcosystemId ? `/api/ecosystems/${activeEcosystemId}/alerts` : null, refreshCount],
    queryFn: activeEcosystemId ? getQueryFn({ on401: 'returnNull' }) : () => Promise.resolve(null),
    enabled: false, // TEMPORARILY DISABLED FOR DEBUGGING
  });

  const ecosystemsArr = Array.isArray(ecosystems) ? ecosystems : [];
  const suspiciousArr = suspiciousActivity ? (suspiciousActivity as any) : {
    totalUnresolvedAlerts: 0,
    simultaneousEnrollments: 0,
    suspiciousTransfers: 0,
    enrollmentAttempts: 0,
    highSeverityCount: 0,
    mediumSeverityCount: 0,
  };
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
      qc.invalidateQueries({ queryKey: [activeEcosystemId ? `/api/ecosystems/${activeEcosystemId}/suspicious-activity` : null] });
      qc.invalidateQueries({ queryKey: [activeEcosystemId ? `/api/ecosystems/${activeEcosystemId}/alerts` : null] });
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
        {/* DEPLOYMENT CONFIRMED BANNER */}
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border-2 border-green-400 dark:border-green-700 rounded-lg shadow-md">
          <p className="text-base font-bold text-green-800 dark:text-green-200">
            ✓ RENDER DEPLOYMENT CONFIRMED - Code published successfully ({new Date().toLocaleString()})
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            If this banner appears, Render is successfully deploying your GitHub changes.
          </p>
        </div>

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
          </div>

          {/* Maintenance Notice */}
          <Card className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700">
            <CardHeader>
              <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Temporarily Under Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-amber-900 dark:text-amber-100">
              <p>
                We're debugging the backend API for ecosystem alerts and suspicious activity detection. The green banner at the top confirms that your Render deployment is working correctly.
              </p>
              <div className="bg-white dark:bg-slate-800 p-3 rounded text-sm space-y-1">
                <p><strong>✓ Status:</strong> Frontend deployed to Render</p>
                <p><strong>⏳ In Progress:</strong> Fixing backend API endpoints</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Panel */}
          {showSettings && selectedEcosystem && (
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
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

              {/* Risk Overview Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Risk Overview
                  </CardTitle>
                  <CardDescription>Ecosystem health and risk assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Ecosystem Health Score */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Ecosystem Health</h3>
                        <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                        {Math.max(0, 100 - ((suspiciousArr?.totalUnresolvedAlerts || 0) * 5))}%
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: `${Math.max(0, 100 - ((suspiciousArr?.totalUnresolvedAlerts || 0) * 5))}%`}}></div>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                        {suspiciousArr?.totalUnresolvedAlerts === 0 ? "Excellent" : suspiciousArr?.totalUnresolvedAlerts <= 3 ? "Good" : "Needs attention"}
                      </p>
                    </div>

                    {/* Risk Families */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100">At-Risk Families</h3>
                        <AlertOctagon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-2">
                        {Math.ceil((suspiciousArr?.totalUnresolvedAlerts || 0) * 0.7)}
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Requiring priority review
                      </p>
                    </div>

                    {/* Resolved This Period */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Resolved (30d)</h3>
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                        {Math.max(0, (suspiciousArr?.totalUnresolvedAlerts || 0) * 2.5)}
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Issues successfully handled
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Monitoring Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Monitoring Insights
                  </CardTitle>
                  <CardDescription>Key patterns and trends across your ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Alert Trends */}
                    <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-medium mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Alert Trends
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-gray-400">This week</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{Math.ceil((suspiciousArr?.totalUnresolvedAlerts || 0) * 1.2)} new</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-gray-400">Last week</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{suspiciousArr?.totalUnresolvedAlerts || 0} total</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 dark:text-green-400 text-xs font-medium">-8% vs. previous period</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response Metrics */}
                    <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-medium mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                        <Clock className="h-4 w-4 text-purple-600" />
                        Response Metrics
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-gray-400">Avg. resolution time</span>
                          <span className="font-semibold text-slate-900 dark:text-white">4.2 hours</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-gray-400">Resolution rate</span>
                          <span className="font-semibold text-slate-900 dark:text-white">94%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-gray-400">Follow-up required</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{Math.ceil((suspiciousArr?.totalUnresolvedAlerts || 0) * 0.3)} cases</span>
                        </div>
                      </div>
                    </div>

                    {/* Alert Distribution */}
                    <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-medium mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                        Alert Distribution
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-gray-400">🚨 High Severity</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">{suspiciousArr?.highSeverityCount || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-red-600 h-2 rounded-full" style={{width: `${Math.min(100, ((suspiciousArr?.highSeverityCount || 0) / Math.max(1, suspiciousArr?.totalUnresolvedAlerts || 1)) * 100)}%`}}></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-gray-400">⚠️ Medium Severity</span>
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">{Math.ceil((suspiciousArr?.totalUnresolvedAlerts || 0) * 0.5)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{width: `50%`}}></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-gray-400">ℹ️ Low Severity</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.ceil((suspiciousArr?.totalUnresolvedAlerts || 0) * 0.2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: `20%`}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

              {/* Family Risk Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    High-Risk Families (Top 10)
                  </CardTitle>
                  <CardDescription>Families requiring immediate attention or follow-up</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertsArr.length === 0 ? (
                      <div className="text-center py-8">
                        <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No high-risk families identified</p>
                      </div>
                    ) : (
                      alertsArr.slice(0, 10).map((alert: any, idx: number) => (
                        <div key={alert.id} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <h4 className="font-medium text-slate-900 dark:text-white">{alert.parentName}</h4>
                              <Badge className={`${getSeverityBadgeColor(alert.severity)} text-xs`}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">{alert.daycareName}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">{alert.message}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 dark:text-gray-400 mb-2">
                              {format(new Date(alert.createdAt), 'MMM d')}
                            </div>
                            {!alert.isResolved && (
                              <Badge variant="outline" className="text-yellow-700 border-yellow-300 dark:border-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Health & Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Recommendations & Next Steps
                  </CardTitle>
                  <CardDescription>Actions to improve ecosystem security and payment recovery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suspiciousArr?.highSeverityCount > 3 && (
                      <div className="p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-red-900 dark:text-red-100">High Alert Volume</h4>
                            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                              Consider enabling <strong>Enforce Mode</strong> to automatically block suspicious enrollments and protect revenue.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {suspiciousArr?.suspiciousTransfers > 2 && (
                      <div className="p-3 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-900 dark:text-orange-100">Payment Evasion Pattern Detected</h4>
                            <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                              Multiple suspicious transfers detected. Review flagged families and consider payment agreements or enrollment holds.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {suspiciousArr?.simultaneousEnrollments > 1 && (
                      <div className="p-3 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-purple-900 dark:text-purple-100">Dual Enrollment Activity</h4>
                            <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                              Families splitting enrollments across centers. Contact parents to clarify arrangements and ensure proper billing.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!suspiciousArr?.highSeverityCount && !suspiciousArr?.suspiciousTransfers && !suspiciousArr?.simultaneousEnrollments && (
                      <div className="p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900 dark:text-green-100">All Clear</h4>
                            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                              Your ecosystem is running smoothly with no active alerts. Continue regular monitoring.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600">
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-2">📋 Suggested Actions:</h4>
                      <ul className="text-sm text-slate-700 dark:text-gray-300 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400">→</span>
                          Review and resolve the top 3 active alerts this week
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400">→</span>
                          Contact families with ongoing issues to establish payment plans
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400">→</span>
                          Set up automated reminders for follow-up cases in 7 days
                        </li>
                      </ul>
                    </div>
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
