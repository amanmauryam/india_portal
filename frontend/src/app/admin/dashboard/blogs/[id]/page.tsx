"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import BlockEditor from "@/components/BlockEditor";
import {
  ArrowLeft, Save, Loader2, FileText, AlertCircle,
  Check, Send, X, Plus, History, LayoutTemplate, Layers, Box,
  Eye, Clock, Archive, BookOpen, CheckCircle2, Edit3, Globe,
  ListTree, MousePointerClick,
} from "lucide-react";
import { getBlogBySlug, adminCreateBlog } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Block {
  id: string;
  type: string;
  data: Record<string, any>;
  visible: boolean;
}

  const emptySeo = {
    meta_title: "", meta_description: "", og_image: "", og_title: "", og_description: "",
    canonical_url: "", robots: "index,follow", schema_markup: null,
  };

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ["PENDING_REVIEW", "ARCHIVED"],
  PENDING_REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"],
};

const TEMPLATE_TYPES = [
  { value: "DISTRICT_PAGE", label: "District Page" },
  { value: "SERVICE_PAGE", label: "Service Page" },
  { value: "BLOG_ARTICLE", label: "Blog Article" },
  { value: "GOVT_SCHEME", label: "Government Scheme" },
  { value: "UTILITY_GUIDE", label: "Utility Guide" },
];

const COMPONENT_TYPES = [
  { value: "FAQ", label: "FAQ Section", icon: ListTree },
  { value: "CTA", label: "CTA Section", icon: MousePointerClick },
  { value: "WARNING_BOX", label: "Warning Box", icon: AlertCircle },
  { value: "CONTACT_CARD", label: "Contact Card", icon: BookOpen },
  { value: "INFO_CARD", label: "Info Card", icon: FileText },
];

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [seo, setSeo] = useState(emptySeo);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({ message: "", type: "success", visible: false });
  const [error, setError] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [blogId, setBlogId] = useState<string | null>(null);

  // Template picker
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Reusable component picker
  const [showCompPicker, setShowCompPicker] = useState(false);
  const [components, setComponents] = useState<any[]>([]);
  const [loadingComps, setLoadingComps] = useState(false);

  // Version history
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  // Reusable component creator
  const [saveCompModal, setSaveCompModal] = useState(false);
  const [saveCompName, setSaveCompName] = useState("");
  const [saveCompType, setSaveCompType] = useState("FAQ");

  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 3000);
  }, []);

  useEffect(() => {
    if (isNew) return;
    const fetchBlog = async () => {
      try {
        const data = await getBlogBySlug(params.id as string);
        setTitle(data.title);
        setSlug(data.slug);
        setStatus(data.status || "DRAFT");
        setBlocks(data.content_blocks || []);
        setBlogId(data.id);
        setSeo({
          meta_title: data.meta_title || "", meta_description: data.meta_description || "",
          og_image: data.og_image || "", og_title: data.og_title || "", og_description: data.og_description || "",
          canonical_url: data.canonical_url || "", robots: data.robots || "index,follow",
          schema_markup: data.schema_markup || null,
        });
      } catch {
        setError("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [params.id, isNew]);

  // Auto-save every 30 seconds when not new
  useEffect(() => {
    if (isNew || !blogId || !title) return;
    autoSaveRef.current = setInterval(() => {
      handleSave(undefined, true);
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [blogId, isNew, title, status, blocks, seo]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSave = async (newStatus?: string, isAutoSave = false) => {
    const targetStatus = newStatus || status;
    setSaving(true);
    setError("");
    const token = localStorage.getItem("token") || "";
    const payload: any = {
      title, slug, status: targetStatus,
      content_blocks: blocks,
      meta_title: seo.meta_title, meta_description: seo.meta_description,
      og_image: seo.og_image, og_title: seo.og_title, og_description: seo.og_description,
      canonical_url: seo.canonical_url, robots: seo.robots,
      schema_markup: seo.schema_markup,
    };
    if (reviewerNotes) payload.reviewer_notes = reviewerNotes;

    try {
      let id = blogId;
      if (isNew) {
        const created = await adminCreateBlog(payload, token);
        id = created.id;
        setBlogId(id);
        showToast("Blog post created!", "success");
        router.push(`/admin/dashboard/blogs/${id}`);
        return;
      }
      const res = await fetch(`${API_BASE}/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed to save"); }
      if (!isAutoSave) { showToast("Blog post saved!", "success"); }
      if (targetStatus !== status) setStatus(targetStatus);
      setReviewerNotes("");

      // Save content version
      await fetch(`${API_BASE}/api/admin/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          entity_type: "BLOG",
          entity_id: id,
          content_data: { title, slug, content_blocks: blocks, ...seo },
          version_note: targetStatus === status ? "Auto-saved" : `Status changed to ${targetStatus}`,
        }),
      });
    } catch (err: any) {
      setError(err.message);
      if (!isAutoSave) showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`${API_BASE}/api/templates`);
      const data = await res.json();
      setTemplates(data || []);
      setShowTemplatePicker(true);
    } catch { showToast("Failed to load templates", "error"); }
    finally { setLoadingTemplates(false); }
  };

  const applyTemplate = (tpl: any) => {
    if (tpl.content_blocks) {
      setBlocks(tpl.content_blocks.map((b: any) => ({
        ...b, id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, visible: true,
      })));
    }
    if (tpl.seo) setSeo({ ...emptySeo, ...tpl.seo });
    setShowTemplatePicker(false);
    showToast(`Template "${tpl.name}" applied`);
  };

  // Load reusable components
  const loadComponents = async () => {
    setLoadingComps(true);
    try {
      const res = await fetch(`${API_BASE}/api/reusable-components`);
      const data = await res.json();
      setComponents(data || []);
      setShowCompPicker(true);
    } catch { showToast("Failed to load components", "error"); }
    finally { setLoadingComps(false); }
  };

  const insertComponent = (comp: any) => {
    const cd = comp.content_data || {};
    const newBlock: Block = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: cd.type || "callout",
      data: cd.data || cd,
      visible: true,
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowCompPicker(false);
    showToast(`Component "${comp.name}" inserted`);
  };

  const saveAsComponent = async () => {
    if (!saveCompName.trim() || !blocks.length) return;
    const token = localStorage.getItem("token") || "";
    try {
      const res = await fetch(`${API_BASE}/api/admin/reusable-components`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: saveCompName,
          component_type: saveCompType,
          content_data: { type: "component_group", blocks: blocks.slice(0, 3) },
        }),
      });
      if (!res.ok) throw new Error("Failed to save component");
      showToast("Saved as reusable component");
      setSaveCompModal(false);
      setSaveCompName("");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  // Load versions
  const loadVersions = async () => {
    if (!blogId) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/api/admin/versions?entity_type=BLOG&entity_id=${blogId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVersions(data || []);
      setShowVersions(true);
    } catch { showToast("Failed to load versions", "error"); }
  };

  const restoreVersion = async (versionId: string) => {
    const token = localStorage.getItem("token") || "";
    try {
      const res = await fetch(`${API_BASE}/api/admin/versions/${versionId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Restore failed");
      showToast("Version restored! Reloading...");
      setShowVersions(false);
      setTimeout(() => loadBlog(), 500);
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const loadBlog = async () => {
    if (!blogId) return;
    try {
      const data = await getBlogBySlug(blogId);
      setTitle(data.title);
      setSlug(data.slug);
      setStatus(data.status || "DRAFT");
      setBlocks(data.content_blocks || []);
    } catch { showToast("Failed to reload", "error"); }
  };

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: Edit3 },
    PENDING_REVIEW: { label: "In Review", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400", icon: Clock },
    APPROVED: { label: "Approved", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400", icon: CheckCircle2 },
    PUBLISHED: { label: "Published", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400", icon: Globe },
    ARCHIVED: { label: "Archived", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500", icon: Archive },
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-bold">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
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

      {/* Top bar */}
      <div className="sticky top-0 z-40 -mx-6 -mt-6 mb-6 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/admin/dashboard/blogs")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            ><ArrowLeft className="h-4 w-4" /></button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Blog post title..."
                  className="w-full min-w-[200px] bg-transparent text-lg font-extrabold text-slate-900 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600"
                />
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusLabels[status]?.color || statusLabels.DRAFT.color}`}>
                  {statusLabels[status]?.icon && createElement(statusLabels[status].icon, { className: "h-3 w-3" })}
                  {statusLabels[status]?.label || status}
                </span>
              </div>
              {slug && (
                <p className="truncate text-[10px] text-slate-400">/blogs/{slug}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Template button */}
            <button type="button" onClick={loadTemplates}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            ><LayoutTemplate className="h-3.5 w-3.5" /> Template</button>

            {/* Reusable components */}
            <button type="button" onClick={loadComponents}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            ><Box className="h-3.5 w-3.5" /> Components</button>

            {/* Save as component */}
            {blocks.length > 0 && (
              <button type="button" onClick={() => setSaveCompModal(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-slate-600"
                title="Save as reusable component"
              ><Plus className="h-3 w-3" /></button>
            )}

            {/* Version history */}
            {blogId && (
              <button type="button" onClick={loadVersions}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              ><History className="h-3.5 w-3.5" /> Versions</button>
            )}

            {/* Workflow actions */}
            {STATUS_FLOW[status]?.map((nextStatus: string) => {
              const nextLabel: Record<string, string> = {
                PENDING_REVIEW: "Submit for Review",
                APPROVED: "Approve",
                PUBLISHED: "Publish",
                ARCHIVED: "Archive",
                DRAFT: "Back to Draft",
              };
              const nextColor: Record<string, string> = {
                PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-400",
                APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400",
                PUBLISHED: "bg-blue-600 text-white hover:bg-blue-700",
                ARCHIVED: "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700",
                DRAFT: "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700",
              };
              return (
                <button key={nextStatus} onClick={() => handleSave(nextStatus)} disabled={saving || !title}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-50 ${nextColor[nextStatus]}`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{nextLabel[nextStatus] || nextStatus}</span>
                </button>
              );
            })}

            <button onClick={() => handleSave()} disabled={saving || !title}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isNew ? "Create" : "Save"}
            </button>
          </div>
        </div>

        {/* Reviewer notes input */}
        {status === "PENDING_REVIEW" && (
          <div className="mt-2 flex items-center gap-2">
            <input type="text" value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Add reviewer notes or feedback..."
              className="flex-1 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-1.5 text-xs outline-none focus:border-amber-400 dark:border-amber-800/30 dark:bg-amber-950/10"
            />
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="max-w-4xl mx-auto">
        <BlockEditor blocks={blocks} onChange={setBlocks} seo={seo} onSeoChange={setSeo} />
      </div>

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-blue-500" /> Choose Template
              </h3>
              <button onClick={() => setShowTemplatePicker(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
              ) : templates.length === 0 ? (
                <div className="py-12 text-center">
                  <LayoutTemplate className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-500">No templates yet</p>
                  <p className="text-xs text-slate-400">Admins can create templates from the dashboard</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map(tpl => (
                    <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                      className="text-left rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:hover:border-blue-600"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <LayoutTemplate className="h-4 w-4 text-blue-500" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tpl.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2">{TEMPLATE_TYPES.find(t => t.value === tpl.template_type)?.label || tpl.template_type}</p>
                      {tpl.description && <p className="text-xs text-slate-500 line-clamp-2">{tpl.description}</p>}
                      <p className="text-[10px] text-slate-400 mt-2">{tpl.content_blocks?.length || 0} blocks</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reusable Components Picker */}
      {showCompPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Box className="h-4 w-4 text-purple-500" /> Reusable Components
              </h3>
              <button onClick={() => setShowCompPicker(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingComps ? (
                <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading...</div>
              ) : components.length === 0 ? (
                <div className="py-12 text-center">
                  <Box className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-500">No reusable components</p>
                  <p className="text-xs text-slate-400">Save content blocks as reusable components to use them across articles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map(comp => (
                    <button key={comp.id} type="button" onClick={() => insertComponent(comp)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-purple-200 hover:bg-purple-50 dark:border-slate-700 dark:hover:border-purple-600 dark:hover:bg-purple-950/20"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                        <Box className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{comp.name}</p>
                        <p className="text-[10px] text-slate-400">{comp.component_type}</p>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-purple-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-500" /> Version History
              </h3>
              <button onClick={() => setShowVersions(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {versions.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-500">No versions yet</p>
                  <p className="text-xs text-slate-400">Versions are created automatically when you save</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{v.version_note || "Version saved"}</p>
                        <p className="text-[10px] text-slate-400">{v.created_by_name || "Unknown"} &middot; {new Date(v.created_at).toLocaleString()}</p>
                      </div>
                      <button type="button" onClick={() => restoreVersion(v.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:border-slate-600 dark:text-indigo-400"
                      >Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save as Component Modal */}
      {saveCompModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Save as Component</h3>
              <button onClick={() => setSaveCompModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" value={saveCompName} onChange={(e) => setSaveCompName(e.target.value)}
                placeholder="Component name..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <select value={saveCompType} onChange={(e) => setSaveCompType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {COMPONENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
              <p className="text-[10px] text-slate-400">Saves first {Math.min(blocks.length, 3)} blocks as reusable component</p>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setSaveCompModal(false)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >Cancel</button>
                <button type="button" onClick={saveAsComponent} disabled={!saveCompName.trim()}
                  className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                >Save Component</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function createElement(Icon: any, props: any) {
  return <Icon {...props} />;
}
