import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Search, 
  Building2, 
  FileText, 
  ChevronRight 
} from "lucide-react";
import { Link } from "wouter";

export default function QuickActions() {
  const actions = [
    {
      icon: UserPlus,
      title: "Register Parent",
      description: "Add new parent profile",
      href: "/parent-registry",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600",
    },
    {
      icon: Search,
      title: "Parent Lookup",
      description: "Check payment history",
      href: "/parent-lookup",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600",
    },
    {
      icon: Building2,
      title: "Add Daycare",
      description: "Register new center",
      href: "/daycare-centers",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600",
    },
    {
      icon: FileText,
      title: "Export Report",
      description: "Download analytics",
      href: "/reports",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto hover:bg-slate-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {action.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
