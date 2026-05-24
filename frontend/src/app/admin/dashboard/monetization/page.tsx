"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, X, AlertCircle, DollarSign } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const PAGE_TYPES = ["state", "district", "service", "blog", "global"];

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function AdminMonetizationPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);

  const [pageType, setPageType] = useState("global");
  const [position, setPosition] = useState("sidebar");
  const [adCode, setAdCode] = useState("");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ad-slots`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load ad slots");
      setSlots(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, []);

  const openCreateModal = () => {
    setEditingSlot(null);
    setPageType("global");
    setPosition("sidebar");
    setAdCode("");
    setPriority(0);
    setIsActive(true);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (slot: any) => {
    setEditingSlot(slot);
    setPageType(slot.page_type);
    setPosition(slot.position);
    setAdCode(slot.ad_code || "");
    setPriority(slot.priority);
    setIsActive(slot.is_active);
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = { page_type: pageType, position, ad_code: adCode, priority: Number(priority), is_active: isActive };

    try {
      const url = editingSlot
        ? `${API_BASE}/api/admin/ad-slots/${editingSlot.id}`
        : `${API_BASE}/api/admin/ad-slots`;
      const res = await fetch(url, {
        method: editingSlot ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.text();
        throw new Error(errData || "Failed to save ad slot");
      }
      setModalOpen(false);
      loadSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad slot?")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/ad-slots/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      loadSlots();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Monetization — Ad Slots</h1>
          <p className="text-xs text-slate-500">Manage sponsored placements and monetization slots</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">
          <Plus className="h-4.5 w-4.5" /> <DollarSign className="h-4 w-4" /> Add Ad Slot
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ad slots...</div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No ad slots yet. Add your first placement.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="p-4">Page</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Content Preview</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-white capitalize">{slot.page_type}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{slot.position}</td>
                    <td className="p-4"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800">{slot.priority}</span></td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        slot.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}>{slot.is_active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{slot.ad_code?.substring(0, 60)}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEditModal(slot)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(slot.id)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingSlot ? "Edit Ad Slot" : "New Ad Slot"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page Type</label>
                  <select value={pageType} onChange={(e) => setPageType(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    {PAGE_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Position</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    <option value="sidebar">Sidebar</option>
                    <option value="banner">Banner</option>
                    <option value="inline">Inline</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ad Code / Content</label>
                <textarea required rows={3} value={adCode} onChange={(e) => setAdCode(e.target.value)} placeholder="HTML or text ad content" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</span>
              </label>
              <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
