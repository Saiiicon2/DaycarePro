import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Search, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            {/* <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">EduConnect</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Ecosystem Manager</p>
            </div> */}
            <img src="/img/logoedu[trans].png"></img>
          </div>
          
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Protect Your Daycare Network
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            A comprehensive payment tracking system that prevents non-paying parents from 
            moving between daycare centers without settling their debts. Built for daycare 
            ecosystems that want to share payment history data.
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => window.location.href = '/login'}
          >
            Access Dashboard
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Parent Registry</CardTitle>
              <CardDescription>
                Centralized database of all parents across your daycare network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Complete parent profiles</li>
                <li>• Child enrollment history</li>
                <li>• Contact information</li>
                <li>• Emergency contacts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Search className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Cross-Network Lookup</CardTitle>
              <CardDescription>
                Instantly check parent payment history before enrollment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Real-time payment verification</li>
                <li>• Outstanding balance alerts</li>
                <li>• Payment pattern analysis</li>
                <li>• Risk assessment scores</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Payment Analytics</CardTitle>
              <CardDescription>
                Comprehensive insights into payment behaviors and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Payment tier classifications</li>
                <li>• Overdue payment tracking</li>
                <li>• Network-wide statistics</li>
                <li>• Performance dashboards</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Payment Tiers */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl mb-16">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Three-Tier Payment Classification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">Good Payers</h4>
              <p className="text-green-600 dark:text-green-300 text-sm">
                Consistent payment history with minimal delays. Low risk for enrollment.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-2">Mid Payers</h4>
              <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                Occasional late payments. Moderate risk requiring careful monitoring.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
              <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Non-Payers</h4>
              <p className="text-red-600 dark:text-red-300 text-sm">
                Frequent late payments or outstanding balances. High risk for enrollment.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Protect Your Network?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join the daycare ecosystem and start tracking payment behaviors today.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-4 mr-4"
            onClick={() => window.location.href = '/register-institution'}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
