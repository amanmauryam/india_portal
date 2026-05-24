"use client";

import { useEffect, useState } from "react";
import { Activity, Search, AlertCircle, RefreshCw, Filter } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const token = () => localStorage.getItem("token") || "";

  const loadLogs = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/admin/audit-logs?limit=100`;
      if (filterAction) url += `&action=${filterAction}`;
      if (filterEntity) url += `&entity_type=${filterEntity}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("Failed to load logs");
      setLogs(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, [filterAction, filterEntity]);

  const actionColor: Record<string, string> = {
    CREATE: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    UPDATE: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
    DELETE: "text-red-600 bg-red-50 dark:bg-red-950/20",
    PUBLISH: "text-purple-600 bg-purple-50 dark:bg-purple-950/20",
    APPROVE: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20",
    REJECT: "text-rose-600 bg-rose-50 dark:bg-rose-950/20",
    LOGIN: "text-sky-600 bg-sky-50 dark:bg-sky-950/20",
    LOGOUT: "text-slate-600 bg-slate-50 dark:bg-slate-950/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Activity Log</h1>
          <p className="text-xs text-slate-500">Complete audit trail of all system actions</p>
        </div>
        <button onClick={loadLogs} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5"><AlertCircle className="h-4.5 w-4.5 shrink-0" /><span>{error}</span></div>}

      <div className="flex gap-2 flex-wrap">
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-[10px] font-bold outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="PUBLISH">PUBLISH</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="SUBMIT_FOR_REVIEW">SUBMIT_FOR_REVIEW</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-[10px] font-bold outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
          <option value="">All Entities</option>
          <option value="STATE">STATE</option>
          <option value="DISTRICT">DISTRICT</option>
          <option value="SERVICE">SERVICE</option>
          <option value="BLOG">BLOG</option>
          <option value="USER">USER</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activity log...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-xs font-semibold text-slate-500">No activity recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${actionColor[log.action] || "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${actionColor[log.action] || "bg-slate-100 text-slate-600"}`}>{log.action}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.entity_type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.entity_id?.slice(0, 8)}...</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{log.user_id ? `User: ${log.user_id.slice(0, 8)}` : "System"}</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</span>
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </div>
                    {log.old_values && (
                      <details className="mt-1">
                        <summary className="text-[9px] text-slate-400 cursor-pointer hover:text-slate-600">Old values</summary>
                        <pre className="mt-1 text-[9px] text-slate-500 bg-slate-50 p-2 rounded-lg overflow-x-auto dark:bg-slate-950">{JSON.stringify(log.old_values, null, 2)}</pre>
                      </details>
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
