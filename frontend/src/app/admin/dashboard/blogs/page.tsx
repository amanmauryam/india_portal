"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlogs, adminDeleteBlog } from "@/lib/api";
import { Plus, Edit3, Trash2, AlertCircle, Filter } from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "In Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  PUBLISHED: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

export default function AdminBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadBlogs = async (filter?: string) => {
    setLoading(true);
    try {
      const data = await getBlogs(filter);
      setBlogs(data?.items || []);
    } catch (err: any) {
      setError("Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBlogs(statusFilter); }, [statusFilter]);

  const handleDelete = async (id: string, blogTitle: string) => {
    if (!confirm(`Delete blog post "${blogTitle}"?`)) return;
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      await adminDeleteBlog(id, token);
      loadBlogs();
    } catch (err: any) {
      setError(err.message || "Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Blog Posts Management</h1>
          <p className="text-xs text-slate-500">Create and manage security advisories and utility guides</p>
        </div>
        <button onClick={() => router.push("/admin/dashboard/blogs/new")} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
          <Plus className="h-4.5 w-4.5" /> Add Blog Post
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === tab.value
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >{tab.label}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading blog posts...</div>
        ) : blogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No blog posts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="p-4">Title</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">{blog.title}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[blog.status] || STATUS_COLORS.DRAFT}`}>{blog.status}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{blog.author_name || "Unknown"}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(blog.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => router.push(`/admin/dashboard/blogs/${blog.slug || blog.id}`)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(blog.id, blog.title)} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
