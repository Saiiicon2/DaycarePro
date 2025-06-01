import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Baby, 
  Building2, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Parent Lookup",
      href: "/parent-lookup",
      icon: <Search className="h-5 w-5" />,
    },
    {
      label: "Parent Registry",
      href: "/parent-registry",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Child Profiles",
      href: "/child-profiles",
      icon: <Baby className="h-5 w-5" />,
    },
    {
      label: "Daycare Centers",
      href: "/daycare-centers",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: "Payment Tracking",
      href: "/payment-tracking",
      icon: <CreditCard className="h-5 w-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'system_admin':
        return 'System Admin';
      case 'daycare_admin':
        return 'Daycare Admin';
      default:
        return 'User';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        {/* <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">DaycarePay</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">Ecosystem Manager</p>
          </div>
          
        </div> */}
        <img src="../src/img/logoedu[trans].png"></img>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {getUserInitials()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {getUserDisplayName()}
            </p>
            <Badge variant="secondary" className="text-xs">
              {getRoleBadge()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main
          </p>
          {navItems.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Management
          </p>
          {navItems.slice(2, 5).map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Payments
          </p>
          {navItems.slice(5).map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          ))}
        </div>

        {user?.role === 'system_admin' && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              System
            </p>
            <Link href="/settings">
              <a
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/settings")
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
          onClick={() => window.location.href = "/api/logout"}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
