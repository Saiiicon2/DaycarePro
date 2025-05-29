import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import ParentForm from "@/components/forms/parent-form";
import ChildForm from "@/components/forms/child-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Baby } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PAYMENT_TIERS } from "@/lib/constants";

export default function ParentRegistry() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showParentForm, setShowParentForm] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: parents, isLoading: parentsLoading } = useQuery({
    queryKey: ["/api/parents", searchQuery],
    queryKey: searchQuery ? ["/api/parents", { search: searchQuery }] : ["/api/parents"],
  });

  const createParentMutation = useMutation({
    mutationFn: async (parentData: any) => {
      const response = await apiRequest("POST", "/api/parents", parentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      setShowParentForm(false);
      toast({
        title: "Success",
        description: "Parent profile created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create parent profile",
        variant: "destructive",
      });
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (childData: any) => {
      const response = await apiRequest("POST", "/api/children", childData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setShowChildForm(false);
      setSelectedParent(null);
      toast({
        title: "Success",
        description: "Child profile created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create child profile",
        variant: "destructive",
      });
    },
  });

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'good_payer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'mid_payer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'non_payer':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleParentSubmit = (parentData: any) => {
    createParentMutation.mutate(parentData);
  };

  const handleChildSubmit = (childData: any) => {
    createChildMutation.mutate({
      ...childData,
      parentId: selectedParent.id,
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parent Registry</h1>
              <p className="text-slate-600 dark:text-gray-300">Manage parent and child profiles in the ecosystem</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => setLocation("/parent-lookup")}
              >
                <Search className="h-4 w-4 mr-2" />
                Parent Lookup
              </Button>
              <Button onClick={() => setShowParentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Parent
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="parents" className="space-y-6">
            <TabsList>
              <TabsTrigger value="parents" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Parents</span>
              </TabsTrigger>
              <TabsTrigger value="children" className="flex items-center space-x-2">
                <Baby className="h-4 w-4" />
                <span>Children</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parents" className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search parents by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Parents List */}
              <Card>
                <CardHeader>
                  <CardTitle>Registered Parents</CardTitle>
                  <CardDescription>
                    All parents registered in the daycare ecosystem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {parentsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-slate-200 dark:border-gray-700 rounded-lg animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-48"></div>
                              <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : parents?.length > 0 ? (
                    <div className="space-y-4">
                      {parents.map((parent: any) => (
                        <div key={parent.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {parent.firstName.charAt(0)}{parent.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {parent.firstName} {parent.lastName}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-gray-300">{parent.email}</p>
                              {parent.phone && (
                                <p className="text-sm text-slate-600 dark:text-gray-300">{parent.phone}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <Badge className={getTierBadgeColor(parent.paymentTier)}>
                                {PAYMENT_TIERS[parent.paymentTier as keyof typeof PAYMENT_TIERS]?.label}
                              </Badge>
                              {parseFloat(parent.totalOwed) > 0 && (
                                <p className="text-sm text-red-600 mt-1">
                                  Owes: ${parent.totalOwed}
                                </p>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedParent(parent);
                                setShowChildForm(true);
                              }}
                            >
                              Add Child
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No parents registered yet</p>
                      <Button className="mt-4" onClick={() => setShowParentForm(true)}>
                        Register First Parent
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="children">
              <Card>
                <CardHeader>
                  <CardTitle>Child Profiles</CardTitle>
                  <CardDescription>
                    Manage child profiles and enrollment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                    <Baby className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Child management coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Forms */}
      {showParentForm && (
        <ParentForm
          onSubmit={handleParentSubmit}
          onCancel={() => setShowParentForm(false)}
          isLoading={createParentMutation.isPending}
        />
      )}

      {showChildForm && selectedParent && (
        <ChildForm
          parent={selectedParent}
          onSubmit={handleChildSubmit}
          onCancel={() => {
            setShowChildForm(false);
            setSelectedParent(null);
          }}
          isLoading={createChildMutation.isPending}
        />
      )}
    </div>
  );
}
