"use client";

import { useEffect, useState, useCallback } from "react";
import { request, adminCreateService, adminUpdateService, adminDeleteService } from "@/lib/api";
import { Plus, Edit3, Trash2, X, AlertCircle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [quickCatOpen, setQuickCatOpen] = useState(false);

  const [districtId, setDistrictId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryFallback, setCategoryFallback] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [warningNotes, setWarningNotes] = useState("");
  const [error, setError] = useState("");

  // quick-create category form
  const [qcName, setQcName] = useState("");
  const [qcSlug, setQcSlug] = useState("");
  const [qcSaving, setQcSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcData, distData, catData] = await Promise.all([
        request("/api/services"),
        request("/api/districts"),
        fetch(`${API_BASE}/api/categories?flat=true`).then(r => r.json()).catch(() => []),
      ]);
      setServices(svcData || []);
      setDistricts(distData || []);
      setCategories(catData || []);
    } catch (err: any) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setDistrictId("");
    setName("");
    setSlug("");
    setCategoryId("");
    setCategoryFallback("");
    setOfficialLink("");
    setWarningNotes("");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (svc: any) => {
    setEditingService(svc);
    setDistrictId(svc.district_id);
    setName(svc.name);
    setSlug(svc.slug);
    setCategoryId(svc.category_id || "");
    setCategoryFallback(svc.category || "");
    setOfficialLink(svc.official_link);
    setWarningNotes(svc.warning_notes || "");
    setError("");
    setModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingService) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token") || "";
    const payload: any = {
      district_id: districtId, name, slug,
      category_id: categoryId || null,
      category: categoryFallback || (categories.find((c: any) => c.id === categoryId)?.name || "OTHER"),
      official_link: officialLink,
      warning_notes: warningNotes,
    };

    try {
      if (editingService) {
        await adminUpdateService(editingService.id, payload, token);
      } else {
        await adminCreateService(payload, token);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete service "${name}"?`)) return;
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      await adminDeleteService(id, token);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete.");
    }
  };

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcName.trim()) return;
    setQcSaving(true);
    try {
      const slug = qcSlug || qcName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ name: qcName, slug }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const data = await res.json();
      setCategoryId(data.id);
      setQuickCatOpen(false);
      setQcName("");
      setQcSlug("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setQcSaving(false);
    }
  };

  const getDistrictName = (districtId: string) => {
    const d = districts.find((d) => d.id === districtId);
    return d ? d.name : "Unknown";
  };

  const getCategoryName = (catId: string, fallback: string) => {
    if (!catId) return fallback || "Uncategorized";
    const c = categories.find((c: any) => c.id === catId);
    return c ? c.name : fallback || "Uncategorized";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Services</h1>
          <p className="text-xs text-slate-500">Manage service listings across all districts</p>
        </div>
        <button onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        ><Plus className="h-4 w-4" /> Add Service</button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-bold text-slate-500">No services found</p>
            <p className="text-xs text-slate-400 mt-1">Add your first service above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="p-4">Service Name</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{svc.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{getDistrictName(svc.district_id)}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        {getCategoryName(svc.category_id, svc.category)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        svc.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}>{svc.status}</span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEditModal(svc)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(svc.id, svc.name)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingService ? `Edit: ${editingService.name}` : "Add New Service"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District</label>
                <select required value={districtId} onChange={(e) => setDistrictId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select district...</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                  <input required type="text" value={name} onChange={handleNameChange}
                    placeholder="e.g. UPPCL Bill Payment"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slug</label>
                  <input required type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <div className="flex gap-1.5 mt-1.5">
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Select category...</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => { setQuickCatOpen(true); setQcName(""); setQcSlug(""); }}
                      className="rounded-xl border border-dashed border-slate-300 px-3 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:hover:border-blue-500"
                      title="Quick create category"
                    ><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Link (HTTPS)</label>
                  <input required type="url" value={officialLink} onChange={(e) => setOfficialLink(e.target.value)}
                    placeholder="https://"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warning Notes</label>
                <textarea rows={2} value={warningNotes} onChange={(e) => setWarningNotes(e.target.value)}
                  placeholder="Any warnings or disclaimers for this service..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >Cancel</button>
                <button type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >{editingService ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Category Modal */}
      {quickCatOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Quick Create Category</h3>
              <button onClick={() => setQuickCatOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleQuickCreateCategory} className="p-5 space-y-3">
              <input required type="text" value={qcName} onChange={(e) => {
                setQcName(e.target.value);
                setQcSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"));
              }} placeholder="Category name..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input type="text" value={qcSlug} onChange={(e) => setQcSlug(e.target.value)}
                placeholder="Slug (auto)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setQuickCatOpen(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                >Cancel</button>
                <button type="submit" disabled={qcSaving || !qcName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {qcSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
