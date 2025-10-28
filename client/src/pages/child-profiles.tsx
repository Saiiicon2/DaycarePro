import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Baby, Calendar, MapPin, Plus } from "lucide-react";
import { format } from "date-fns";


export default function ChildProfiles() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: children, isLoading } = useQuery<any[] | undefined>({
    queryKey: ["/api/children"],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const { data: parents } = useQuery<any[] | undefined>({
    queryKey: ["/api/parents"],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const getParentName = (parentId: number) => {
    const parent = parents?.find((p: any) => p.id === parentId);
    return parent ? `${parent.firstName} ${parent.lastName}` : 'Unknown Parent';
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const filteredChildren = (children || []).filter((child: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      child.firstName.toLowerCase().includes(query) ||
      child.lastName.toLowerCase().includes(query) ||
      getParentName(child.parentId).toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Child Profiles</h1>
              <p className="text-slate-600 dark:text-gray-300">Manage child information and enrollment records</p>
            </div>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Child
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
                    placeholder="Search children by name or parent..."
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

          {/* Children List */}
          <Card>
            <CardHeader>
              <CardTitle>All Children</CardTitle>
              <CardDescription>
                Complete list of children in the daycare ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
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
              ) : filteredChildren?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChildren.map((child: any) => (
                    <Card key={child.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
                            <Baby className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {child.firstName} {child.lastName}
                            </CardTitle>
                            <CardDescription>
                              Parent: {getParentName(child.parentId)}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-slate-600 dark:text-gray-400">Age</p>
                              <p className="font-medium">
                                {child.dateOfBirth ? `${getAge(child.dateOfBirth)} years` : 'Not specified'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-slate-600 dark:text-gray-400">Status</p>
                              <Badge variant={child.isActive ? "default" : "secondary"}>
                                {child.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {child.allergies && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Allergies</p>
                            <p className="text-sm text-red-600 dark:text-red-400">{child.allergies}</p>
                          </div>
                        )}
                        
                        {child.medicalNotes && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Medical Notes</p>
                            <p className="text-sm text-slate-600 dark:text-gray-300">{child.medicalNotes}</p>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            Registered: {format(new Date(child.createdAt), 'PP')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-gray-400">
                  <Baby className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No children found</p>
                  <p className="text-sm">
                    {searchQuery ? "Try adjusting your search criteria" : "No children have been registered yet"}
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
