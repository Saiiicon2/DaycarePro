import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DaycareForm from "@/components/forms/daycare-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Plus, MapPin, Phone, Mail, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DaycareCenters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  //use the full url instead
  const url = "http://localhost:5000/api/daycares";
  const { data: daycares, isLoading } = useQuery({
    queryKey: [url],
  });

  const createDaycareMutation = useMutation({
    mutationFn: async (daycareData: any) => {
      const response = await apiRequest("POST", "/api/daycares", daycareData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daycares"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Daycare center registered successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register daycare center",
        variant: "destructive",
      });
    },
  });

  const filteredDaycares = daycares?.filter((daycare: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      daycare.name.toLowerCase().includes(query) ||
      daycare.address?.toLowerCase().includes(query) ||
      daycare.email?.toLowerCase().includes(query)
    );
  });

  const handleSubmit = (daycareData: any) => {
    createDaycareMutation.mutate(daycareData);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Daycare Centers</h1>
              <p className="text-slate-600 dark:text-gray-300">Manage registered daycare centers in the ecosystem</p>
            </div>
            
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Register Center
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search daycare centers by name, address, or email..."
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

          {/* Centers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredDaycares?.length > 0 ? (
              filteredDaycares.map((daycare: any) => (
                <Card key={daycare.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{daycare.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant={daycare.isActive ? "default" : "secondary"}>
                            {daycare.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {daycare.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <p className="text-sm text-slate-600 dark:text-gray-300">{daycare.address}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-3">
                      {daycare.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <p className="text-sm text-slate-600 dark:text-gray-300">{daycare.phone}</p>
                        </div>
                      )}
                      
                      {daycare.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <p className="text-sm text-slate-600 dark:text-gray-300">{daycare.email}</p>
                        </div>
                      )}
                      
                      {daycare.capacity && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <p className="text-sm text-slate-600 dark:text-gray-300">
                            Capacity: {daycare.capacity} children
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {daycare.licenseNumber && (
                      <div className="pt-3 border-t border-slate-200 dark:border-gray-700">
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          License: {daycare.licenseNumber}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500 dark:text-gray-400">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No daycare centers found</p>
                <p className="text-sm">
                  {searchQuery ? "Try adjusting your search criteria" : "No daycare centers have been registered yet"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => setShowForm(true)}>
                    Register First Center
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <DaycareForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          isLoading={createDaycareMutation.isPending}
        />
      )}
    </div>
  );
}
