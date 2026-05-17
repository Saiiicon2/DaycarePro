import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useNightMode from "@/hooks/useNightMode";
import {
  LayoutDashboard, Search, Users, Baby, Building2,
  CreditCard, Settings, LogOut, Shield,
  Moon, Sun
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { isDark, toggle } = useNightMode();

  async function handleLogout() {
    try {
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok && res.status !== 204) throw new Error("Logout failed");
    } catch {
      // ignore network errors; we still clear client state
    } finally {
      await qc.clear();
      navigate("/login");
    }
  }

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Parent Lookup", href: "/parent-lookup", icon: <Search className="h-5 w-5" /> },
    { label: "Parent Registry", href: "/parent-registry", icon: <Users className="h-5 w-5" /> },
    { label: "Child Profiles", href: "/child-profiles", icon: <Baby className="h-5 w-5" /> },
    { label: "Daycare Centers", href: "/daycare-centers", icon: <Building2 className="h-5 w-5" /> },
    { label: "Payment Tracking", href: "/payment-tracking", icon: <CreditCard className="h-5 w-5" /> },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const getUserInitials = () =>
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.email?.[0]?.toUpperCase() || "U";

  const getUserDisplayName = () =>
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "User";

  const getRoleBadge = () =>
    user?.role === "system_admin"
      ? "System Admin"
      : user?.role === "daycare_admin"
      ? "Daycare Admin"
      : "User";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col z-50">
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <img src="/img/logoedu[trans].png" alt="Logo" className="h-8 object-contain" />
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-b from-slate-50 to-transparent dark:from-gray-700/50 dark:to-transparent">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {getUserDisplayName()}
            </p>
            <Badge variant="secondary" className="text-xs mt-1">{getRoleBadge()}</Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-3 mb-3">
            Main
          </p>
          {navItems.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && <Badge variant="secondary" className="ml-auto text-xs">{item.badge}</Badge>}
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-3 mb-3">
            Management
          </p>
          {navItems.slice(2, 5).map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && <Badge variant="secondary" className="ml-auto text-xs">{item.badge}</Badge>}
              </div>
            </Link>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-3 mb-3">
            Payments
          </p>
          {navItems.slice(5).map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && <Badge variant="secondary" className="ml-auto text-xs">{item.badge}</Badge>}
              </div>
            </Link>
          ))}
        </div>

        {(user?.role === "system_admin" || user?.role === "admin") && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-3 mb-3">
                Ecosystem
              </p>
              <Link href="/ecosystem-management">
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/ecosystem-management")
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Safety & Monitoring</span>
                </div>
              </Link>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest px-3 mb-3">
                System
              </p>
              <Link href="/settings">
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/settings")
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </div>
              </Link>
              <Link href="/users">
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/users")
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </div>
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-gradient-to-t from-slate-50 to-transparent dark:from-gray-700/50 dark:to-transparent space-y-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start h-10 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-all duration-200"
          onClick={toggle}
          aria-pressed={isDark}
        >
          {isDark ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
          <span>{isDark ? "Light mode" : "Night mode"}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start h-10 text-slate-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
