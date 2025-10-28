import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatCurrency";
import Sidebar from "@/components/sidebar";
import KPICards from "@/components/dashboard/kpi-cards";
import RecentAlerts from "@/components/dashboard/recent-alerts";
import QuickActions from "@/components/dashboard/quick-actions";
import PaymentTierChart from "@/components/dashboard/payment-tier-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  // const { data: stats, isLoading: statsLoading } = useQuery({
  //   queryKey: ["http://localhost:5000/api/dashboard/stats"],
  // });

  // const { data: alerts, isLoading: alertsLoading } = useQuery({
  //   queryKey: ["http://localhost:5000/api/alerts?resolved=false"],
  // });

  // const { data: daycares, isLoading: daycaresLoading } = useQuery({
  //   queryKey: ["http://localhost:5000/api/daycares"],
  // });

  // const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
  //   queryKey: ["http://localhost:5000/api/payments"],
  // });

  const { data: stats, isLoading: statsLoading } = useQuery<{ totalParents: number; goodPayers: number; midPayers: number; nonPayers: number } | undefined>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<any[] | undefined>({
    queryKey: ["/api/alerts?resolved=false"],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const { data: daycares, isLoading: daycaresLoading } = useQuery<any[] | undefined>({
    queryKey: ["/api/daycares"],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery<any[] | undefined>({
    queryKey: ["/api/payments"],
    queryFn: getQueryFn({ on401: 'throw' }),
  });


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/parent-lookup?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
              <p className="text-slate-600 dark:text-gray-300">Monitor payment patterns across the ecosystem</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Quick parent search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </form>
              
              <Link href="/parent-registry">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Entry
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <KPICards stats={stats} isLoading={statsLoading} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Alerts */}
            <div className="lg:col-span-2">
              <RecentAlerts alerts={alerts} isLoading={alertsLoading} />
            </div>

            {/* Quick Actions */}
            <div>
              <QuickActions />
            </div>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payment Activity</CardTitle>
                  <CardDescription>Latest payment transactions across all daycare centers</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Filter</Button>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : recentPayments?.length > 0 ? (
                <div className="space-y-4">
                  {recentPayments.slice(0, 10).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {payment.parent.firstName.charAt(0)}{payment.parent.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {payment.parent.firstName} {payment.parent.lastName}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-gray-400">
                            {payment.enrollment.child.firstName} at {payment.enrollment.daycare.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          payment.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                  <p>No payment activity to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Tier Distribution */}
            <PaymentTierChart stats={stats} isLoading={statsLoading} />

            {/* Active Daycare Centers */}
            <Card>
              <CardHeader>
                <CardTitle>Active Daycare Centers</CardTitle>
                <CardDescription>Registered centers in the ecosystem</CardDescription>
              </CardHeader>
              <CardContent>
                {daycaresLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-slate-200 dark:border-gray-700 rounded-lg animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-32"></div>
                            <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : daycares?.length > 0 ? (
                  <div className="space-y-4">
                    {daycares.slice(0, 5).map((daycare: any) => (
                      <div key={daycare.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-primary text-sm font-bold">{daycare.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{daycare.name}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              Capacity: {daycare.capacity || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                    <p>No daycare centers registered</p>
                  </div>
                )}
                
                {daycares && daycares.length > 5 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                    <Link href="/daycare-centers">
                      <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
                        View All Centers ({daycares.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
