"use client";

import { useEffect, useState } from "react";
import { Shield, Save, AlertCircle, CheckCircle, Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ALL_PERMISSIONS = [
  { key: "create_content", label: "Create Content" },
  { key: "edit_content", label: "Edit Content" },
  { key: "delete_content", label: "Delete Content" },
  { key: "publish_content", label: "Publish Content" },
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_media", label: "Manage Media" },
  { key: "manage_districts", label: "Manage Districts" },
  { key: "manage_services", label: "Manage Services" },
  { key: "access_analytics", label: "Access Analytics" },
  { key: "manage_seo", label: "Manage SEO" },
  { key: "manage_ad_slots", label: "Manage Ad Slots" },
  { key: "view_audit_logs", label: "View Audit Logs" },
];

const ROLES = [
  { id: "SUPER_ADMIN", label: "Super Admin", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20" },
  { id: "ADMIN", label: "Admin", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
  { id: "STATE_MANAGER", label: "State Manager", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  { id: "DISTRICT_EDITOR", label: "District Editor", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
  { id: "REVIEWER", label: "Reviewer", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
  { id: "VIEWER", label: "Viewer", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/20" },
];

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/permissions`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPermissions(data);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // Default all permissions for SUPER_ADMIN, none for others
  const togglePermission = (roleId: string, permKey: string) => {
    setPermissions(prev => {
      const current = prev[roleId] || [];
      const updated = current.includes(permKey)
        ? current.filter(p => p !== permKey)
        : [...current, permKey];
      return { ...prev, [roleId]: updated };
    });
  };

  const toggleAllForRole = (roleId: string, enable: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: enable ? ALL_PERMISSIONS.map(p => p.key) : [],
    }));
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(permissions),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Permissions updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Permissions</h1>
          <p className="text-xs text-slate-500">Configure granular role-based access control</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Permissions"}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5"><AlertCircle className="h-4.5 w-4.5 shrink-0" /><span>{error}</span></div>}
      {success && <div className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-4 text-xs font-semibold text-emerald-500 flex items-start gap-2.5"><CheckCircle className="h-4.5 w-4.5 shrink-0" /><span>{success}</span></div>}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="p-4 w-48">Permission</th>
                {ROLES.map(role => (
                  <th key={role.id} className="p-4 text-center">
                    <span className={`rounded-full px-2 py-0.5 ${role.bg} ${role.color}`}>{role.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {ALL_PERMISSIONS.map(perm => (
                <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                  <td className="p-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{perm.label}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{perm.key}</p>
                  </td>
                  {ROLES.map(role => {
                    const enabled = permissions[role.id]?.includes(perm.key) || false;
                    return (
                      <td key={role.id} className="p-4 text-center">
                        <button
                          onClick={() => togglePermission(role.id, perm.key)}
                          className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all ${
                            enabled
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-slate-200 text-transparent hover:border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {enabled && <Shield className="h-3 w-3" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Toggle all rows */}
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20">
                <td className="p-4 font-bold text-xs text-slate-600 dark:text-slate-400">Toggle All</td>
                {ROLES.map(role => (
                  <td key={role.id} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => toggleAllForRole(role.id, true)} className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-950/30 dark:text-blue-400">All</button>
                      <button onClick={() => toggleAllForRole(role.id, false)} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">None</button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
