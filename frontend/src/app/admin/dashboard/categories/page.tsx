"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, X, Edit3, Trash2, Search, ChevronDown, ChevronRight, GripVertical,
  AlertCircle, Check, FolderTree, Tag, Eye, EyeOff, Save, ArrowUpDown,
  Loader2, Copy, Layers, Move
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  icon?: string;
  sort_order: number;
  status: string;
  created_at: string;
  service_count?: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({ message: "", type: "success", visible: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [moveTargetId, setMoveTargetId] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParent, setFormParent] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formSort, setFormSort] = useState(0);
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 3000);
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/categories?flat=true`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setFlatCategories(data || []);

      const treeRes = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
      const treeData = await treeRes.json();
      setCategories(treeData || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const getToken = () => localStorage.getItem("token") || "";

  const openCreate = () => {
    setEditing(null);
    setFormName(""); setFormSlug(""); setFormDescription(""); setFormParent(""); setFormIcon(""); setFormSort(0); setFormStatus("ACTIVE");
    setFormError(""); setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setFormName(cat.name); setFormSlug(cat.slug); setFormDescription(cat.description || ""); setFormParent(cat.parent_id || ""); setFormIcon(cat.icon || ""); setFormSort(cat.sort_order); setFormStatus(cat.status);
    setFormError(""); setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editing) setFormSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      const token = getToken();
      const payload = {
        name: formName, slug: formSlug, description: formDescription,
        parent_id: formParent || null, icon: formIcon, sort_order: formSort, status: formStatus,
      };

      if (editing) {
        const res = await fetch(`${API_BASE}/api/admin/categories/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Update failed"); }
        showToast("Category updated");
      } else {
        const res = await fetch(`${API_BASE}/api/admin/categories`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Create failed"); }
        showToast("Category created");
      }
      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const params = moveTargetId ? `?move_to_id=${moveTargetId}` : "";
      const res = await fetch(`${API_BASE}/api/admin/categories/${deleteConfirm.id}${params}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Delete failed"); }
      showToast("Category deleted");
      setDeleteConfirm(null);
      setMoveTargetId("");
      loadCategories();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const filtered = categories.filter(c => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.slug?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const renderTree = (cats: Category[], depth = 0) => {
    return cats.map(cat => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded.has(cat.id);
      const isSelected = selected.has(cat.id);
      return (
        <div key={cat.id}>
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
              isSelected ? "bg-blue-50 dark:bg-blue-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
            style={{ paddingLeft: `${16 + depth * 24}px` }}
          >
            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(cat.id)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            {hasChildren ? (
              <button onClick={() => toggleExpand(cat.id)} className="p-0.5 text-slate-400 hover:text-slate-600">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : <div className="w-4" />}
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300 cursor-grab" />
            <span className={`text-sm font-bold flex-1 ${cat.status === "INACTIVE" ? "text-slate-400" : "text-slate-900 dark:text-white"}`}>
              {cat.name}
            </span>
            {cat.service_count !== undefined && cat.service_count > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                {cat.service_count}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              cat.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
            }`}>{cat.status}</span>
            <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setDeleteConfirm(cat)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {hasChildren && isExpanded && renderTree(cat.children!, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <div className={`fixed top-4 right-4 z-[999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur-sm transition-all duration-300 ${
        toast.visible
          ? toast.type === "success"
            ? "translate-y-0 opacity-100 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "translate-y-0 opacity-100 border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300"
          : "-translate-y-4 opacity-0 pointer-events-none"
      }`}>
        {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {toast.message}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Categories</h1>
          <p className="text-xs text-slate-500">Manage service categories, hierarchy, and ordering</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        ><Plus className="h-4 w-4" /> Create Category</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
          </div>
        )}
      </div>

      {/* Tree / List */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm font-bold">Loading categories...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FolderTree className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-bold text-slate-500">No categories found</p>
            <p className="text-xs text-slate-400">Create your first category to organize services</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50/50 dark:bg-blue-950/10">
                <span className="text-xs font-bold text-slate-600 mr-2">Bulk:</span>
                <button onClick={async () => {
                  const res = await fetch(`${API_BASE}/api/admin/categories/bulk`, {
                    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ ids: [...selected], action: "activate" }),
                  });
                  if (res.ok) { showToast(`${selected.size} categories activated`); setSelected(new Set()); loadCategories(); }
                }} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">Activate</button>
                <button onClick={async () => {
                  const res = await fetch(`${API_BASE}/api/admin/categories/bulk`, {
                    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ ids: [...selected], action: "deactivate" }),
                  });
                  if (res.ok) { showToast(`${selected.size} categories deactivated`); setSelected(new Set()); loadCategories(); }
                }} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100">Deactivate</button>
                <button onClick={() => {
                  if (!confirm(`Delete ${selected.size} categories?`)) return;
                  fetch(`${API_BASE}/api/admin/categories/bulk`, {
                    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ ids: [...selected], action: "delete" }),
                  }).then(res => { if (res.ok) { showToast(`${selected.size} categories deleted`); setSelected(new Set()); loadCategories(); }});
                }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-100">Delete</button>
              </div>
            )}
            <div className="p-2">
              {renderTree(filtered)}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editing ? "Edit Category" : "Create Category"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
                  <AlertCircle className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />{formError}
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name *</label>
                <input required type="text" value={formName} onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Electricity, Water, Gas"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slug</label>
                <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated from name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Category</label>
                  <select value={formParent} onChange={(e) => setFormParent(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">None (Top Level)</option>
                    {flatCategories.filter(c => c.id !== editing?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Order</label>
                  <input type="number" min={0} value={formSort} onChange={(e) => setFormSort(parseInt(e.target.value) || 0)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Icon (lucide name)</label>
                  <input type="text" value={formIcon} onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="e.g. Zap, Droplets"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >Cancel</button>
                <button type="submit" disabled={saving || !formName}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Delete &quot;{deleteConfirm.name}&quot;?</h3>
              {deleteConfirm.service_count && deleteConfirm.service_count > 0 ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-bold">
                    This category is assigned to {deleteConfirm.service_count} service(s).
                  </p>
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Move services to:</label>
                    <select value={moveTargetId} onChange={(e) => setMoveTargetId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="">Delete category only (services lose category)</option>
                      {flatCategories.filter(c => c.id !== deleteConfirm.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
              )}
              <div className="mt-5 flex justify-center gap-3">
                <button onClick={() => { setDeleteConfirm(null); setMoveTargetId(""); }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >Cancel</button>
                <button onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700"
                >Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
