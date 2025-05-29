import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PaymentTierChartProps {
  stats?: {
    totalParents: number;
    goodPayers: number;
    midPayers: number;
    nonPayers: number;
  };
  isLoading: boolean;
}

export default function PaymentTierChart({ stats, isLoading }: PaymentTierChartProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-64"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = stats?.totalParents || 0;
  const goodPayers = stats?.goodPayers || 0;
  const midPayers = stats?.midPayers || 0;
  const nonPayers = stats?.nonPayers || 0;

  const goodPayersPercent = total > 0 ? (goodPayers / total) * 100 : 0;
  const midPayersPercent = total > 0 ? (midPayers / total) * 100 : 0;
  const nonPayersPercent = total > 0 ? (nonPayers / total) * 100 : 0;

  const ecosystemHealth = goodPayersPercent;

  const tiers = [
    {
      label: "Good Payers",
      count: goodPayers,
      percentage: goodPayersPercent,
      color: "bg-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Mid Payers",
      count: midPayers,
      percentage: midPayersPercent,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      label: "Non-Payers",
      count: nonPayers,
      percentage: nonPayersPercent,
      color: "bg-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Tier Distribution</CardTitle>
        <CardDescription>
          Current distribution across all daycare centers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 ${tier.color} rounded-full`}></div>
                  <span className="font-medium text-slate-700 dark:text-gray-200">
                    {tier.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {tier.percentage.toFixed(1)}%
                  </span>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    {tier.count.toLocaleString()} parents
                  </p>
                </div>
              </div>
              <Progress 
                value={tier.percentage} 
                className="h-2"
                style={{
                  background: 'hsl(var(--muted))',
                }}
              />
            </div>
          ))}
        </div>
        
        <div className={`mt-6 p-4 rounded-lg ${ecosystemHealth >= 70 ? 'bg-green-50 dark:bg-green-900/20' : ecosystemHealth >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
            Ecosystem Health Score
          </p>
          <div className="flex items-center space-x-2">
            <Progress 
              value={ecosystemHealth} 
              className="flex-1 h-2"
            />
            <span className={`text-sm font-semibold ${ecosystemHealth >= 70 ? 'text-green-600' : ecosystemHealth >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {ecosystemHealth.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Based on percentage of good payers in the ecosystem
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
