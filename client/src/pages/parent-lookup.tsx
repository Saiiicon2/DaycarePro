import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Shield, CheckCircle, AlertTriangle, XCircle, Calendar, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PAYMENT_TIERS } from "@/lib/constants";
import { format } from "date-fns";

interface LookupResult {
  parent: any;
  paymentHistory: any[];
  recommendation: 'APPROVE' | 'CAUTION' | 'REJECT';
}

export default function ParentLookup() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  const lookupMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/parents/lookup", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setLookupResult(data);
      setSearchInitiated(true);
    },
    onError: (error: any) => {
      console.error("Lookup failed:", error);
      setLookupResult(null);
      setSearchInitiated(true);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      lookupMutation.mutate(email.trim());
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'good_payer':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'mid_payer':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'non_payer':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'APPROVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CAUTION':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'REJECT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parent Lookup</h1>
              <p className="text-slate-600 dark:text-gray-300">Search payment history across the daycare ecosystem</p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation("/parent-registry")}
            >
              Register New Parent
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search Parent Records</span>
              </CardTitle>
              <CardDescription>
                Enter a parent's email address to check their payment history across all daycare centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter parent's email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={lookupMutation.isPending}
                  className="min-w-[120px]"
                >
                  {lookupMutation.isPending ? "Searching..." : "Search"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {searchInitiated && (
            <>
              {lookupMutation.isError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Parent not found in the ecosystem. This could be a new parent or the email address might be incorrect.
                  </AlertDescription>
                </Alert>
              )}

              {lookupResult && (
                <div className="space-y-6">
                  {/* Parent Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Parent Profile</span>
                        <Badge className={getRecommendationColor(lookupResult.recommendation)}>
                          {lookupResult.recommendation}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {lookupResult.parent.firstName} {lookupResult.parent.lastName}
                            </h3>
                            <p className="text-slate-600 dark:text-gray-300">{lookupResult.parent.email}</p>
                            {lookupResult.parent.phone && (
                              <p className="text-slate-600 dark:text-gray-300">{lookupResult.parent.phone}</p>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Payment Tier</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {getTierIcon(lookupResult.parent.paymentTier)}
                              <span className="font-medium">
                                {PAYMENT_TIERS[lookupResult.parent.paymentTier as keyof typeof PAYMENT_TIERS]?.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Total Outstanding</p>
                            <p className="text-2xl font-bold text-red-600">${lookupResult.parent.totalOwed}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Registration Date</p>
                            <p className="text-slate-600 dark:text-gray-300">
                              {format(new Date(lookupResult.parent.createdAt), 'PPP')}
                            </p>
                          </div>
                          
                          {lookupResult.parent.isBlacklisted && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                This parent is currently blacklisted due to payment issues.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span>Payment History</span>
                      </CardTitle>
                      <CardDescription>
                        Complete payment record across all daycare centers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {lookupResult.paymentHistory.length > 0 ? (
                        <div className="space-y-4">
                          {lookupResult.paymentHistory.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-gray-700 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                      {payment.enrollment.daycare.name}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-gray-300">
                                      {payment.enrollment.child.firstName} {payment.enrollment.child.lastName}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500 dark:text-gray-400">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Due: {format(new Date(payment.dueDate), 'PP')}</span>
                                  </span>
                                  {payment.paidDate && (
                                    <span>Paid: {format(new Date(payment.paidDate), 'PP')}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-bold text-slate-900 dark:text-white">${payment.amount}</p>
                                <Badge className={
                                  payment.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  payment.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                }>
                                  {payment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                          <p>No payment history available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recommendation */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Enrollment Recommendation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`p-4 rounded-lg ${getRecommendationColor(lookupResult.recommendation)}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {lookupResult.recommendation === 'APPROVE' && <CheckCircle className="h-5 w-5" />}
                          {lookupResult.recommendation === 'CAUTION' && <AlertTriangle className="h-5 w-5" />}
                          {lookupResult.recommendation === 'REJECT' && <XCircle className="h-5 w-5" />}
                          <span className="font-bold">{lookupResult.recommendation}</span>
                        </div>
                        <p className="text-sm">
                          {lookupResult.recommendation === 'APPROVE' && 
                            "This parent has a good payment history and is recommended for enrollment."}
                          {lookupResult.recommendation === 'CAUTION' && 
                            "This parent has some payment issues. Consider requiring a deposit or payment plan."}
                          {lookupResult.recommendation === 'REJECT' && 
                            "This parent has significant payment issues. Enrollment is not recommended until outstanding balances are resolved."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
