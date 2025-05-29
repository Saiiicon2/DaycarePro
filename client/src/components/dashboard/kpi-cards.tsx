import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface KPICardsProps {
  stats?: {
    totalParents: number;
    goodPayers: number;
    midPayers: number;
    nonPayers: number;
  };
  isLoading: boolean;
}

export default function KPICards({ stats, isLoading }: KPICardsProps) {
  const cards = [
    {
      title: "Total Parents",
      value: stats?.totalParents || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      change: "+12% from last month",
      changeColor: "text-green-600",
    },
    {
      title: "Good Payers",
      value: stats?.goodPayers || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      percentage: stats ? ((stats.goodPayers / stats.totalParents) * 100).toFixed(1) : "0.0",
    },
    {
      title: "Mid Payers",
      value: stats?.midPayers || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      percentage: stats ? ((stats.midPayers / stats.totalParents) * 100).toFixed(1) : "0.0",
    },
    {
      title: "Non-Payers",
      value: stats?.nonPayers || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      percentage: stats ? ((stats.nonPayers / stats.totalParents) * 100).toFixed(1) : "0.0",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-slate-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {card.value.toLocaleString()}
                  </p>
                  <div className="mt-2">
                    {card.change && (
                      <p className={`text-sm ${card.changeColor}`}>
                        {card.change}
                      </p>
                    )}
                    {card.percentage && (
                      <p className="text-sm text-slate-500 dark:text-gray-400">
                        {card.percentage}% of total
                      </p>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
