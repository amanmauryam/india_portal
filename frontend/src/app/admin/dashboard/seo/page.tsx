"use client";

import { useEffect, useState } from "react";
import { Search, Globe, Eye, Edit3, Save, AlertCircle, CheckCircle, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminSEOPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    meta_title: "", meta_description: "", og_title: "", og_description: "",
    canonical_url: "", robots: "index,follow", schema_markup: "",
  });

  const token = () => localStorage.getItem("token") || "";

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/seo/metadata`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setPages(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadPages(); }, []);

  const openEditor = (page: any) => {
    setEditingId(page.id);
    setForm({
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      og_title: page.og_title || "",
      og_description: page.og_description || "",
      canonical_url: page.canonical_url || "",
      robots: page.robots || "index,follow",
      schema_markup: page.schema_markup ? JSON.stringify(page.schema_markup, null, 2) : "",
    });
    setError("");
  };

  const handleSave = async (id: string) => {
    setError(""); setSuccess("");
    let schema = {};
    try {
      if (form.schema_markup) schema = JSON.parse(form.schema_markup);
    } catch { setError("Invalid JSON in schema markup"); return; }

    try {
      const res = await fetch(`${API_BASE}/api/admin/seo/metadata/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, schema_markup: schema }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSuccess("SEO metadata updated");
      setEditingId(null);
      loadPages();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const filtered = searchQuery
    ? pages.filter(p => p.page_type?.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug?.toLowerCase().includes(searchQuery.toLowerCase()))
    : pages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">SEO Management</h1>
          <p className="text-xs text-slate-500">Manage meta titles, descriptions, OG tags, and schema for all pages</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5"><AlertCircle className="h-4.5 w-4.5 shrink-0" /><span>{error}</span></div>}
      {success && <div className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-4 text-xs font-semibold text-emerald-500 flex items-start gap-2.5"><CheckCircle className="h-4.5 w-4.5 shrink-0" /><span>{success}</span></div>}

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by page type or slug..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading SEO data...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Globe className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="mt-2 text-xs font-semibold text-slate-500">No SEO metadata found</p>
            <p className="text-[10px] text-slate-400">Auto-generate SEO from the content pages</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((page) => (
              <div key={page.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                {editingId === page.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Meta Title</label>
                        <input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                        <p className="text-[9px] text-slate-400 mt-1">{form.meta_title.length}/120 chars</p>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Canonical URL</label>
                        <input value={form.canonical_url} onChange={e => setForm(f => ({ ...f, canonical_url: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Meta Description</label>
                      <textarea rows={2} value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                      <p className="text-[9px] text-slate-400 mt-1">{form.meta_description.length}/300 chars</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">OG Title</label>
                        <input value={form.og_title} onChange={e => setForm(f => ({ ...f, og_title: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Robots</label>
                        <select value={form.robots} onChange={e => setForm(f => ({ ...f, robots: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                          <option value="index,follow">index, follow</option>
                          <option value="noindex,follow">noindex, follow</option>
                          <option value="index,nofollow">index, nofollow</option>
                          <option value="noindex,nofollow">noindex, nofollow</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">OG Description</label>
                      <textarea rows={2} value={form.og_description} onChange={e => setForm(f => ({ ...f, og_description: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Schema Markup (JSON-LD)</label>
                      <textarea rows={4} value={form.schema_markup} onChange={e => setForm(f => ({ ...f, schema_markup: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" placeholder='{"@context":"https://schema.org",...}' />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800">Cancel</button>
                      <button onClick={() => handleSave(page.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                        <Save className="h-3.5 w-3.5" /> Save SEO
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 uppercase">{page.page_type}</span>
                        <span className="text-xs font-mono text-slate-400">/{page.slug}</span>
                        {page.is_auto_generated && <span className="text-[9px] text-slate-400">(auto)</span>}
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 truncate">{page.meta_title || "No meta title"}</p>
                      {page.meta_description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{page.meta_description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-400">
                        <span>{page.updated_at ? new Date(page.updated_at).toLocaleDateString() : new Date(page.created_at).toLocaleDateString()}</span>
                        {(page.robots || page.canonical_url) && (
                          <>
                            {page.robots && <span className="font-bold uppercase">{page.robots}</span>}
                            {page.canonical_url && <span className="truncate max-w-[200px]">{page.canonical_url}</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => openEditor(page)} className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
