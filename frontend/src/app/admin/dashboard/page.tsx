"use client";

import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { 
  Landmark, MapPin, Award, FileText, Eye, Search, Users, 
  ArrowUpRight, TrendingUp, Activity 
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [stats, setStats] = useState({ states: 0, districts: 0, services: 0, blogs: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "");
    setUserRole(localStorage.getItem("userRole") || "");

    const load = async () => {
      try {
        const [states, districts, services, blogs] = await Promise.all([
          request("/api/states"),
          request("/api/districts"),
          request("/api/services"),
          request("/api/blogs"),
        ]);
        setStats({
          states: states?.total ?? (Array.isArray(states) ? states.length : 0),
          districts: districts?.total ?? (Array.isArray(districts) ? districts.length : 0),
          services: services?.total ?? (Array.isArray(services) ? services.length : 0),
          blogs: blogs?.total ?? (Array.isArray(blogs) ? blogs.length : 0),
        });
      } catch {}
    };
    load();

    const token = localStorage.getItem("token");
    if (token) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/analytics/admin/metrics?days=30`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) setAnalytics(await res.json());
        } catch {}
      })();

      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/audit-logs?limit=10`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) setRecentActivity(await res.json());
        } catch {}
      })();

      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/online-count`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) { const d = await res.json(); setOnlineUsers(d.count || 0); }
        } catch {}
      })();
    }
  }, []);

  const cards = [
    { label: "States", value: stats.states, icon: Landmark, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20", link: "/admin/dashboard/states" },
    { label: "Districts", value: stats.districts, icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20", link: "/admin/dashboard/districts" },
    { label: "Services", value: stats.services, icon: Award, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20", link: "/admin/dashboard/services" },
    { label: "Blog Posts", value: stats.blogs, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20", link: "/admin/dashboard/blogs" },
  ];

  const metricCards = analytics ? [
    { label: "Page Views", value: analytics.total_views?.toLocaleString(), icon: Eye, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/20" },
    { label: "Search Queries", value: analytics.trending_queries?.length || 0, icon: Search, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20" },
    { label: "Top Services", value: analytics.top_services?.length || 0, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
    { label: "Online Now", value: onlineUsers, icon: Users, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/20" },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Welcome back, {userName || "Admin"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {userRole?.replace("_", " ") || "Loading..."} &middot; BharatLocal Content Platform
        </p>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.link} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900 dark:text-white">{card.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Analytics Metrics */}
      {metricCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{card.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white">Recent Activity</h3>
            </div>
            <Link href="/admin/dashboard/activity" className="text-[10px] font-bold text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="p-4 space-y-1">
            {recentActivity.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No recent activity</p>
            )}
            {recentActivity.slice(0, 8).map((log: any, i: number) => (
              <div key={log.id || i} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    <span className="font-extrabold uppercase text-[10px] text-blue-600 dark:text-blue-400">{log.action} </span>
                    {log.entity_type} — {log.entity_id?.slice(0, 8)}
                  </p>
                  <p className="text-[9px] text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Queries */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white">Trending Searches</h3>
            </div>
          </div>
          <div className="p-4 space-y-1">
            {!analytics?.trending_queries?.length && (
              <p className="py-6 text-center text-xs text-slate-400">No search data yet</p>
            )}
            {analytics?.trending_queries?.slice(0, 8).map((q: any, i: number) => (
              <div key={q.query} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3 truncate">
                  <span className="text-[9px] font-extrabold text-slate-400 w-4">{i + 1}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{q.query}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 shrink-0 ml-2">{q.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
