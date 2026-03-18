import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Cpu,
  FolderOpen,
  Key,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Brain,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/keys", label: "Keys", icon: Key },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-semibold text-white tracking-tight text-lg">NetMind Gateway</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const active = location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                active
                  ? "bg-white/15 text-white shadow-md border border-white/10"
                  : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-white/50 truncate mb-2">{user?.username}</p>
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90 capitalize font-medium tracking-wide">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all duration-300 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="flex h-screen"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(26, 38, 43, 0.8) 0%, rgba(66, 52, 40, 0.8) 100%), url('https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=2565&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-white/5 backdrop-blur-2xl shrink-0 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)] z-10">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-[#1a262b]/95 backdrop-blur-2xl border-r border-white/10 z-50 shadow-2xl">
            <button
              className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-transparent hover:border-white/20"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl shrink-0 text-white">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold tracking-tight text-lg">NetMind Gateway</span>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
