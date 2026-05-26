"use client";

import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { AlertCircle, Eye, Search, MousePointerClick, TrendingUp } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const loadMetrics = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      const res = await fetch(`${API_BASE}/api/analytics/admin/metrics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load analytics");
      setMetrics(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-xs text-slate-500">Page views, trending queries, and CTR metrics</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading analytics...</div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Views</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.total_views.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trending Queries</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{(metrics.trending_queries || []).length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Districts</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{(metrics.top_districts || []).length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Services (CTR)</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{(metrics.clicks_ctr || []).length}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metrics.top_districts && metrics.top_districts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Top Districts by Views ( On live website )</h3>
              </div>
              <div className="p-5 space-y-3">
                {metrics.top_districts.map((d: any, i: number) => (
                  <div key={d.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-extrabold text-slate-400 w-4">{i + 1}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600">{d.count.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics.trending_queries && metrics.trending_queries.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Trending Search Queries ( Searched on website )</h3>
              </div>
              <div className="p-5 space-y-3">
                {metrics.trending_queries.map((q: any, i: number) => (
                  <div key={q.query} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-[10px] font-extrabold text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{q.query}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 shrink-0 ml-2">{q.count} searches</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics.clicks_ctr && metrics.clicks_ctr.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Link CTR by Service</h3>
              </div>
              <div className="p-5 space-y-3">
                {metrics.clicks_ctr.map((c: any, i: number) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-[10px] font-extrabold text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</span>
                    </div>
                    <span className="text-xs font-bold text-purple-600 shrink-0 ml-2">{c.ctr}% CTR</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics.top_services && metrics.top_services.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Top Services by Views</h3>
              </div>
              <div className="p-5 space-y-3">
                {metrics.top_services.map((s: any, i: number) => (
                  <div key={s.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-[10px] font-extrabold text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0 ml-2">{s.count.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
