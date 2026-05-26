"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Landmark, MapPin, Award, FileText, Users, Image,
  LogOut, User as UserIcon, BarChart3, ListTodo, Activity, DollarSign,
  Shield, Menu, X, Search, FileCode2, Globe, Eye, GitBranch, FolderTree, ShieldCheck
} from "lucide-react";
import { getMe } from "@/lib/api";
import CommandPalette from "@/components/CommandPalette";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";

type Role = "SUPER_ADMIN" | "ADMIN" | "STATE_MANAGER" | "DISTRICT_EDITOR" | "CONTRIBUTOR" | "VIEWER";

interface MenuItem {
  name: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Content",
    items: [
      { name: "Dashboard", link: "/admin/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR", "CONTRIBUTOR", "VIEWER"] },
      { name: "States", link: "/admin/dashboard/states", icon: Landmark, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"] },
      { name: "Districts", link: "/admin/dashboard/districts", icon: MapPin, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"] },
      { name: "Services", link: "/admin/dashboard/services", icon: Award, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"] },
      { name: "Categories", link: "/admin/dashboard/categories", icon: FolderTree, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"] },
      { name: "Blog Posts", link: "/admin/dashboard/blogs", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR", "CONTRIBUTOR"] },
      { name: "Verified Portals", link: "/admin/dashboard/verified-portals", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"] },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Users", link: "/admin/dashboard/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Media", link: "/admin/dashboard/media", icon: Image, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR"] },
      { name: "Tasks", link: "/admin/dashboard/tasks", icon: ListTodo, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"] },
      { name: "Pages/SEO", link: "/admin/dashboard/seo", icon: FileCode2, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"] },
      { name: "Permissions", link: "/admin/dashboard/permissions", icon: Shield, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Analytics", link: "/admin/dashboard/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"] },
      { name: "Activity Log", link: "/admin/dashboard/activity", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER"] },
      { name: "Online Users", link: "/admin/dashboard/online", icon: Eye, roles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Version History", link: "/admin/dashboard/versions", icon: GitBranch, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Monetization",
    items: [
      { name: "Ad Slots", link: "/admin/dashboard/monetization", icon: DollarSign, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole") || "";
    const name = localStorage.getItem("userName") || "";
    if (!token) { router.push("/admin"); return; }

    // Validate the token with the server
    (async () => {
      try {
        await getMe(token);
        setUserName(name);
        setUserRole(role);
        setAuthChecked(true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        router.push("/admin");
      }
    })();
  }, [router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    router.push("/admin");
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Shield className="mx-auto h-10 w-10 animate-pulse text-blue-500" />
          <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">Validating Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {cmdPaletteOpen && <CommandPalette onClose={() => setCmdPaletteOpen(false)} />}

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="font-extrabold text-sm uppercase tracking-wider">CMS</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCmdPaletteOpen(true)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 dark:border-slate-800">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform dark:border-slate-800/80 dark:bg-slate-900 md:sticky md:top-0 md:h-screen md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/10">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">BharatLocal</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Content Platform</p>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(userRole as Role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{group.label}</p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.link;
                    return (
                      <Link
                        key={item.name}
                        href={item.link}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom: User + Theme + Logout */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Link href="/admin/dashboard/profile" onClick={() => setSidebarOpen(false)} className="mb-3 flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-bold text-xs dark:from-blue-950 dark:to-indigo-950 dark:text-blue-400">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{userName || "User"}</p>
              <p className="truncate text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {userRole?.replace("_", " ") || "Viewer"}
              </p>
            </div>
          </Link>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-200/80 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30 dark:hover:bg-red-950/20"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen pt-14 md:pt-0">
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md md:flex dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{pathname.split("/").filter(Boolean).join(" / ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCmdPaletteOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="rounded border border-slate-200 px-1 py-0.5 text-[9px] font-bold dark:border-slate-800">Ctrl+K</kbd>
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
