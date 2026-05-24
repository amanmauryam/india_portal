"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw, AlertCircle, Search, FileText, ArrowLeft, ArrowRight, GitCompare } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ENTITY_TYPES = ["STATE", "DISTRICT", "SERVICE", "BLOG"];

export default function AdminVersionsPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const token = () => localStorage.getItem("token") || "";

  const loadVersions = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/admin/versions?limit=50`;
      if (entityFilter) url += `&entity_type=${entityFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setVersions(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadVersions(); }, [entityFilter]);

  const handleRestore = async (id: string) => {
    if (!confirm("Restore this version? Current content will be replaced.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/versions/${id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        setError("");
        loadVersions();
      } else throw new Error("Restore failed");
    } catch (err: any) { setError(err.message); }
  };

  const viewDiff = (v1: any, v2: any) => {
    const oldData = v1?.content_data || {};
    const newData = v2?.content_data || {};
    const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const diffs: any[] = [];
    keys.forEach(k => {
      if (JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])) {
        diffs.push({ key: k, old: oldData[k], new: newData[k] });
      }
    });
    return diffs;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Version History</h1>
          <p className="text-xs text-slate-500">Browse, compare, and restore previous content versions</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5"><AlertCircle className="h-4.5 w-4.5 shrink-0" /><span>{error}</span></div>}

      <div className="flex gap-2">
        <button onClick={() => setEntityFilter("")} className={`rounded-xl px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${!entityFilter ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>All</button>
        {ENTITY_TYPES.map(et => (
          <button key={et} onClick={() => setEntityFilter(et)} className={`rounded-xl px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${entityFilter === et ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>{et}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-xs font-semibold text-slate-500">No version history</p>
              <p className="text-[10px] text-slate-400">Versions are created when content is saved</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className={`p-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 cursor-pointer transition-colors ${selectedVersion?.id === ver.id ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
                  onClick={() => { setSelectedVersion(ver); setCompareId(null); }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                      <History className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">v{versions.length - idx}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800">{ver.entity_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ver.entity_id?.slice(0, 8)}</span>
                        {ver.version_note && <span className="text-[10px] text-slate-500 italic">"{ver.version_note}"</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        <span>{ver.created_at ? new Date(ver.created_at).toLocaleString() : ""}</span>
                        {ver.created_by_name && <span>by {ver.created_by_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCompareId(compareId === ver.id ? null : ver.id); }}
                        className={`rounded-lg border p-1.5 ${compareId === ver.id ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800" : "border-slate-200 text-slate-400 hover:bg-slate-100 dark:border-slate-800"}`}
                        title="Compare"
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(ver.id); }}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-800"
                        title="Restore"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Version Detail Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {!selectedVersion ? (
            <div className="py-12 text-center">
              <History className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-xs font-semibold text-slate-500">Select a version</p>
              <p className="text-[10px] text-slate-400">Click a version to view its details</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white">Version Details</h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between"><span className="text-slate-400">Entity:</span><span className="font-bold text-slate-700 dark:text-slate-300">{selectedVersion.entity_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ID:</span><span className="font-mono text-slate-500">{selectedVersion.entity_id?.slice(0, 12)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Saved:</span><span className="text-slate-500">{new Date(selectedVersion.created_at).toLocaleString()}</span></div>
                {selectedVersion.created_by_name && <div className="flex justify-between"><span className="text-slate-400">By:</span><span className="text-slate-500">{selectedVersion.created_by_name}</span></div>}
                {selectedVersion.version_note && <div className="flex justify-between"><span className="text-slate-400">Note:</span><span className="text-slate-500 italic">{selectedVersion.version_note}</span></div>}
              </div>

              {/* Diff view */}
              {compareId && compareId !== selectedVersion.id && (
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Changes vs v{versions.findIndex(v => v.id === compareId) !== -1 ? versions.length - versions.findIndex(v => v.id === compareId) : "?"}</h4>
                  <div className="space-y-2">
                    {(() => {
                      const v1 = versions.find(v => v.id === compareId);
                      const v2 = selectedVersion;
                      if (!v1 || !v2) return <p className="text-[10px] text-slate-400">Select two versions to compare</p>;
                      const diffs = viewDiff(v1, v2);
                      if (diffs.length === 0) return <p className="text-[10px] text-emerald-600 font-semibold">No differences</p>;
                      return diffs.map((d, i) => (
                        <div key={i} className="rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-500 uppercase">{d.key}</p>
                          <div className="mt-1 text-[9px]">
                            {d.old !== undefined && <p className="text-red-500 line-through truncate">{JSON.stringify(d.old).slice(0, 100)}</p>}
                            {d.new !== undefined && <p className="text-emerald-600 truncate">{JSON.stringify(d.new).slice(0, 100)}</p>}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <button onClick={() => handleRestore(selectedVersion.id)} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700">
                <RotateCcw className="h-4 w-4" /> Restore This Version
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
