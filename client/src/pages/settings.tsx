import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Application and system settings (admin only)</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-gray-300">
                This page is a placeholder for system settings. Currently there are no configurable options here.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
