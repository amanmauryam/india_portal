"use client";

import { useEffect, useState, useCallback } from "react";
import { getVerifiedPortals, adminCreateVerifiedPortal, adminUpdateVerifiedPortal, adminDeleteVerifiedPortal } from "@/lib/api";
import { Plus, Edit3, Trash2, X, AlertCircle, Loader2, ExternalLink, ShieldCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminVerifiedPortalsPage() {
  const [portals, setPortals] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPortal, setEditingPortal] = useState<any>(null);
  const [filterDistrict, setFilterDistrict] = useState("");

  const [districtId, setDistrictId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const [portalData, distData] = await Promise.all([
        getVerifiedPortals(filterDistrict || undefined, token),
        fetch(`${API_BASE}/api/districts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      ]);
      setPortals(portalData || []);
      setDistricts(distData || []);
    } catch (err: any) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [filterDistrict]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreateModal = () => {
    setEditingPortal(null);
    setDistrictId("");
    setName("");
    setUrl("");
    setCategory("OTHER");
    setDescription("");
    setIsActive(true);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPortal(p);
    setDistrictId(p.district_id);
    setName(p.name);
    setUrl(p.url);
    setCategory(p.category);
    setDescription(p.description || "");
    setIsActive(p.is_active);
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token") || "";
    const payload: any = {
      district_id: districtId,
      name,
      url,
      category: category || "OTHER",
      description: description || null,
      is_active: isActive,
    };

    try {
      if (editingPortal) {
        await adminUpdateVerifiedPortal(editingPortal.id, payload, token);
      } else {
        await adminCreateVerifiedPortal(payload, token);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete verified portal "${name}"?`)) return;
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      await adminDeleteVerifiedPortal(id, token);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete.");
    }
  };

  const getDistrictName = (id: string) => {
    const d = districts.find((d: any) => d.id === id);
    return d ? d.name : "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Verified Utility Portals</h1>
          <p className="text-xs text-slate-500">Manage verified/official utility portals for each district</p>
        </div>
        <button onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        ><Plus className="h-4 w-4" /> Add Portal</button>
      </div>

      {/* District Filter */}
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by District</label>
        <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Districts</option>
          {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading verified portals...</div>
        ) : portals.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-500">No verified portals found</p>
            <p className="text-xs text-slate-400 mt-1">Add verified utility portals for districts above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="p-4">Portal Name</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">URL</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {portals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{getDistrictName(p.district_id)}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {p.url.length > 40 ? p.url.substring(0, 40) + "..." : p.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}>{p.is_active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEditModal(p)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30"><Trash2 className="h-4 w-4" /></button>
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
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingPortal ? `Edit: ${editingPortal.name}` : "Add Verified Portal"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District</label>
                <select required value={districtId} onChange={(e) => setDistrictId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select district...</option>
                  {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. UPPCL Online Bill Payment"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal URL</label>
                <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="WATER">Water</option>
                    <option value="GAS">Gas</option>
                    <option value="GOVERNMENT">Government</option>
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="HEALTH">Health</option>
                    <option value="EDUCATION">Education</option>
                    <option value="TAX">Tax</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <div className="mt-1.5 flex items-center gap-3 h-full">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this portal offers..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >Cancel</button>
                <button type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >{editingPortal ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
