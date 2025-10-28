import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useRef } from "react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatCurrency";
import { Textarea } from "@/components/ui/textarea";
import { queryClient as globalQueryClient, getQueryFn as defaultGetQueryFn } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function PaymentTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const paymentsRef = useRef<HTMLDivElement | null>(null);
  const [highlightPayments, setHighlightPayments] = useState(false);

  const url = "/api/payments";
  const { data: payments, isLoading } = useQuery({
    queryKey: [url],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: daycares } = useQuery<any[]>({ queryKey: ["/api/daycares"], queryFn: getQueryFn({ on401: "throw" }) });

  // Local override when searching by parent email / ecosystem lookup
  const [overridePayments, setOverridePayments] = useState<any[] | null>(null);
  const [parentLookupResult, setParentLookupResult] = useState<any | null>(null);
  const [ecosystemSearch, setEcosystemSearch] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPayments, setModalPayments] = useState<any[] | null>(null);
  const [showDaycarePicker, setShowDaycarePicker] = useState(false);
  const [selectedDaycareForAlert, setSelectedDaycareForAlert] = useState<number | null>(null);
  const [alertMessageDraft, setAlertMessageDraft] = useState("");
  const [alertSeverityDraft, setAlertSeverityDraft] = useState<"low"|"medium"|"high">("medium");
  const [pendingAlertParentId, setPendingAlertParentId] = useState<number | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceAmountDraft, setInvoiceAmountDraft] = useState<string>("");
  const [invoiceDueDraft, setInvoiceDueDraft] = useState<string>("");
  const [pendingInvoiceParentId, setPendingInvoiceParentId] = useState<number | null>(null);
  const [invoiceDaycareId, setInvoiceDaycareId] = useState<number | null>(null);
  const [invoiceEnrollmentId, setInvoiceEnrollmentId] = useState<number | null>(null);
  const [invoiceTemplates] = useState<Array<{ id: string; label: string; amount: number; description?: string }>>([
    { id: 'monthly_fee', label: 'Monthly Fee (default)', amount: 150.0 },
    { id: 'late_fee', label: 'Late fee', amount: 25.0 },
    { id: 'deposit', label: 'Security deposit', amount: 200.0 },
  ]);
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [blacklistReasonDraft, setBlacklistReasonDraft] = useState("");
  const [pendingBlacklistParentId, setPendingBlacklistParentId] = useState<number | null>(null);

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

  const sourcePayments = (overridePayments ?? payments) || [];
  const filteredPayments = (sourcePayments as any[]).filter((payment: any) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (payment.parent?.firstName || "").toLowerCase().includes(query) ||
        (payment.parent?.lastName || "").toLowerCase().includes(query) ||
        (payment.parent?.email || "").toLowerCase().includes(query) ||
        (payment.enrollment?.child?.firstName || "").toLowerCase().includes(query) ||
        (payment.enrollment?.child?.lastName || "").toLowerCase().includes(query) ||
        (payment.enrollment?.daycare?.name || "").toLowerCase().includes(query)
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

    // include daycareId so the server's requireMembership middleware can scope the request
    if (payment?.enrollment?.daycare?.id) updateData.daycareId = Number(payment.enrollment.daycare.id);

    if (newStatus === 'paid') {
      // send paidDate as a numeric timestamp (ms since epoch) to match server expectations
      updateData.paidDate = Date.now();
    }

    updatePaymentMutation.mutate({
      id: payment.id,
      data: updateData,
    });
  };

  // Search helpers
  async function lookupParentByEmail(email: string) {
    try {
      const res = await apiRequest("POST", "/api/parents/lookup", { email });
      const json = await res.json();
      // json: { parent, paymentHistory, recommendation }
      setParentLookupResult(json);
      setOverridePayments(json.paymentHistory || []);
    } catch (err) {
      console.warn("Parent lookup failed", err);
      setParentLookupResult(null);
      setOverridePayments([]);
      toast({ title: "Not found", description: "Parent not found in ecosystem", variant: "destructive" });
    }
  }

  async function runSearch() {
    // If the query looks like an email, try ecosystem parent lookup which returns global payment history
    if (searchQuery.includes("@")) {
      await lookupParentByEmail(searchQuery.trim());
      return;
    }

    // If admin toggled ecosystemSearch, re-fetch payments without daycare scoping by invalidating queries
    if (ecosystemSearch) {
      // invalidate and refetch (admin routes return global data)
      queryClient.invalidateQueries({ queryKey: [url] });
      setOverridePayments(null);
      setParentLookupResult(null);
      return;
    }

    // otherwise clear overrides and rely on fetched payments + client-side filtering
    setOverridePayments(null);
    setParentLookupResult(null);
  }

  function exportCSV(rows: any[]) {
    if (!rows || !rows.length) {
      toast({ title: "No data", description: "No payments to export", variant: "destructive" });
      return;
    }
    const headers = ["paymentId", "parentEmail", "parentName", "childName", "daycare", "amount", "dueDate", "paidDate", "status"];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      // Ensure amount in CSV is a plain numeric value (no currency symbol or separators)
      const numericAmount = r.amount != null && r.amount !== "" ? Number(r.amount) : "";
      const line = [
        r.id,
        `"${r.parent?.email ?? ""}"`,
        `"${(r.parent?.firstName ?? "") + " " + (r.parent?.lastName ?? "")}"`,
        `"${r.enrollment?.child?.firstName ?? ""} ${(r.enrollment?.child?.lastName ?? "")}"`,
        `"${r.enrollment?.daycare?.name ?? ""}"`,
        numericAmount === "" ? "" : Number(numericAmount).toFixed(2),
        r.dueDate ? new Date(r.dueDate).toISOString() : "",
        r.paidDate ? new Date(r.paidDate).toISOString() : "",
        r.status,
      ];
      csvRows.push(line.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

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
              <Button variant="outline" onClick={() => exportCSV(filteredPayments || [])}>
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
                
                <Button variant="outline" onClick={runSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>

                <Button variant="ghost" onClick={() => setEcosystemSearch(s => !s)}>
                  {user?.role === "admin" || user?.role === "system_admin" ? (
                    <span className="text-sm">{ecosystemSearch ? "Ecosystem: ON" : "Ecosystem: OFF"}</span>
                  ) : null}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Parent recommendation (shown when parent lookup returns) */}
          {parentLookupResult && (
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-gray-400">Parent Lookup Result</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {parentLookupResult.parent.firstName} {parentLookupResult.parent.lastName}
                    <span className="ml-2 text-sm text-slate-500">{parentLookupResult.parent.email}</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Total owed: <strong>R{Number(parentLookupResult.parent.totalOwed || 0).toFixed(2)}</strong></p>
                  <p className="text-sm text-slate-500">Payment history entries: <strong>{(parentLookupResult.paymentHistory || []).length}</strong></p>
                </div>

                <div className="text-right">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      parentLookupResult.recommendation === 'REJECT' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      parentLookupResult.recommendation === 'CAUTION' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {parentLookupResult.recommendation}
                    </span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Recommendation rules: APPROVE = low overdue ratio & low total owed; CAUTION = moderate overdue ratio (20-50%) or some unpaid balance; REJECT = high overdue ratio (&gt;50%) or large outstanding balance. Admins can view full payment history for details.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-col gap-2 justify-end">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setParentLookupResult(null); setOverridePayments(null); setSearchQuery(''); }}>
                        Clear
                      </Button>
                      <Button onClick={() => {
                        // open modal and also scroll/highlight
                        setModalPayments(parentLookupResult.paymentHistory || []);
                        setModalOpen(true);
                        if (paymentsRef?.current) {
                          paymentsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setHighlightPayments(true);
                          setTimeout(() => setHighlightPayments(false), 2000);
                        }
                      }}>
                        View Payments
                      </Button>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="destructive" onClick={() => {
                        setPendingBlacklistParentId(parentLookupResult.parent.id);
                        setBlacklistReasonDraft("");
                        setShowBlacklistDialog(true);
                      }}>
                        Blacklist
                      </Button>

                      <Button onClick={() => {
                        setPendingInvoiceParentId(parentLookupResult.parent.id);
                        setInvoiceAmountDraft("");
                        setInvoiceDueDraft("");
                        // default daycare to parent's daycare or first available
                        const defaultDaycare = parentLookupResult.parent.daycareId ?? (parentLookupResult.paymentHistory?.[0]?.enrollment?.daycare?.id) ?? (daycares && daycares[0]?.id);
                        setInvoiceDaycareId(defaultDaycare ?? null);
                        // try to default enrollment from payment history
                        const defaultEnrollment = parentLookupResult.paymentHistory?.[0]?.enrollment?.id ?? null;
                        setInvoiceEnrollmentId(defaultEnrollment);
                        setShowInvoiceDialog(true);
                      }}>
                        Send Invoice
                      </Button>

                      <Button onClick={() => {
                        // open a dialog to pick daycare and compose alert
                        const defaultDaycare = parentLookupResult.parent.daycareId ?? (parentLookupResult.paymentHistory?.[0]?.enrollment?.daycare?.id ?? (daycares && daycares[0]?.id));
                        setSelectedDaycareForAlert(defaultDaycare ?? null);
                        setAlertMessageDraft("");
                        setAlertSeverityDraft("medium");
                        setPendingAlertParentId(parentLookupResult.parent.id);
                        setShowDaycarePicker(true);
                      }}>
                        Create Alert
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments Table */}
          <Card ref={paymentsRef} className={highlightPayments ? 'ring-2 ring-yellow-300' : ''}>
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
                              {formatCurrency(payment.amount)}
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

              {/* Modal for parent payments */}
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Parent Payment History</DialogTitle>
                    <DialogDescription>
                      Showing {modalPayments?.length ?? 0} records
                    </DialogDescription>
                  </DialogHeader>

                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th className="p-2">Date</th>
                          <th className="p-2">Child</th>
                          <th className="p-2">Daycare</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(modalPayments || []).map((p: any) => (
                          <tr key={p.id} className="border-t">
                            <td className="p-2">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : ''}</td>
                            <td className="p-2">{p.enrollment?.child?.firstName} {p.enrollment?.child?.lastName}</td>
                            <td className="p-2">{p.enrollment?.daycare?.name}</td>
                            <td className="p-2">{p.amount}</td>
                            <td className="p-2">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => setModalOpen(false)}>Close</Button>
                    <Button onClick={() => { exportCSV(modalPayments || []); }}>Export CSV</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Daycare picker + alert composer dialog */}
              <Dialog open={showDaycarePicker} onOpenChange={setShowDaycarePicker}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Alert</DialogTitle>
                    <DialogDescription>Choose a daycare and write the alert message for the selected parent.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Daycare</label>
                      <select value={selectedDaycareForAlert ?? ""} onChange={(e) => setSelectedDaycareForAlert(Number(e.target.value))} className="w-full border rounded px-2 py-1">
                        <option value="">-- choose daycare --</option>
                        {(daycares || []).map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Message</label>
                      <Textarea value={alertMessageDraft} onChange={(e) => setAlertMessageDraft((e.target as HTMLTextAreaElement).value)} className="w-full" />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Severity</label>
                      <select value={alertSeverityDraft} onChange={(e) => setAlertSeverityDraft(e.target.value as any)} className="w-full border rounded px-2 py-1">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDaycarePicker(false)}>Cancel</Button>
                    <Button onClick={async () => {
                      if (!pendingAlertParentId) return toast({ title: 'Error', description: 'No parent selected', variant: 'destructive' });
                      if (!selectedDaycareForAlert) return toast({ title: 'Error', description: 'Please select a daycare', variant: 'destructive' });
                      if (!alertMessageDraft.trim()) return toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
                      try {
                        await apiRequest('POST', '/api/alerts', { parentId: pendingAlertParentId, daycareId: selectedDaycareForAlert, alertType: 'manual', message: alertMessageDraft.trim(), severity: alertSeverityDraft });
                        toast({ title: 'Alert created', description: 'An alert has been created' });
                        setShowDaycarePicker(false);
                        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
                      } catch (err) {
                        console.error(err);
                        toast({ title: 'Error', description: 'Failed to create alert', variant: 'destructive' });
                      }
                    }}>Create Alert</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Invoice dialog */}
              <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Invoice</DialogTitle>
                    <DialogDescription>Enter amount and due date for the invoice.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Daycare (optional)</label>
                      <select value={invoiceDaycareId ?? ""} onChange={(e) => setInvoiceDaycareId(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded px-2 py-1">
                        <option value="">-- use default daycare --</option>
                        {(daycares || []).map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {parentLookupResult?.paymentHistory && parentLookupResult.paymentHistory.length > 0 && (
                      <div>
                        <label className="block text-sm mb-1">Enrollment (optional)</label>
                        <select value={invoiceEnrollmentId ?? ""} onChange={(e) => setInvoiceEnrollmentId(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded px-2 py-1">
                          <option value="">-- choose enrollment or leave blank --</option>
                          {Array.from(new Map(parentLookupResult.paymentHistory.map((ph: any) => [ph.enrollment.id, ph.enrollment])).values()).map((en: any) => (
                            <option key={en.id} value={en.id}>{en.child.firstName} {en.child.lastName} — {en.daycare?.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm mb-1">Quick templates</label>
                      <div className="flex gap-2">
                        {invoiceTemplates.map(t => (
                          <Button key={t.id} variant="ghost" onClick={() => { setInvoiceAmountDraft(String(t.amount)); }}>
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Amount</label>
                      <Input value={invoiceAmountDraft} onChange={(e) => setInvoiceAmountDraft((e.target as HTMLInputElement).value)} placeholder="e.g. 150.00" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Due Date</label>
                      <Input type="date" value={invoiceDueDraft} onChange={(e) => setInvoiceDueDraft((e.target as HTMLInputElement).value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
                    <Button onClick={async () => {
                      if (!pendingInvoiceParentId) return toast({ title: 'Error', description: 'No parent selected', variant: 'destructive' });
                      const amt = Number(invoiceAmountDraft);
                      if (!amt || Number.isNaN(amt)) return toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
                      const dueDate = invoiceDueDraft ? new Date(invoiceDueDraft).toISOString() : new Date().toISOString();
                      try {
                        const body: any = { parentId: pendingInvoiceParentId, amount: amt, dueDate, status: 'pending' };
                        if (invoiceEnrollmentId) body.enrollmentId = invoiceEnrollmentId;
                        if (invoiceDaycareId) body.daycareId = invoiceDaycareId;
                        await apiRequest('POST', '/api/payments', body);
                        toast({ title: 'Invoice created', description: 'Payment record created' });
                        setShowInvoiceDialog(false);
                        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
                      } catch (err) {
                        console.error(err);
                        toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
                      }
                    }}>Create Invoice</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Blacklist dialog */}
              <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Blacklist Parent</DialogTitle>
                    <DialogDescription>Confirm blacklisting and optionally include a reason.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Reason (optional)</label>
                      <Textarea value={blacklistReasonDraft} onChange={(e) => setBlacklistReasonDraft((e.target as HTMLTextAreaElement).value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBlacklistDialog(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={async () => {
                      if (!pendingBlacklistParentId) return toast({ title: 'Error', description: 'No parent selected', variant: 'destructive' });
                      try {
                        await apiRequest('POST', `/api/parents/${pendingBlacklistParentId}/blacklist`, { isBlacklisted: true });
                        if (blacklistReasonDraft.trim()) {
                          const daycareId = (parentLookupResult?.parent?.daycareId) ?? (parentLookupResult?.paymentHistory?.[0]?.enrollment?.daycare?.id) ?? (daycares && daycares[0]?.id);
                          if (daycareId) {
                            await apiRequest('POST', '/api/alerts', { parentId: pendingBlacklistParentId, daycareId, alertType: 'blacklist', message: blacklistReasonDraft.trim(), severity: 'high' });
                          }
                        }
                        toast({ title: 'Blacklisted', description: 'Parent has been blacklisted' });
                        setShowBlacklistDialog(false);
                        queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
                      } catch (err) {
                        console.error(err);
                        toast({ title: 'Error', description: 'Failed to blacklist', variant: 'destructive' });
                      }
                    }}>Confirm Blacklist</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
