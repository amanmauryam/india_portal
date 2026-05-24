"use client";

import { useEffect, useState } from "react";
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle, User, Calendar, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", status: "PENDING", due_date: "" });

  const token = () => localStorage.getItem("token") || "";

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/tasks`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      if (!tasksRes.ok) throw new Error("Failed to load tasks");
      setTasks(await tasksRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: "", description: "", assigned_to: "", status: "PENDING", due_date: "" });
    setError(""); setModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingTask(t);
    setForm({ title: t.title, description: t.description || "", assigned_to: t.assigned_to || "", status: t.status, due_date: t.due_date ? t.due_date.slice(0, 10) : "" });
    setError(""); setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      const url = editingTask ? `${API_BASE}/api/admin/tasks/${editingTask.id}` : `${API_BASE}/api/admin/tasks`;
      const method = editingTask ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.text(); throw new Error(e); }
      setModalOpen(false); loadData();
    } catch (err: any) { setError(err.message); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch {}
  };

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  const statusIcon: Record<string, any> = { PENDING: Clock, IN_PROGRESS: ListTodo, COMPLETED: CheckCircle2, CANCELLED: AlertCircle };
  const statusColor: Record<string, string> = { PENDING: "text-amber-600 bg-amber-50 dark:bg-amber-950/20", IN_PROGRESS: "text-blue-600 bg-blue-50 dark:bg-blue-950/20", COMPLETED: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20", CANCELLED: "text-slate-400 bg-slate-50 dark:bg-slate-800" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-xs text-slate-500">Assign and track content work</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
          <Plus className="h-4.5 w-4.5" /> New Task
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5"><AlertCircle className="h-4.5 w-4.5 shrink-0" /><span>{error}</span></div>}

      <div className="flex gap-2 flex-wrap">
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-xl px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            filter === s ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          }`}>{s.replace("_", " ")}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No tasks found</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((task) => {
              const Icon = statusIcon[task.status] || Clock;
              const color = statusColor[task.status] || "";
              const assignee = users.find(u => u.id === task.assigned_to);
              return (
                <div key={task.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {assignee && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <User className="h-3 w-3" /> {assignee.full_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Calendar className="h-3 w-3" /> {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30" :
                            task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30" :
                            task.status === "CANCELLED" ? "bg-slate-100 text-slate-500 dark:bg-slate-800" :
                            "bg-amber-50 text-amber-700 dark:bg-amber-950/30"
                          }`}>{task.status.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>
                    <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} className="shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingTask ? "Edit Task" : "Create Task"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300">Cancel</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
