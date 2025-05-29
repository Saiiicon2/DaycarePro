import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Info, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface RecentAlertsProps {
  alerts?: any[];
  isLoading: boolean;
}

export default function RecentAlerts({ alerts, isLoading }: RecentAlertsProps) {
  const getAlertIcon = (alertType: string, severity: string) => {
    if (severity === 'high') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (severity === 'medium') {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertBgColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'enrollment_attempt':
        return 'Enrollment Attempt';
      case 'overdue_payment':
        return 'Overdue Payment';
      case 'tier_change':
        return 'Tier Change';
      default:
        return 'Alert';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Alerts</CardTitle>
          <CardDescription>Parents requiring attention across the ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-48"></div>
                    <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Payment Alerts</CardTitle>
            <CardDescription>Parents requiring attention across the ecosystem</CardDescription>
          </div>
          <Link href="/alerts">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start space-x-4 p-4 border rounded-lg ${getAlertBgColor(alert.severity)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.alertType, alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {alert.parent.firstName} {alert.parent.lastName}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityBadgeColor(alert.severity)}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)} Risk
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-gray-400">
                        {format(new Date(alert.createdAt), 'PP')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-gray-300 mb-2">
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{getAlertTypeLabel(alert.alertType)}</span>
                    </span>
                    <span>at {alert.daycare.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-gray-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent alerts</p>
            <p className="text-sm mt-1">All payment activities are normal</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
