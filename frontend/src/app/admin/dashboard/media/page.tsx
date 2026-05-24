"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Search, Trash2, Image as ImageIcon, Folder, X, AlertCircle, Copy, Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminMediaPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const token = () => localStorage.getItem("token") || "";

  const loadFiles = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`${API_BASE}/api/admin/media${q}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("Failed to load media");
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      setFiles(data);
      setError("");
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    }
    finally { if (requestId === requestIdRef.current) setLoading(false); }
  };

  useEffect(() => { loadFiles(); }, [searchQuery]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/admin/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      setUploading(false);
      loadFiles();
    } catch (err: any) { setError(err.message); setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await fetch(`${API_BASE}/api/admin/media/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      loadFiles();
    } catch (err: any) { setError(err.message); }
  };

  const fullUrl = (url: string) => url.startsWith("http") ? url : `${API_BASE}${url}`;

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(fullUrl(url));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const fileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Media Library</h1>
          <p className="text-xs text-slate-500">Upload and manage images for your pages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search files..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading media...</div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center dark:border-slate-800">
          <ImageIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
          {searchQuery ? (
            <>
              <p className="mt-3 text-sm font-bold text-slate-500">No results found</p>
              <p className="text-xs text-slate-400 mt-1">No files match &quot;{searchQuery}&quot;</p>
              <button onClick={() => setSearchQuery("")} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
                <X className="h-4 w-4" /> Clear search
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-bold text-slate-500">No media files</p>
              <p className="text-xs text-slate-400 mt-1">Upload images to use in your content blocks</p>
              <button onClick={() => fileInputRef.current?.click()} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
                <Upload className="h-4 w-4" /> Upload your first image
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div key={file.id} className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <div className="aspect-square bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url.startsWith("http") ? file.url : `${API_BASE}${file.url}`} alt={file.filename} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => copyUrl(file.url, file.id)} className="rounded-lg bg-white/90 p-2 text-slate-700 hover:bg-white shadow-lg">
                    {copiedId === file.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="rounded-lg bg-white/90 p-2 text-red-500 hover:bg-white shadow-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{file.filename}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{fileSize(file.file_size || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
