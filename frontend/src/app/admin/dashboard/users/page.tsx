"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Shield, X, AlertCircle, User as UserIcon, Search, RefreshCw, CheckCircle, XCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ROLES = ["SUPER_ADMIN", "ADMIN", "STATE_MANAGER", "DISTRICT_EDITOR", "REVIEWER", "VIEWER"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "DISTRICT_EDITOR", is_active: true });
  const [currentUserRole, setCurrentUserRole] = useState("");

  const token = () => localStorage.getItem("token") || "";

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { setCurrentUserRole(localStorage.getItem("userRole") || ""); loadUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: "", full_name: "", password: "", role: "DISTRICT_EDITOR", is_active: true });
    setError(""); setModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setForm({ email: u.email, full_name: u.full_name, password: "", role: u.role, is_active: u.is_active });
    setError(""); setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      const url = editingUser ? `${API_BASE}/api/admin/users/${editingUser.id}` : `${API_BASE}/api/admin/users`;
      const method = editingUser ? "PUT" : "POST";
      const body: any = { email: form.email, full_name: form.full_name, role: form.role, is_active: form.is_active };
      if (form.password) body.password = form.password;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.text(); throw new Error(e); }
      setModalOpen(false); loadUsers();
    } catch (err: any) { setError(err.message); }
  };

  const toggleActive = async (u: any) => {
    try {
      await fetch(`${API_BASE}/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      loadUsers();
    } catch (err: any) { setError(err.message); }
  };

  const filtered = searchQuery ? users.filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())) : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Team Members</h1>
          <p className="text-xs text-slate-500">Manage users, roles, and permissions</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
          <Plus className="h-4.5 w-4.5" /> Add User
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-bold text-xs dark:from-blue-950 dark:to-indigo-950 dark:text-blue-400">
                          {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">{u.role.replace("_", " ")}</span>
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]"><XCircle className="h-3.5 w-3.5" /> Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                        {currentUserRole === "SUPER_ADMIN" && (
                          <button onClick={() => toggleActive(u)} className={`rounded-lg border p-2 ${u.is_active ? "border-amber-200 text-amber-500 hover:bg-amber-50 dark:border-amber-950/30" : "border-emerald-200 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-950/30"}`}>
                            {u.is_active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
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
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingUser ? "Edit User" : "Add Team Member"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input required type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
                {currentUserRole === "SUPER_ADMIN" ? (
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                  </select>
                ) : (
                  <div className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    {form.role.replace("_", " ")}
                  </div>
                )}
              </div>
              {currentUserRole === "SUPER_ADMIN" && (
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</span>
                </label>
              )}
              <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300">Cancel</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">{editingUser ? "Update" : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
