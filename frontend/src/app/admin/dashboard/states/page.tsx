"use client";

import { useEffect, useState } from "react";
import { getStates, adminCreateState, adminUpdateState, adminDeleteState } from "@/lib/api";
import { Plus, Edit3, Trash2, X, AlertCircle } from "lucide-react";

export default function AdminStatesPage() {
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<any>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const loadStates = async () => {
    setLoading(true);
    try {
      const data = await getStates();
      setStates(data?.items || []);
    } catch (err: any) {
      console.error("Failed to load states:", err);
      setError("Failed to fetch states directory from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStates();
  }, []);

  const openCreateModal = () => {
    setEditingState(null);
    setName("");
    setSlug("");
    setDescription("");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (state: any) => {
    setEditingState(state);
    setName(state.name);
    setSlug(state.slug);
    setDescription(state.description || "");
    setError("");
    setModalOpen(true);
  };

  // Auto generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingState) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const token = localStorage.getItem("token") || "";
    const payload = { name, slug, description };

    try {
      if (editingState) {
        await adminUpdateState(editingState.id, payload, token);
      } else {
        await adminCreateState(payload, token);
      }
      setModalOpen(false);
      loadStates();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the state.");
    }
  };

  const handleDelete = async (id: string, stateName: string) => {
    if (!confirm(`Are you sure you want to delete state "${stateName}"? This will delete all its districts and services recursively.`)) {
      return;
    }
    
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      await adminDeleteState(id, token);
      loadStates();
    } catch (err: any) {
      setError(err.message || "Failed to delete state. Ensure you have Super Admin permissions.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">States Directory Management</h1>
          <p className="text-xs text-slate-500">Manage high-level state directories and overview sheets</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-700"
        >
          <Plus className="h-4.5 w-4.5" />
          Add State
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* States Table List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading states data...</div>
        ) : states.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No states found. Add your first state above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {states.map((state) => (
                  <tr key={state.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{state.name}</td>
                    <td className="p-4 font-mono text-blue-605 dark:text-blue-400">{state.slug}</td>
                    <td className="p-4 max-w-xs truncate text-slate-500 dark:text-slate-400">{state.description || "-"}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(state)}
                        className="rounded-lg border border-slate-205 p-2 text-slate-650 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(state.id, state.name)}
                        className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pure CSS/JS Modal Overlays (Safe from package mismatches) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingState ? `Edit State: ${editingState.name}` : "Add New State"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Uttar Pradesh"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State URL Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. uttar-pradesh"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-905 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the state profile and high-level details..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Save State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
