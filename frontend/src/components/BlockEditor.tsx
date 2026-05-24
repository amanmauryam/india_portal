"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  GripVertical, Heading1,
  Text, Quote, Info, TriangleAlert, Bell, ShieldAlert, Highlighter,
  Image, Images, RectangleHorizontal, Video, Columns2, Columns3, Grid3x3,
  LayoutGrid, CheckSquare, HelpCircle, Link, MousePointerClick, ListTree,
  MapPin, Train, ShoppingBag, Factory, PhoneCall, SunDim, Search,
  Plus, Trash2, Copy, Eye, EyeOff, ArrowUp, ArrowDown, ChevronDown, ChevronRight,
  Monitor, Tablet, Smartphone, X, Check, PanelRightClose, Menu,
  Bold, Italic, Underline, List, ListOrdered, Table, Type,
  Star, FileText
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  data: Record<string, any>;
  visible: boolean;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
    og_title?: string;
    og_description?: string;
    canonical_url?: string;
    robots?: string;
    schema_markup?: any;
  };
  onSeoChange?: (seo: any) => void;
}

function generateId() {
  return `blk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

function defaultData(type: string): Record<string, any> {
  switch (type) {
    case "heading": return { level: 2, text: "" };
    case "paragraph": return { text: "" };
    case "rich_text": return { html: "" };
    case "quote": return { text: "", author: "" };
    case "callout": return { variant: "info", text: "" };
    case "note": return { text: "" };
    case "warning": return { text: "" };
    case "bullet_list": return { items: [{ text: "" }] };
    case "numbered_list": return { items: [{ text: "" }] };
    case "table": return { headers: ["Column 1", "Column 2"], rows: [["", ""]] };
    case "highlighted_text": return { text: "", color: "yellow" };
    case "image": return { url: "", caption: "", alt: "" };
    case "image_gallery": return { images: [{ url: "", caption: "" }] };
    case "hero_banner": return { url: "", overlay_text: "", overlay_subtitle: "", overlay_align: "center" };
    case "video_embed": return { url: "", aspect_ratio: "16/9", caption: "" };
    case "one_column": return { blocks: [] };
    case "two_column": return { left_blocks: [], right_blocks: [], ratio: "1/1" };
    case "three_column": return { col1_blocks: [], col2_blocks: [], col3_blocks: [] };
    case "grid_layout": return { columns: 3, blocks: [] };
    case "card_layout": return { cards: [{ image: "", title: "", description: "" }] };
    case "faq": return { items: [{ question: "", answer: "" }] };
    case "breadcrumb": return { items: [{ label: "", href: "" }] };
    case "related_links": return { links: [{ title: "", url: "" }] };
    case "cta": return { text: "Learn More", url: "", variant: "primary" };
    case "table_of_contents": return { title: "Table of Contents" };
    case "divider": return { style: "solid" };
    case "spacer": return { height: 32 };
    case "district_facts": return { facts: [{ label: "", value: "" }] };
    case "railway_stations": return { stations: [{ name: "", code: "", zone: "" }] };
    case "emergency_contacts": return { contacts: [{ service: "", number: "", description: "" }] };
    case "odop_section": return { product_name: "", description: "", image: "" };
    case "industries_section": return { industries: [{ name: "", description: "" }] };
    case "tourist_places": return { places: [{ name: "", description: "", image: "" }] };
    case "popular_searches": return { searches: [{ term: "", count: 0 }] };
    default: return {};
  }
}

const BLOCK_CATEGORIES = [
  {
    label: "Text", icon: Type,
    types: [
      { type: "heading", label: "Heading", desc: "H1 to H6", icon: Heading1 },
      { type: "paragraph", label: "Paragraph", desc: "Plain text", icon: Text },
      { type: "rich_text", label: "Rich Text", desc: "Formatted text", icon: FileText },
      { type: "bullet_list", label: "Bullet List", desc: "Unordered list", icon: List },
      { type: "numbered_list", label: "Numbered List", desc: "Ordered list", icon: ListOrdered },
      { type: "table", label: "Table", desc: "Data table", icon: Table },
      { type: "quote", label: "Quote", desc: "Blockquote with author", icon: Quote },
      { type: "callout", label: "Callout", desc: "Info/Success/Warning/Danger", icon: Info },
      { type: "note", label: "Note", desc: "Blue note box", icon: Bell },
      { type: "warning", label: "Warning", desc: "Amber warning box", icon: TriangleAlert },
      { type: "highlighted_text", label: "Highlight", desc: "Highlighted text", icon: Highlighter },
    ]
  },
  {
    label: "Media", icon: Image,
    types: [
      { type: "image", label: "Image", desc: "Single image", icon: Image },
      { type: "image_gallery", label: "Gallery", desc: "Image grid", icon: Images },
      { type: "hero_banner", label: "Hero Banner", desc: "Full-width banner", icon: RectangleHorizontal },
      { type: "video_embed", label: "Video", desc: "YouTube/Vimeo embed", icon: Video },
    ]
  },
  {
    label: "Layout", icon: LayoutGrid,
    types: [
      { type: "one_column", label: "1 Column", desc: "Full width", icon: Columns2 },
      { type: "two_column", label: "2 Columns", desc: "Side by side", icon: Columns2 },
      { type: "three_column", label: "3 Columns", desc: "Three across", icon: Columns3 },
      { type: "grid_layout", label: "Grid", desc: "Configurable grid", icon: Grid3x3 },
      { type: "card_layout", label: "Cards", desc: "Card grid", icon: LayoutGrid },
      { type: "divider", label: "Divider", desc: "Horizontal rule", icon: MinusIcon },
      { type: "spacer", label: "Spacer", desc: "Vertical space", icon: ArrowDown },
    ]
  },
  {
    label: "SEO & Navigation", icon: MousePointerClick,
    types: [
      { type: "faq", label: "FAQ", desc: "Q&A accordion", icon: HelpCircle },
      { type: "breadcrumb", label: "Breadcrumb", desc: "Nav trail", icon: ListTree },
      { type: "related_links", label: "Related Links", desc: "Link list", icon: Link },
      { type: "cta", label: "CTA Button", desc: "Call to action", icon: MousePointerClick },
      { type: "table_of_contents", label: "TOC", desc: "Auto-generated", icon: ListTree },
    ]
  },
  {
    label: "Hyperlocal Data", icon: MapPin,
    types: [
      { type: "district_facts", label: "District Facts", desc: "Key-value table", icon: MapPin },
      { type: "railway_stations", label: "Railway Stations", desc: "Station table", icon: Train },
      { type: "emergency_contacts", label: "Emergency", desc: "Contact list", icon: PhoneCall },
      { type: "odop_section", label: "ODOP", desc: "One District One Product", icon: ShoppingBag },
      { type: "industries_section", label: "Industries", desc: "Industry cards", icon: Factory },
      { type: "tourist_places", label: "Tourist Places", desc: "Place cards", icon: SunDim },
      { type: "popular_searches", label: "Trending", desc: "Top searches", icon: Search },
    ]
  },
];

const CALLOUT_VARIANTS = [
  { value: "info", label: "Info", icon: Info, color: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300" },
  { value: "success", label: "Success", icon: CheckSquare, color: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" },
  { value: "warning", label: "Warning", icon: TriangleAlert, color: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300" },
  { value: "danger", label: "Danger", icon: ShieldAlert, color: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300" },
];

const HIGHLIGHT_COLORS = [
  { value: "yellow", label: "Yellow", class: "bg-yellow-200 text-yellow-900 dark:bg-yellow-800/40 dark:text-yellow-200" },
  { value: "green", label: "Green", class: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800/40 dark:text-emerald-200" },
  { value: "blue", label: "Blue", class: "bg-blue-200 text-blue-900 dark:bg-blue-800/40 dark:text-blue-200" },
  { value: "pink", label: "Pink", class: "bg-pink-200 text-pink-900 dark:bg-pink-800/40 dark:text-pink-200" },
  { value: "purple", label: "Purple", class: "bg-purple-200 text-purple-900 dark:bg-purple-800/40 dark:text-purple-200" },
];

const CTA_VARIANTS = [
  { value: "primary", label: "Primary", class: "bg-blue-600 hover:bg-blue-700 text-white shadow-md" },
  { value: "secondary", label: "Secondary", class: "bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white" },
  { value: "outline", label: "Outline", class: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400" },
  { value: "ghost", label: "Ghost", class: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30" },
];

function MinusIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

export default function BlockEditor({ blocks, onChange, seo, onSeoChange }: BlockEditorProps) {
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [seoOpen, setSeoOpen] = useState(!!seo?.meta_title);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [draggingBlockType, setDraggingBlockType] = useState<string | null>(null);
  const [addingMenu, setAddingMenu] = useState<"top" | "bottom" | number | null>(null);
  const [addingFilter, setAddingFilter] = useState("");
  const addMenuRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  }, []);

  const addBlock = useCallback((type: string, index?: number) => {
    const block: Block = { id: generateId(), type, data: defaultData(type), visible: true };
    const next = [...blocks];
    if (typeof index === "number") next.splice(index, 0, block);
    else next.push(block);
    onChange(next);
    setAddingMenu(null);
    setAddingFilter("");
    showToast(`Added ${type.replace(/_/g, " ")}`);
  }, [blocks, onChange, showToast]);

  const updateBlock = useCallback((id: string, patch: Record<string, any>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...patch } } : b));
  }, [blocks, onChange]);

  const setBlockArr = useCallback((id: string, field: string, arr: any[]) => {
    onChange(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, [field]: arr } } : b));
  }, [blocks, onChange]);

  const addBlockArr = useCallback((id: string, field: string, template: Record<string, any>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, [field]: [...(b.data[field] || []), template] } } : b));
  }, [blocks, onChange]);

  const rmBlockArr = useCallback((id: string, field: string, idx: number) => {
    onChange(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, [field]: (b.data[field] || []).filter((_: any, i: number) => i !== idx) } } : b));
  }, [blocks, onChange]);

  const duplicateBlock = useCallback((idx: number) => {
    const next = [...blocks];
    const copy = { ...next[idx], id: generateId(), data: JSON.parse(JSON.stringify(next[idx].data)) };
    next.splice(idx + 1, 0, copy);
    onChange(next);
    showToast("Block duplicated");
  }, [blocks, onChange, showToast]);

  const deleteBlock = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id));
    showToast("Block deleted");
  }, [blocks, onChange, showToast]);

  const toggleVisibility = useCallback((id: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b));
  }, [blocks, onChange]);

  const moveBlock = useCallback((idx: number, dir: "up" | "down") => {
    if ((dir === "up" && idx === 0) || (dir === "down" && idx === blocks.length - 1)) return;
    const next = [...blocks];
    const tgt = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    onChange(next);
  }, [blocks, onChange]);

  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...blocks];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const handleAddMenuToggle = (pos: "top" | "bottom" | number | null) => {
    setAddingMenu(prev => prev === pos ? null : pos);
    setAddingFilter("");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddingMenu(null);
        setAddingFilter("");
      }
    };
    if (addingMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [addingMenu]);

  const filteredCategories = useMemo(() => {
    if (!addingFilter) return BLOCK_CATEGORIES;
    const f = addingFilter.toLowerCase();
    return BLOCK_CATEGORIES.map(cat => ({
      ...cat,
      types: cat.types.filter(t => t.label.toLowerCase().includes(f) || t.type.toLowerCase().includes(f) || t.desc.toLowerCase().includes(f))
    })).filter(cat => cat.types.length > 0);
  }, [addingFilter]);

  const updateSeo = (field: string, value: any) => {
    if (onSeoChange) onSeoChange({ ...seo, [field]: value });
  };

  const previewWidth = previewMode === "mobile" ? "max-w-[400px]" : previewMode === "tablet" ? "max-w-[768px]" : "max-w-none";

  return (
    <div className="relative">
      {/* Toast */}
      <div className={`fixed top-4 right-4 z-[999] flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 ${toast.visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}>
        <Check className="h-4 w-4" />
        {toast.message}
      </div>

      {/* Top Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
          <LayoutGrid className="h-4 w-4 text-blue-600" />
          Content Editor
        </h3>
        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {[
              { mode: "desktop" as const, icon: Monitor },
              { mode: "tablet" as const, icon: Tablet },
              { mode: "mobile" as const, icon: Smartphone },
            ].map(({ mode, icon: Icon }) => (
              <button key={mode} type="button" onClick={() => setPreviewMode(mode)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
                  previewMode === mode
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Canvas */}
      <div>
        <div className="space-y-0">
          {/* Top add button */}
          <div className="group relative flex items-center justify-center py-0.5">
            <div className="absolute inset-x-0 h-px bg-transparent group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors" />
            <button type="button" onClick={() => handleAddMenuToggle("top")}
              className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
            ><Plus className="h-3.5 w-3.5" /></button>
          </div>

          {/* Blocks */}
          {blocks.length === 0 && addingMenu !== "top" ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-8 py-16 text-center dark:border-slate-700 dark:bg-slate-900/20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30">
                <LayoutGrid className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">Start building your page</p>
              <p className="mt-1 text-sm text-slate-400">Click the + above or below to add blocks</p>
              <button type="button" onClick={() => addBlock("paragraph")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
              ><Plus className="h-4 w-4" /> Add First Block</button>
            </div>
          ) : (
            blocks.map((block, idx) => (
              <div key={block.id}>
                {/* Block */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className={`group/block relative rounded-xl border-2 transition-all ${
                    dragIdx === idx ? "opacity-20 scale-[0.98]" : ""
                  } ${
                    dragOverIdx === idx ? "border-blue-400 bg-blue-50/30 shadow-lg shadow-blue-100 dark:border-blue-500 dark:bg-blue-950/20 dark:shadow-blue-900/20" : ""
                  } ${
                    block.visible
                      ? "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-slate-600"
                      : "border-dashed border-slate-300 bg-slate-50 opacity-60 dark:border-slate-600 dark:bg-slate-900/50"
                  }`}
                >
                  {/* Block header */}
                  <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-1.5 dark:border-slate-800">
                    <div className="flex cursor-grab items-center justify-center rounded-md p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {block.type.replace(/_/g, " ")}
                    </span>
                    <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100">
                      <button type="button" onClick={() => moveBlock(idx, "up")} disabled={idx === 0}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      ><ArrowUp className="h-3 w-3" /></button>
                      <button type="button" onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      ><ArrowDown className="h-3 w-3" /></button>
                      <button type="button" onClick={() => duplicateBlock(idx)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      ><Copy className="h-3 w-3" /></button>
                      <button type="button" onClick={() => toggleVisibility(block.id)}
                        className={`rounded p-1 ${block.visible ? "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-amber-500"}`}
                      >{block.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</button>
                      <button type="button" onClick={() => deleteBlock(block.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      ><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>

                  {/* Block body */}
                  <div className="p-4">
                    <BlockBody block={block} updateBlock={updateBlock} setBlockArr={setBlockArr}
                      addBlockArr={addBlockArr} rmBlockArr={rmBlockArr} showToast={showToast} />
                  </div>
                </div>

                {/* Insert between */}
                <div className="group relative flex items-center justify-center py-0.5">
                  <div className="absolute inset-x-0 h-px bg-transparent group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors" />
                  <button type="button" onClick={() => handleAddMenuToggle(idx)}
                    className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                  ><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))
          )}

          {/* Add block menu */}
          {addingMenu !== null && (
            <div ref={addMenuRef} className="relative z-20 my-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 p-3 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={addingFilter} autoFocus
                    onChange={(e) => setAddingFilter(e.target.value)}
                    placeholder="Search blocks..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filteredCategories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No blocks match &quot;{addingFilter}&quot;</p>
                ) : (
                  filteredCategories.map((cat) => (
                    <div key={cat.label}>
                      <p className="px-2 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 first:pt-0">{cat.label}</p>
                      <div className="space-y-0.5">
                        {cat.types.map((t) => {
                          const Icon = t.icon;
                          return (
                            <button key={t.type} type="button" onClick={() => addBlock(t.type, typeof addingMenu === "number" ? addingMenu + 1 : addingMenu === "bottom" ? blocks.length : 0)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.label}</p>
                                <p className="text-[11px] text-slate-400">{t.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Block category quick-add bar */}
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Add Block</p>
            <div className="flex flex-wrap gap-1">
              {BLOCK_CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.label} className="relative group/cat">
                    <div className="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/cat:opacity-100 dark:bg-slate-700">
                      {cat.label}
                    </div>
                    {cat.types.slice(0, 3).map(t => {
                      const Icon = t.icon;
                      return (
                        <button key={t.type} type="button" onClick={() => addBlock(t.type)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                        >
                          <Icon className="h-3 w-3" />
                          {t.label}
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => handleAddMenuToggle("bottom")}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-400 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                    ><Plus className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEO Panel */}
          <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button type="button" onClick={() => setSeoOpen(!seoOpen)}
              className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            >
              {seoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <PanelRightClose className="h-4 w-4 text-blue-500" />
              Search Engine Optimization
            </button>
            {seoOpen && (
              <div className="mt-3 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Meta Title</label>
                    <input type="text" value={seo?.meta_title || ""} onChange={(e) => updateSeo("meta_title", e.target.value)}
                      placeholder="Page title for search results..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                    <span className="mt-1 block text-right text-[10px] text-slate-400">{(seo?.meta_title || "").length}/70</span>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Meta Description</label>
                    <textarea value={seo?.meta_description || ""} onChange={(e) => updateSeo("meta_description", e.target.value)}
                      placeholder="Brief description for search results..."
                      rows={2} maxLength={160}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                    <span className="mt-1 block text-right text-[10px] text-slate-400">{(seo?.meta_description || "").length}/160</span>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">OG Title</label>
                    <input type="text" value={seo?.og_title || ""} onChange={(e) => updateSeo("og_title", e.target.value)}
                      placeholder="Social share title..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">OG Description</label>
                    <textarea value={seo?.og_description || ""} onChange={(e) => updateSeo("og_description", e.target.value)}
                      placeholder="Social share description..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">OG Image URL</label>
                    <input type="url" value={seo?.og_image || ""} onChange={(e) => updateSeo("og_image", e.target.value)}
                      placeholder="https://example.com/og-image.jpg"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Canonical URL</label>
                    <input type="url" value={seo?.canonical_url || ""} onChange={(e) => updateSeo("canonical_url", e.target.value)}
                      placeholder="https://example.com/page"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Robots Directive</label>
                    <select value={seo?.robots || "index,follow"} onChange={(e) => updateSeo("robots", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                    >
                      <option value="index,follow">index, follow</option>
                      <option value="index,nofollow">index, nofollow</option>
                      <option value="noindex,follow">noindex, follow</option>
                      <option value="noindex,nofollow">noindex, nofollow</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Schema Markup (JSON-LD)</label>
                  <textarea value={seo?.schema_markup ? JSON.stringify(seo.schema_markup, null, 2) : ""}
                    onChange={(e) => { try { updateSeo("schema_markup", JSON.parse(e.target.value)); } catch { /* ignore */ } }}
                    placeholder='{ "@context": "https://schema.org", ... }'
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Preview for tablet/mobile */}
      {previewMode !== "desktop" && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            {previewMode === "mobile" ? <Smartphone className="h-4 w-4 text-slate-400" /> : <Tablet className="h-4 w-4 text-slate-400" />}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {previewMode === "mobile" ? "Mobile" : "Tablet"} Preview
            </span>
            <span className="text-[10px] text-slate-400">({previewMode === "mobile" ? "400px" : "768px"})</span>
          </div>
          <div className={`mx-auto transition-all duration-200 ${previewWidth}`}>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="p-4">
                <BlockRenderer blocks={blocks.filter(b => b.visible)} preview />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   Block Body - renders the editor per block type
   ========================================== */
function BlockBody({ block, updateBlock, setBlockArr, addBlockArr, rmBlockArr, showToast }: {
  block: Block;
  updateBlock: (id: string, patch: Record<string, any>) => void;
  setBlockArr: (id: string, field: string, arr: any[]) => void;
  addBlockArr: (id: string, field: string, template: Record<string, any>) => void;
  rmBlockArr: (id: string, field: string, idx: number) => void;
  showToast: (msg: string) => void;
}) {
  const { id, type, data } = block;

  /* ---- Text Blocks ---- */

  if (type === "heading") {
    const levels = [1, 2, 3, 4, 5, 6];
    return (
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          {levels.map(l => (
            <button key={l} type="button" onClick={() => updateBlock(id, { level: l })}
              className={`px-2 py-1.5 text-xs font-bold transition-colors ${
                data.level === l
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >H{l}</button>
          ))}
        </div>
        <input type="text" value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
          placeholder="Enter heading..."
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
        />
      </div>
    );
  }

  if (type === "paragraph") {
    return (
      <textarea value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
        placeholder="Start writing..."
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white placeholder:text-slate-400"
      />
    );
  }

  if (type === "rich_text") {
    const [showFormat, setShowFormat] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wrapFormat = (before: string, after: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const text = data.html || "";
      const newText = text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end);
      updateBlock(id, { html: newText });
      setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, end + before.length); }, 0);
    };
    return (
      <div>
        <div className="mb-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button type="button" onClick={() => wrapFormat("**", "**")} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><Bold className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => wrapFormat("_", "_")} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><Italic className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => wrapFormat("<u>", "</u>")} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><Underline className="h-3.5 w-3.5" /></button>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-600" />
          <button type="button" onClick={() => wrapFormat("- ", "")} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><List className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => wrapFormat("1. ", "")} className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><ListOrdered className="h-3.5 w-3.5" /></button>
        </div>
        <textarea ref={textareaRef} value={data.html || ""} onChange={(e) => updateBlock(id, { html: e.target.value })}
          placeholder="Write formatted text... (markdown: **bold**, _italic_)"
          rows={4}
          className="w-full resize-none rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white placeholder:text-slate-400"
        />
      </div>
    );
  }

  if (type === "quote") {
    return (
      <div className="space-y-2">
        <div className="flex gap-3">
          <Quote className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
          <textarea value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
            placeholder="Quote text..."
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm italic text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
          />
        </div>
        <input type="text" value={data.author || ""} onChange={(e) => updateBlock(id, { author: e.target.value })}
          placeholder="— Author name (optional)"
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-400"
        />
      </div>
    );
  }

  if (type === "callout") {
    const variant = CALLOUT_VARIANTS.find(v => v.value === data.variant) || CALLOUT_VARIANTS[0];
    const Icon = variant.icon;
    return (
      <div className={`space-y-2 rounded-xl border p-3 ${variant.color}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <select value={data.variant || "info"} onChange={(e) => updateBlock(id, { variant: e.target.value })}
            className="rounded-md border-0 bg-transparent text-xs font-bold outline-none"
          >
            {CALLOUT_VARIANTS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <textarea value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
          placeholder="Callout text..."
          rows={2}
          className="w-full resize-none rounded-lg border-0 bg-transparent px-0 text-sm outline-none"
        />
      </div>
    );
  }

  if (type === "note" || type === "warning") {
    const isWarn = type === "warning";
    const borderCls = isWarn ? "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20" : "border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-950/20";
    const Icon = isWarn ? TriangleAlert : Bell;
    const label = isWarn ? "Warning" : "Note";
    return (
      <div className={`space-y-2 rounded-xl border p-3 ${borderCls}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${isWarn ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`} />
          <span className={`text-xs font-extrabold uppercase tracking-wider ${isWarn ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`}>{label}</span>
        </div>
        <textarea value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
          placeholder={`${label} text...`}
          rows={2}
          className="w-full resize-none rounded-lg border-0 bg-transparent px-0 text-sm outline-none"
        />
      </div>
    );
  }

  if (type === "highlighted_text") {
    const color = HIGHLIGHT_COLORS.find(c => c.value === data.color) || HIGHLIGHT_COLORS[0];
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Highlighter className="h-4 w-4 text-amber-500" />
          <select value={data.color || "yellow"} onChange={(e) => updateBlock(id, { color: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
          >
            {HIGHLIGHT_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className={`rounded-xl px-4 py-3 ${color.class}`}>
          <input type="text" value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
            placeholder="Highlighted text..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-60"
          />
        </div>
      </div>
    );
  }

  if (type === "bullet_list" || type === "numbered_list") {
    const items = data.items || [];
    const isNum = type === "numbered_list";
    return (
      <div className="space-y-1.5">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-2 shrink-0 text-xs font-bold text-slate-400 w-5 text-right">
              {isNum ? `${idx + 1}.` : "•"}
            </span>
            <input type="text" value={item.text || ""} onChange={(e) => {
              const arr = [...items]; arr[idx] = { ...arr[idx], text: e.target.value }; setBlockArr(id, "items", arr);
            }} placeholder="List item..."
              className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700"
            />
            <button type="button" onClick={() => rmBlockArr(id, "items", idx)}
              className="mt-1 rounded p-1 text-red-400 hover:bg-red-50"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "items", { text: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Item</button>
      </div>
    );
  }

  if (type === "table") {
    const headers = data.headers || ["Column 1", "Column 2"];
    const rows = data.rows || [["", ""]];
    const addRow = () => {
      const arr = [...rows, headers.map(() => "")];
      setBlockArr(id, "rows", arr);
    };
    const addColumn = () => {
      setBlockArr(id, "headers", [...headers, `Column ${headers.length + 1}`]);
      const arr = rows.map((r: string[]) => [...r, ""]);
      setBlockArr(id, "rows", arr);
    };
    const removeColumn = (colIdx: number) => {
      if (headers.length <= 1) return;
      setBlockArr(id, "headers", headers.filter((_: any, i: number) => i !== colIdx));
      setBlockArr(id, "rows", rows.map((r: string[]) => r.filter((_: any, i: number) => i !== colIdx)));
    };
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Table className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">{rows.length} rows × {headers.length} cols</span>
          <button type="button" onClick={addColumn}
            className="ml-auto rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700"
          >+ Column</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                {headers.map((h: string, ci: number) => (
                  <th key={ci} className="border-r border-slate-200 p-1.5 dark:border-slate-700 last:border-r-0">
                    <div className="flex items-center gap-1">
                      <input type="text" value={h} onChange={(e) => {
                        const arr = [...headers]; arr[ci] = e.target.value; setBlockArr(id, "headers", arr);
                      }} className="w-full bg-transparent text-xs font-bold outline-none" />
                      {headers.length > 1 && (
                        <button type="button" onClick={() => removeColumn(ci)}
                          className="shrink-0 text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row: string[], ri: number) => (
                <tr key={ri}>
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} className="border-r border-slate-100 p-1.5 dark:border-slate-800 last:border-r-0">
                      <input type="text" value={cell} onChange={(e) => {
                        const arr = [...rows]; arr[ri] = [...arr[ri]]; arr[ri][ci] = e.target.value; setBlockArr(id, "rows", arr);
                      }} placeholder="..." className="w-full bg-transparent text-xs outline-none" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addRow}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
          ><Plus className="h-3 w-3" /> Add Row</button>
          <button type="button" onClick={() => {
            if (rows.length <= 1) return;
            const arr = rows.filter((_: any, i: number) => i !== rows.length - 1);
            setBlockArr(id, "rows", arr);
          }} disabled={rows.length <= 1}
            className="inline-flex items-center gap-1 text-xs font-bold text-red-500 disabled:opacity-30"
          ><Trash2 className="h-3 w-3" /> Remove Last Row</button>
        </div>
      </div>
    );
  }

  /* ---- Media Blocks ---- */

  if (type === "image") {
    return (
      <div className="space-y-3">
        {data.url && (
          <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <img src={data.url} alt={data.alt || ""} className="max-h-48 w-full object-contain" />
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={data.url || ""} onChange={(e) => updateBlock(id, { url: e.target.value })}
            placeholder="Image URL..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <input type="text" value={data.alt || ""} onChange={(e) => updateBlock(id, { alt: e.target.value })}
            placeholder="Alt text (SEO)..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-300"
          />
          <input type="text" value={data.caption || ""} onChange={(e) => updateBlock(id, { caption: e.target.value })}
            placeholder="Caption..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-300"
          />
        </div>
      </div>
    );
  }

  if (type === "image_gallery") {
    const images = data.images || [];
    return (
      <div className="space-y-2">
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img: any, idx: number) => (
              <div key={idx} className="relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                {img.url && <img src={img.url} alt="" className="h-20 w-full object-cover" />}
                <button type="button" onClick={() => rmBlockArr(id, "images", idx)}
                  className="absolute top-1 right-1 rounded bg-black/50 p-0.5 text-white hover:bg-red-500"
                ><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
        {images.map((img: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <input type="text" value={img.url || ""} onChange={(e) => {
              const arr = [...images]; arr[idx] = { ...arr[idx], url: e.target.value }; setBlockArr(id, "images", arr);
            }} placeholder="Image URL..." className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white" />
            <input type="text" value={img.caption || ""} onChange={(e) => {
              const arr = [...images]; arr[idx] = { ...arr[idx], caption: e.target.value }; setBlockArr(id, "images", arr);
            }} placeholder="Caption..." className="flex-[0.6] rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-300" />
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "images", { url: "", caption: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Image</button>
      </div>
    );
  }

  if (type === "hero_banner") {
    return (
      <div className="space-y-3">
        {data.url && (
          <div className="relative overflow-hidden rounded-xl bg-slate-800" style={{ minHeight: 160 }}>
            <img src={data.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <div className="relative flex h-full min-h-[160px] items-center justify-center p-4">
              <div className="text-center">
                {data.overlay_text && <p className="text-lg font-extrabold text-white">{data.overlay_text}</p>}
                {data.overlay_subtitle && <p className="text-sm text-white/70">{data.overlay_subtitle}</p>}
              </div>
            </div>
          </div>
        )}
        <input type="text" value={data.url || ""} onChange={(e) => updateBlock(id, { url: e.target.value })}
          placeholder="Background image URL..."
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
        />
        <div className="flex gap-2">
          <input type="text" value={data.overlay_text || ""} onChange={(e) => updateBlock(id, { overlay_text: e.target.value })}
            placeholder="Main heading..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
          />
          <input type="text" value={data.overlay_subtitle || ""} onChange={(e) => updateBlock(id, { overlay_subtitle: e.target.value })}
            placeholder="Subtitle..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-300"
          />
        </div>
        <select value={data.overlay_align || "center"} onChange={(e) => updateBlock(id, { overlay_align: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="left">Align Left</option>
          <option value="center">Align Center</option>
          <option value="right">Align Right</option>
        </select>
      </div>
    );
  }

  if (type === "video_embed") {
    return (
      <div className="space-y-3">
        <input type="text" value={data.url || ""} onChange={(e) => updateBlock(id, { url: e.target.value })}
          placeholder="YouTube or Vimeo URL..."
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
        />
        <div className="flex items-center gap-2">
          <select value={data.aspect_ratio || "16/9"} onChange={(e) => updateBlock(id, { aspect_ratio: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="16/9">16:9</option>
            <option value="4/3">4:3</option>
            <option value="1/1">1:1</option>
            <option value="9/16">9:16 (Vertical)</option>
          </select>
          <input type="text" value={data.caption || ""} onChange={(e) => updateBlock(id, { caption: e.target.value })}
            placeholder="Caption..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:text-slate-300"
          />
        </div>
      </div>
    );
  }

  /* ---- Layout Blocks ---- */

  if (type === "one_column") {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/20">
        <div className="mb-2 flex items-center gap-2">
          <Columns2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full-width Container</span>
        </div>
        <p className="text-xs text-slate-400">Child blocks will render here in sequence</p>
      </div>
    );
  }

  if (type === "two_column") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Left</p>
          <div className="min-h-[60px]" />
        </div>
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Right</p>
          <div className="min-h-[60px]" />
        </div>
      </div>
    );
  }

  if (type === "three_column") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {["Left", "Center", "Right"].map((colName, ci) => (
          <div key={ci} className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{colName}</p>
            <div className="min-h-[40px]" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid_layout") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Columns:</span>
          <input type="range" min={1} max={6} value={data.columns || 3} onChange={(e) => updateBlock(id, { columns: parseInt(e.target.value) })}
            className="w-24 accent-blue-600" />
          <span className="text-xs font-bold text-blue-600">{data.columns || 3}</span>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)` }}>
          {Array.from({ length: data.columns || 3 }).map((_, ci) => (
            <div key={ci} className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-900/20">
              Col {ci + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "card_layout") {
    const cards = data.cards || [];
    return (
      <div className="space-y-3">
        {cards.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card: any, idx: number) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {card.image && <img src={card.image} alt="" className="h-32 w-full object-cover" />}
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{card.title || "Card Title"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{card.description || "Card description"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {cards.map((card: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-700">
            <input type="text" value={card.image || ""} onChange={(e) => {
              const arr = [...cards]; arr[idx] = { ...arr[idx], image: e.target.value }; setBlockArr(id, "cards", arr);
            }} placeholder="Image URL..." className="flex-1 rounded border border-slate-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-blue-500 dark:border-slate-600" />
            <input type="text" value={card.title || ""} onChange={(e) => {
              const arr = [...cards]; arr[idx] = { ...arr[idx], title: e.target.value }; setBlockArr(id, "cards", arr);
            }} placeholder="Title..." className="flex-1 rounded border border-slate-200 bg-transparent px-2 py-1 text-xs font-bold outline-none focus:border-blue-500 dark:border-slate-600" />
            <input type="text" value={card.description || ""} onChange={(e) => {
              const arr = [...cards]; arr[idx] = { ...arr[idx], description: e.target.value }; setBlockArr(id, "cards", arr);
            }} placeholder="Description..." className="flex-[1.5] rounded border border-slate-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-blue-500 dark:border-slate-600" />
            <button type="button" onClick={() => rmBlockArr(id, "cards", idx)}
              className="rounded p-1 text-red-400 hover:bg-red-50"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "cards", { image: "", title: "", description: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Card</button>
      </div>
    );
  }

  /* ---- SEO Blocks ---- */

  if (type === "faq") {
    const items = data.items || [];
    return (
      <div className="space-y-2">
        {items.map((item: any, idx: number) => (
          <details key={idx} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
              <HelpCircle className="h-4 w-4 text-blue-500 shrink-0" />
              <input type="text" value={item.question || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => {
                const arr = [...items]; arr[idx] = { ...arr[idx], question: e.target.value }; setBlockArr(id, "items", arr);
              }} placeholder="Question..."
                className="flex-1 bg-transparent outline-none"
              />
              <button type="button" onClick={(e) => { e.stopPropagation(); rmBlockArr(id, "items", idx); }}
                className="rounded p-1 text-red-400 hover:bg-red-50"><X className="h-3 w-3" /></button>
            </summary>
            <textarea value={item.answer || ""} onChange={(e) => {
              const arr = [...items]; arr[idx] = { ...arr[idx], answer: e.target.value }; setBlockArr(id, "items", arr);
            }} placeholder="Answer..."
              rows={2}
              className="w-full resize-none border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800/50"
            />
          </details>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "items", { question: "", answer: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add FAQ</button>
      </div>
    );
  }

  if (type === "breadcrumb") {
    const items = data.items || [];
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {items.map((item: any, idx: number) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
              <input type="text" value={item.label || ""} onChange={(e) => {
                const arr = [...items]; arr[idx] = { ...arr[idx], label: e.target.value }; setBlockArr(id, "items", arr);
              }} placeholder="Label"
                className="w-24 rounded border border-slate-200 bg-transparent px-2 py-0.5 text-xs outline-none focus:border-blue-500 dark:border-slate-600"
              />
              <input type="text" value={item.href || ""} onChange={(e) => {
                const arr = [...items]; arr[idx] = { ...arr[idx], href: e.target.value }; setBlockArr(id, "items", arr);
              }} placeholder="/url"
                className="w-28 rounded border border-slate-200 bg-transparent px-2 py-0.5 text-xs text-blue-600 outline-none focus:border-blue-500 dark:border-slate-600"
              />
              <button type="button" onClick={() => rmBlockArr(id, "items", idx)}
                className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <button type="button" onClick={() => addBlockArr(id, "items", { label: "", href: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Item</button>
      </div>
    );
  }

  if (type === "related_links") {
    const links = data.links || [];
    return (
      <div className="space-y-2">
        {links.map((link: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <Link className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input type="text" value={link.title || ""} onChange={(e) => {
              const arr = [...links]; arr[idx] = { ...arr[idx], title: e.target.value }; setBlockArr(id, "links", arr);
            }} placeholder="Link title..." className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700" />
            <input type="text" value={link.url || ""} onChange={(e) => {
              const arr = [...links]; arr[idx] = { ...arr[idx], url: e.target.value }; setBlockArr(id, "links", arr);
            }} placeholder="URL..." className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm text-blue-600 outline-none focus:border-blue-500 dark:border-slate-700" />
            <button type="button" onClick={() => rmBlockArr(id, "links", idx)}
              className="rounded p-1 text-red-400 hover:bg-red-50"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "links", { title: "", url: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Link</button>
      </div>
    );
  }

  if (type === "cta") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input type="text" value={data.text || ""} onChange={(e) => updateBlock(id, { text: e.target.value })}
            placeholder="Button text..."
            className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
          />
          <input type="text" value={data.url || ""} onChange={(e) => updateBlock(id, { url: e.target.value })}
            placeholder="Button URL..."
            className="flex-[2] rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Style:</span>
          {CTA_VARIANTS.map(v => (
            <button key={v.value} type="button" onClick={() => updateBlock(id, { variant: v.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${data.variant === v.value ? v.class : "border border-slate-200 text-slate-500 dark:border-slate-600"}`}
            >{v.label}</button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "table_of_contents") {
    return (
      <div className="space-y-2">
        <input type="text" value={data.title || "Table of Contents"} onChange={(e) => updateBlock(id, { title: e.target.value })}
          placeholder="TOC Title..."
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
        />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500">Automatically generated from all H1-H6 headings on the page</p>
        </div>
      </div>
    );
  }

  /* ---- Utility Blocks ---- */

  if (type === "divider") {
    return (
      <div className="flex items-center gap-3">
        <select value={data.style || "solid"} onChange={(e) => updateBlock(id, { style: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="gradient">Gradient</option>
        </select>
        <div className={`flex-1 ${data.style === "dashed" ? "border-dashed" : data.style === "dotted" ? "border-dotted" : "border-solid"} ${data.style === "gradient" ? "h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" : "border-t border-slate-300 dark:border-slate-600"}`} />
      </div>
    );
  }

  if (type === "spacer") {
    return (
      <div className="flex items-center gap-3">
        <ArrowDown className="h-4 w-4 text-slate-300" />
        <input type="range" min={8} max={200} value={data.height || 32} onChange={(e) => updateBlock(id, { height: parseInt(e.target.value) })}
          className="w-32 accent-blue-600" />
        <span className="text-xs font-bold text-blue-600">{data.height || 32}px</span>
      </div>
    );
  }

  if (type === "district_facts") {
    const facts = data.facts || [];
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr><th className="px-4 py-2 text-xs font-bold text-slate-500">Label</th><th className="px-4 py-2 text-xs font-bold text-slate-500">Value</th><th className="w-8" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {facts.map((fact: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-1.5"><input type="text" value={fact.label || ""} onChange={(e) => {
                    const arr = [...facts]; arr[idx] = { ...arr[idx], label: e.target.value }; setBlockArr(id, "facts", arr);
                  }} placeholder="Label" className="w-full bg-transparent text-sm font-bold outline-none" /></td>
                  <td className="px-4 py-1.5"><input type="text" value={fact.value || ""} onChange={(e) => {
                    const arr = [...facts]; arr[idx] = { ...arr[idx], value: e.target.value }; setBlockArr(id, "facts", arr);
                  }} placeholder="Value" className="w-full bg-transparent text-sm outline-none" /></td>
                  <td><button type="button" onClick={() => rmBlockArr(id, "facts", idx)} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => addBlockArr(id, "facts", { label: "", value: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Fact</button>
      </div>
    );
  }

  if (type === "railway_stations") {
    const stations = data.stations || [];
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr><th className="px-4 py-2 text-xs font-bold text-slate-500">Station</th><th className="px-4 py-2 text-xs font-bold text-slate-500">Code</th><th className="px-4 py-2 text-xs font-bold text-slate-500">Zone</th><th className="w-8" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stations.map((s: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-1.5"><input type="text" value={s.name || ""} onChange={(e) => {
                    const arr = [...stations]; arr[idx] = { ...arr[idx], name: e.target.value }; setBlockArr(id, "stations", arr);
                  }} placeholder="Station name" className="w-full bg-transparent text-sm font-semibold outline-none" /></td>
                  <td className="px-4 py-1.5"><input type="text" value={s.code || ""} onChange={(e) => {
                    const arr = [...stations]; arr[idx] = { ...arr[idx], code: e.target.value }; setBlockArr(id, "stations", arr);
                  }} placeholder="Code" className="w-full bg-transparent text-sm font-bold text-blue-600 outline-none" /></td>
                  <td className="px-4 py-1.5"><input type="text" value={s.zone || ""} onChange={(e) => {
                    const arr = [...stations]; arr[idx] = { ...arr[idx], zone: e.target.value }; setBlockArr(id, "stations", arr);
                  }} placeholder="Zone" className="w-full bg-transparent text-sm outline-none" /></td>
                  <td><button type="button" onClick={() => rmBlockArr(id, "stations", idx)} className="text-red-400"><X className="h-3 w-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => addBlockArr(id, "stations", { name: "", code: "", zone: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Station</button>
      </div>
    );
  }

  if (type === "emergency_contacts") {
    const contacts = data.contacts || [];
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50 dark:bg-red-950/20">
              <tr><th className="px-4 py-2 text-xs font-bold text-slate-600">Service</th><th className="px-4 py-2 text-xs font-bold text-slate-600">Number</th><th className="px-4 py-2 text-xs font-bold text-slate-600">Description</th><th className="w-8" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contacts.map((c: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-1.5"><input type="text" value={c.service || ""} onChange={(e) => {
                    const arr = [...contacts]; arr[idx] = { ...arr[idx], service: e.target.value }; setBlockArr(id, "contacts", arr);
                  }} placeholder="Service" className="w-full bg-transparent text-sm font-semibold outline-none" /></td>
                  <td className="px-4 py-1.5"><input type="text" value={c.number || ""} onChange={(e) => {
                    const arr = [...contacts]; arr[idx] = { ...arr[idx], number: e.target.value }; setBlockArr(id, "contacts", arr);
                  }} placeholder="Phone" className="w-full bg-transparent text-sm font-bold text-blue-600 outline-none" /></td>
                  <td className="px-4 py-1.5"><input type="text" value={c.description || ""} onChange={(e) => {
                    const arr = [...contacts]; arr[idx] = { ...arr[idx], description: e.target.value }; setBlockArr(id, "contacts", arr);
                  }} placeholder="Description" className="w-full bg-transparent text-sm outline-none" /></td>
                  <td><button type="button" onClick={() => rmBlockArr(id, "contacts", idx)} className="text-red-400"><X className="h-3 w-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => addBlockArr(id, "contacts", { service: "", number: "", description: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Contact</button>
      </div>
    );
  }

  if (type === "odop_section") {
    return (
      <div className="space-y-3">
        {data.image && (
          <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <img src={data.image} alt={data.product_name || ""} className="max-h-40 w-full object-contain" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">One District One Product</span>
        </div>
        <input type="text" value={data.product_name || ""} onChange={(e) => updateBlock(id, { product_name: e.target.value })}
          placeholder="Product name..."
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-lg font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
        />
        <textarea value={data.description || ""} onChange={(e) => updateBlock(id, { description: e.target.value })}
          placeholder="Product description..."
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700"
        />
        <input type="text" value={data.image || ""} onChange={(e) => updateBlock(id, { image: e.target.value })}
          placeholder="Product image URL..."
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-600"
        />
      </div>
    );
  }

  if (type === "industries_section") {
    const industries = data.industries || [];
    return (
      <div className="space-y-2">
        {industries.map((ind: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-700">
            <Factory className="h-4 w-4 shrink-0 text-slate-400" />
            <input type="text" value={ind.name || ""} onChange={(e) => {
              const arr = [...industries]; arr[idx] = { ...arr[idx], name: e.target.value }; setBlockArr(id, "industries", arr);
            }} placeholder="Industry name..."
              className="flex-1 rounded border border-slate-200 bg-transparent px-2 py-1 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-600"
            />
            <input type="text" value={ind.description || ""} onChange={(e) => {
              const arr = [...industries]; arr[idx] = { ...arr[idx], description: e.target.value }; setBlockArr(id, "industries", arr);
            }} placeholder="Description..."
              className="flex-[2] rounded border border-slate-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-blue-500 dark:border-slate-600"
            />
            <button type="button" onClick={() => rmBlockArr(id, "industries", idx)}
              className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "industries", { name: "", description: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Industry</button>
      </div>
    );
  }

  if (type === "tourist_places") {
    const places = data.places || [];
    return (
      <div className="space-y-2">
        {places.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {places.map((p: any, idx: number) => (
              <div key={idx} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                {p.image && <img src={p.image} alt="" className="h-16 w-full object-cover" />}
                <div className="p-2">
                  <p className="text-xs font-bold">{p.name || "Place"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {places.map((p: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <SunDim className="h-4 w-4 shrink-0 text-amber-500" />
            <input type="text" value={p.name || ""} onChange={(e) => {
              const arr = [...places]; arr[idx] = { ...arr[idx], name: e.target.value }; setBlockArr(id, "places", arr);
            }} placeholder="Place name..." className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700" />
            <input type="text" value={p.description || ""} onChange={(e) => {
              const arr = [...places]; arr[idx] = { ...arr[idx], description: e.target.value }; setBlockArr(id, "places", arr);
            }} placeholder="Description..." className="flex-[1.5] rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-700" />
            <input type="text" value={p.image || ""} onChange={(e) => {
              const arr = [...places]; arr[idx] = { ...arr[idx], image: e.target.value }; setBlockArr(id, "places", arr);
            }} placeholder="Image URL..." className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-slate-600" />
            <button type="button" onClick={() => rmBlockArr(id, "places", idx)}
              className="text-red-400"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "places", { name: "", description: "", image: "" })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Place</button>
      </div>
    );
  }

  if (type === "popular_searches") {
    const searches = data.searches || [];
    return (
      <div className="space-y-2">
        {searches.map((s: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
            <input type="text" value={s.term || ""} onChange={(e) => {
              const arr = [...searches]; arr[idx] = { ...arr[idx], term: e.target.value }; setBlockArr(id, "searches", arr);
            }} placeholder="Search term..."
              className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700"
            />
            <input type="number" value={s.count || 0} min={0} onChange={(e) => {
              const arr = [...searches]; arr[idx] = { ...arr[idx], count: parseInt(e.target.value) || 0 }; setBlockArr(id, "searches", arr);
            }} placeholder="Count"
              className="w-20 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600"
            />
            <button type="button" onClick={() => rmBlockArr(id, "searches", idx)}
              className="text-red-400"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addBlockArr(id, "searches", { term: "", count: 0 })}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400"
        ><Plus className="h-3 w-3" /> Add Search</button>
      </div>
    );
  }

  /* Fallback */
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/30">
      Editor for "{type}" block (data: {JSON.stringify(data).slice(0, 100)})
    </div>
  );
}

// Import needed at bottom to avoid circular deps with BlockRenderer
import BlockRenderer from "./BlockRenderer";
