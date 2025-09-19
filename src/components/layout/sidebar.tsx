import { 
  Home, 
  Layers, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Egg,
  Menu,
  X
} from "lucide-react";
import { NavLink } from "@/components/ui/nav-link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import chickenIcon from "@/assets/chicken-icon.png";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Batches", href: "/batches", icon: Layers },
  { name: "Daily Logs", href: "/logs", icon: FileText },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingCart },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card border-r shadow-medium">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <img src={chickenIcon} alt="Farm" className="h-8 w-8" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-primary">ChickTrack</h1>
          <p className="text-xs text-muted-foreground">Farm Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className="w-full justify-start"
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Egg className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Farm Owner</p>
            <p className="text-xs text-muted-foreground">admin@farm.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        isOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}