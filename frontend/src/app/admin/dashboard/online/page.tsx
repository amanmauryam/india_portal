"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Globe, Clock, Activity, MapPin } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminOnlinePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const token = () => localStorage.getItem("token") || "";

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/sessions`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_BASE}/api/admin/online-count`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      if (sessRes.ok) setSessions(await sessRes.json());
      if (countRes.ok) { const d = await countRes.json(); setCount(d.count || 0); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Online Users</h1>
          <p className="text-xs text-slate-500">Monitor active team members in real time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 dark:bg-emerald-950/20">
            <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">{count} online</span>
          </div>
          <button onClick={loadData} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-xs font-semibold text-slate-500">No active sessions</p>
            <p className="text-[10px] text-slate-400">Data refreshes every 15 seconds</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((sess) => (
              <div key={sess.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-bold dark:from-blue-950 dark:to-indigo-950 dark:text-blue-400">
                      {sess.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{sess.user_name || "Unknown User"}</p>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">{sess.user_role?.replace("_", " ") || "User"}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {timeAgo(sess.last_activity || sess.created_at)}</span>
                      {sess.ip_address && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {sess.ip_address}</span>}
                      {sess.current_page && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {sess.current_page}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Logged in {new Date(sess.created_at).toLocaleString()}</span>
                    </div>
                    {sess.editing_status && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {sess.editing_status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
