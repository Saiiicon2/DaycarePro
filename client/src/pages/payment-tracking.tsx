import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function PaymentTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  //use full url instead
  // const url = "http://localhost:5000/api/payments";
  const url = `${import.meta.env.VITE_API_URL}/api/payments`;
  const { data: payments, isLoading } = useQuery({
    queryKey: [url],
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/payments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const filteredPayments = payments?.filter((payment: any) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.parent.firstName.toLowerCase().includes(query) ||
        payment.parent.lastName.toLowerCase().includes(query) ||
        payment.parent.email.toLowerCase().includes(query) ||
        payment.enrollment.child.firstName.toLowerCase().includes(query) ||
        payment.enrollment.child.lastName.toLowerCase().includes(query) ||
        payment.enrollment.daycare.name.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleStatusUpdate = (payment: any, newStatus: string) => {
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'paid') {
      updateData.paidDate = new Date().toISOString();
    }
    
    updatePaymentMutation.mutate({
      id: payment.id,
      data: updateData
    });
  };

  const getTotalAmount = () => {
    return filteredPayments?.reduce((sum: number, payment: any) => {
      return sum + parseFloat(payment.amount);
    }, 0).toFixed(2) || "0.00";
  };

  const getOverdueAmount = () => {
    return filteredPayments?.filter((p: any) => p.status === 'overdue')
      .reduce((sum: number, payment: any) => {
        return sum + parseFloat(payment.amount);
      }, 0).toFixed(2) || "0.00";
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Tracking</h1>
              <p className="text-slate-600 dark:text-gray-300">Monitor and manage payments across all daycare centers</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Payments</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {filteredPayments?.length || 0}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      R{getTotalAmount()}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Overdue Amount</p>
                    <p className="text-2xl font-bold text-red-600">
                      R{getOverdueAmount()}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Paid This Month</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {filteredPayments?.filter((p: any) => p.status === 'paid').length || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by parent, child, or daycare..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>
                Complete payment history with status tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-gray-700 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : filteredPayments?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parent</TableHead>
                        <TableHead>Child</TableHead>
                        <TableHead>Daycare</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {payment.parent.firstName} {payment.parent.lastName}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-gray-400">
                                {payment.parent.email}
                              </p>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {payment.enrollment.child.firstName} {payment.enrollment.child.lastName}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {payment.enrollment.daycare.name}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <p className="font-bold text-slate-900 dark:text-white">
                              ${payment.amount}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">
                                {format(new Date(payment.dueDate), 'PP')}
                              </span>
                            </div>
                            {payment.paidDate && (
                              <p className="text-xs text-green-600 mt-1">
                                Paid: {format(new Date(payment.paidDate), 'PP')}
                              </p>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(payment.status)}
                              <Badge className={getStatusBadgeColor(payment.status)}>
                                {payment.status}
                              </Badge>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {payment.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(payment, 'paid')}
                                  disabled={updatePaymentMutation.isPending}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              
                              {payment.status === 'overdue' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(payment, 'paid')}
                                  disabled={updatePaymentMutation.isPending}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              
                              <Select
                                value={payment.status}
                                onValueChange={(value) => handleStatusUpdate(payment, value)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-gray-400">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No payments found</p>
                  <p className="text-sm">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search criteria" 
                      : "No payment records available"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
