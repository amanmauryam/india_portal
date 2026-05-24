"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, User, BarChart3, Image, ListTodo, Activity, DollarSign, Landmark, MapPin, Award, Loader2, ExternalLink } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Action {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: string;
  action: () => void;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  slug: string;
  score: number;
}

const TYPE_ICONS: Record<string, any> = {
  STATE: Landmark,
  DISTRICT: MapPin,
  SERVICE: Award,
  BLOG: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  STATE: "States",
  DISTRICT: "Districts",
  SERVICE: "Services",
  BLOG: "Blog Posts",
};

const TYPE_COLORS: Record<string, string> = {
  STATE: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  DISTRICT: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
  SERVICE: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
  BLOG: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400",
};

export default function CommandPalette({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setSearched(false); return; }
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q.trim())}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {}
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      debounceRef.current = setTimeout(() => doSearch(query), 250);
    } else {
      setSearchResults([]);
      setSearched(false);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, searchResults]);

  const navActions: Action[] = [
    { id: "nav-overview", label: "Go to Dashboard", description: "View analytics overview", icon: BarChart3, category: "Navigate", action: () => router.push("/admin/dashboard") },
    { id: "nav-states", label: "Go to States", description: "Manage states", icon: Landmark, category: "Navigate", action: () => router.push("/admin/dashboard/states") },
    { id: "nav-districts", label: "Go to Districts", description: "Manage districts", icon: MapPin, category: "Navigate", action: () => router.push("/admin/dashboard/districts") },
    { id: "nav-services", label: "Go to Services", description: "Manage services", icon: Award, category: "Navigate", action: () => router.push("/admin/dashboard/services") },
    { id: "nav-blogs", label: "Go to Blog Posts", description: "Manage blog content", icon: FileText, category: "Navigate", action: () => router.push("/admin/dashboard/blogs") },
    { id: "nav-users", label: "Go to Users", description: "Manage team members", icon: User, category: "Navigate", action: () => router.push("/admin/dashboard/users") },
    { id: "nav-media", label: "Go to Media Library", description: "Upload and manage media", icon: Image, category: "Navigate", action: () => router.push("/admin/dashboard/media") },
    { id: "nav-analytics", label: "Go to Analytics", description: "View page analytics", icon: BarChart3, category: "Navigate", action: () => router.push("/admin/dashboard/analytics") },
    { id: "nav-tasks", label: "Go to Tasks", description: "Manage content tasks", icon: ListTodo, category: "Navigate", action: () => router.push("/admin/dashboard/tasks") },
    { id: "nav-activity", label: "Go to Activity Log", description: "View audit trail", icon: Activity, category: "Navigate", action: () => router.push("/admin/dashboard/activity") },
    { id: "nav-monetization", label: "Go to Monetization", description: "Manage ad slots", icon: DollarSign, category: "Navigate", action: () => router.push("/admin/dashboard/monetization") },
    { id: "create-blog", label: "Create Blog Post", description: "Write a new blog article", icon: FileText, category: "Create", action: () => router.push("/admin/dashboard/blogs") },
    { id: "create-state", label: "Create State", description: "Add a new state directory", icon: Landmark, category: "Create", action: () => router.push("/admin/dashboard/states") },
    { id: "create-service", label: "Create Service", description: "Add a new utility service", icon: Award, category: "Create", action: () => router.push("/admin/dashboard/services") },
    { id: "create-district", label: "Create District", description: "Add a new district page", icon: MapPin, category: "Create", action: () => router.push("/admin/dashboard/districts") },
  ];

  const filteredNav = query.trim()
    ? navActions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      )
    : navActions;

  const resultItems = searchResults.map((r, i) => ({
    id: `sr-${r.type}-${r.id}`,
    label: r.title,
    description: r.subtitle,
    icon: TYPE_ICONS[r.type] || ExternalLink,
    category: TYPE_LABELS[r.type] || r.type,
    action: () => {
      if (r.type === "BLOG") router.push(`/admin/dashboard/blogs/${r.slug || r.id}`);
      else if (r.type === "STATE") router.push("/admin/dashboard/states");
      else if (r.type === "DISTRICT") router.push("/admin/dashboard/districts");
      else if (r.type === "SERVICE") router.push("/admin/dashboard/services");
    },
  }));

  const allItems = query.trim() ? resultItems : filteredNav;
  const categories = [...new Set(allItems.map(a => a.category))];
  const hasQuery = query.trim().length > 0;

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allItems[selectedIndex]) {
      allItems[selectedIndex].action();
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 p-4 pt-[15vh] backdrop-blur-sm" onClick={() => onClose?.()}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
            placeholder="Search states, districts, services, blogs..."
            className="h-14 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {searching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:inline-block dark:border-slate-800">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {/* Search results */}
          {hasQuery && searched && !searching && searchResults.length === 0 && (
            <div className="py-10 text-center">
              <Search className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-xs font-semibold text-slate-500">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[10px] text-slate-400 mt-1">Try a different search term</p>
            </div>
          )}

          {hasQuery && searching && searchResults.length === 0 && (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-500">Searching...</p>
            </div>
          )}

          {categories.map(cat => {
            const items = allItems.filter(a => a.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">{cat}</div>
                {items.map((item) => {
                  const globalIdx = allItems.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { item.action(); onClose?.(); }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        globalIdx === selectedIndex
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        hasQuery ? TYPE_COLORS[cat.toUpperCase().replace(" ", "_")] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                      </div>
                      <kbd className="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:border-slate-800">Go</kbd>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Show nav hints when no query */}
          {!hasQuery && (
            <div className="border-t border-slate-100 mt-2 pt-2 dark:border-slate-800">
              <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Quick Navigation</div>
              <div className="grid grid-cols-2 gap-1">
                {navActions.slice(0, 8).map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.id} onClick={() => { a.action(); onClose?.(); }}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.label.replace("Go to ", "")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400 dark:border-slate-800">
          <span className="font-bold">Ctrl+K</span> to open &middot; <span className="font-bold">↑↓</span> to navigate &middot; <span className="font-bold">Enter</span> to select &middot; Type to search content
        </div>
      </div>
    </div>
  );
}
