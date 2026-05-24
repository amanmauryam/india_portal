import Link from "next/link";
import {
  AlertTriangle, Bell, ShieldAlert, Info, CheckCircle2,
  Quote, ChevronRight, ExternalLink, ArrowRight,
  HelpCircle, MapPin, Train, ShoppingBag, Factory, PhoneCall,
  SunDim, Search, ListTree, Highlighter,
} from "lucide-react";
import { createElement, Fragment } from "react";

interface Block {
  id: string;
  type: string;
  data: Record<string, any>;
  visible?: boolean;
}

interface BlockRendererProps {
  blocks: Block[];
  preview?: boolean;
}

function extractHeadings(blocks: Block[]) {
  return blocks.filter(b => b.type === "heading" && b.data.text).map(b => ({
    level: b.data.level || 2,
    text: b.data.text,
    id: `heading-${b.id}`,
  }));
}

function getVideoEmbedUrl(url: string): { src: string; type: "youtube" | "vimeo" | "direct" | null } {
  if (!url) return { src: "", type: null };
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (yt) return { src: `https://www.youtube.com/embed/${yt[1]}`, type: "youtube" };
  const vm = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vm) return { src: `https://player.vimeo.com/video/${vm[1]}`, type: "vimeo" };
  return { src: url, type: "direct" };
}

function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    const regex = /(\*\*(.+?)\*\*|_(.+?)_|<u>(.+?)<\/u>)/g;
    let lastIdx = 0;
    let match;
    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={key++}>{remaining.slice(lastIdx, match.index)}</span>);
      }
      if (match[1]?.startsWith("**")) {
        parts.push(<strong key={key++} className="font-bold">{match[2]}</strong>);
      } else if (match[1]?.startsWith("_")) {
        parts.push(<em key={key++}>{match[3]}</em>);
      } else if (match[1]?.startsWith("<u>")) {
        parts.push(<u key={key++}>{match[4]}</u>);
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < remaining.length) {
      parts.push(<span key={key++}>{remaining.slice(lastIdx)}</span>);
    }
    if (line.match(/^- /)) {
      return <li key={i} className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 ml-4 list-disc">{parts}</li>;
    }
    if (line.match(/^\d+\. /)) {
      return <li key={i} className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 ml-4 list-decimal">{parts}</li>;
    }
    return <p key={i} className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 mt-2.5 first:mt-0">{parts}</p>;
  });
}

export default function BlockRenderer({ blocks, preview }: BlockRendererProps) {
  if (!blocks || !Array.isArray(blocks)) return null;

  const visibleBlocks = blocks.filter(b => b.visible !== false);
  const headings = extractHeadings(visibleBlocks);

  const faqBlocks = visibleBlocks.filter(b => b.type === "faq");
  const faqItems = faqBlocks.flatMap(b => b.data.items || []);
  const faqSchema = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((p: any) => ({
      "@type": "Question",
      "name": p.question || "",
      "acceptedAnswer": { "@type": "Answer", "text": p.answer || "" }
    }))
  } : null;

  const breadcrumbBlocks = visibleBlocks.filter(b => b.type === "breadcrumb");
  const breadcrumbItems = breadcrumbBlocks.flatMap(b => b.data.items || []);
  const breadcrumbSchema = breadcrumbItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item: any, idx: number) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.label || item.name,
      "item": item.href || item.link || undefined,
    }))
  } : null;

  return (
    <div className="space-y-6 max-w-full">
      {faqSchema && !preview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {breadcrumbSchema && !preview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      )}

      {visibleBlocks.map((block, bi) => {
        const { id, type, data } = block;

        /* ------- TEXT BLOCKS ------- */

        if (type === "heading") {
          const level = data.level || 2;
          const text = data.text || "";
          const common = "font-extrabold tracking-tight text-slate-900 dark:text-white scroll-mt-20";
          const sizes: Record<number, string> = {
            1: "text-3xl sm:text-4xl lg:text-5xl mt-8 mb-4 sm:mt-10 sm:mb-6",
            2: "text-xl sm:text-2xl lg:text-4xl mt-6 mb-3 sm:mt-9 sm:mb-4",
            3: "text-lg sm:text-xl lg:text-3xl mt-5 mb-2 sm:mt-8 sm:mb-3",
            4: "text-base sm:text-lg lg:text-2xl mt-4 mb-2 sm:mt-6",
            5: "text-sm sm:text-base lg:text-xl mt-3 mb-1 sm:mt-5",
            6: "text-sm sm:text-base lg:text-lg mt-3 mb-1 sm:mt-4",
          };
          return createElement(
            `h${level}` as any,
            { key: id, id: `heading-${id}`, className: `${common} ${sizes[level] || sizes[2]} break-words` },
            text
          );
        }

        if (type === "paragraph") {
          const text = data.text || "";
          const elements = parseMarkdown(text);
          if (elements.length === 0) return null;
          const hasList = elements.some((e: any) => e?.type === "li");
          if (hasList) {
            const listItems = elements.filter((e: any) => e?.type === "li");
            const isOrdered = elements.some((e: any) => e?.type === "li" && e?.props?.className?.includes("list-decimal"));
            return (
              <div key={id} className="space-y-1">
                {isOrdered ? (
                  <ol className="ml-5 space-y-1">{listItems}</ol>
                ) : (
                  <ul className="ml-5 space-y-1">{listItems}</ul>
                )}
                {elements.filter((e: any) => e?.type === "p").map((p, i) => (
                  <Fragment key={i}>{p}</Fragment>
                ))}
              </div>
            );
          }
          return <div key={id} className="space-y-2">{elements}</div>;
        }

        if (type === "rich_text") {
          const html = data.html || "";
          const elements = parseMarkdown(html);
          return <div key={id} className="rich-text space-y-2">{elements}</div>;
        }

        if (type === "quote") {
          const text = data.text || "";
          const author = data.author || "";
          return (
            <blockquote key={id} className="my-8 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent py-4 pl-6 pr-4 dark:from-blue-950/10 max-w-full">
              <div className="flex gap-3">
                <Quote className="mt-1 h-5 w-5 shrink-0 text-blue-500" />
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200 italic break-words">
                    &ldquo;{text}&rdquo;
                  </p>
                  {author && (
                    <p className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                      &mdash; {author}
                    </p>
                  )}
                </div>
              </div>
            </blockquote>
          );
        }

        if (type === "callout") {
          const text = data.text || "";
          const variant = data.variant || "info";
          const styles: Record<string, string> = {
            info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/30 dark:bg-blue-950/20 dark:text-blue-200",
            success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-200",
            warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-200",
            danger: "border-red-200 bg-red-50 text-red-900 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-200",
          };
          const icons: Record<string, any> = {
            info: Info, success: CheckCircle2, warning: AlertTriangle, danger: ShieldAlert,
          };
          const Icon = icons[variant] || Info;
          return (
            <div key={id} className={`my-6 rounded-xl border p-4 max-w-full ${styles[variant] || styles.info}`}>
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-relaxed break-words">{text}</p>
              </div>
            </div>
          );
        }

        if (type === "note") {
          const text = data.text || "";
          return (
            <div key={id} className="my-6 rounded-xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800/30 dark:bg-blue-950/15 max-w-full">
              <div className="flex gap-3">
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Note</p>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">{text}</p>
                </div>
              </div>
            </div>
          );
        }

        if (type === "warning") {
          const text = data.text || "";
          return (
            <div key={id} className="my-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/30 dark:bg-amber-950/15 max-w-full">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Warning</p>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words">{text}</p>
                </div>
              </div>
            </div>
          );
        }

        if (type === "highlighted_text") {
          const text = data.text || "";
          const color = data.color || "yellow";
          const colorStyles: Record<string, string> = {
            yellow: "bg-yellow-200/70 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200",
            green: "bg-emerald-200/70 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
            blue: "bg-blue-200/70 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200",
            pink: "bg-pink-200/70 text-pink-900 dark:bg-pink-500/20 dark:text-pink-200",
            purple: "bg-purple-200/70 text-purple-900 dark:bg-purple-500/20 dark:text-purple-200",
          };
          return (
            <p key={id} className={`my-4 rounded-lg px-4 py-2.5 text-sm font-semibold leading-relaxed ${colorStyles[color] || colorStyles.yellow}`}>
              <Highlighter className="inline h-4 w-4 mr-1.5 -mt-0.5 opacity-60" />
              {text}
            </p>
          );
        }

        if (type === "bullet_list" || type === "numbered_list") {
          const items = data.items || [];
          if (items.length === 0) return null;
          const isNum = type === "numbered_list";
          const ListTag = isNum ? "ol" : "ul";
          return (
            <div key={id} className="my-6">
              <ListTag className={`space-y-2 ${isNum ? "list-decimal" : "list-disc"} pl-5`}>
                {items.map((item: any, idx: number) => (
                  <li key={idx} className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 pl-1 break-words">
                    {item.text}
                  </li>
                ))}
              </ListTag>
            </div>
          );
        }

        if (type === "table") {
          const headers = data.headers || [];
          const rows = data.rows || [];
          if (headers.length === 0) return null;
          return (
            <div key={id} className="my-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    {headers.map((h: string, ci: number) => (
                      <th key={ci} className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row: string[], ri: number) => (
                    <tr key={ri} className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                      {row.map((cell: string, ci: number) => (
                        <td key={ci} className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        /* ------- MEDIA BLOCKS ------- */

        if (type === "image") {
          const url = data.url || "";
          const alt = data.alt || data.caption || "";
          const caption = data.caption || "";
          if (!url) return null;
          return (
            <figure key={id} className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/35 max-w-full">
              <img src={url} alt={alt} className="w-full object-cover max-h-[500px]" loading="lazy" />
              {caption && (
                <figcaption className="border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        if (type === "image_gallery") {
          const images = data.images || [];
          if (images.length === 0) return null;
          return (
            <div key={id} className="my-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img: any, idx: number) => (
                  <figure key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/35">
                    <img src={img.url} alt={img.caption || ""} className="h-48 w-full object-cover sm:h-56" loading="lazy" />
                    {img.caption && (
                      <figcaption className="border-t border-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          );
        }

        if (type === "hero_banner") {
          const url = data.url || "";
          const overlayText = data.overlay_text || "";
          const overlaySubtitle = data.overlay_subtitle || "";
          const align = data.overlay_align || "center";
          const alignClasses = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
          if (!url && !overlayText) return null;
          return (
            <div key={id} className="relative my-8 overflow-hidden rounded-2xl bg-slate-900 min-h-[250px] sm:min-h-[350px] flex">
              {url && <img src={url} alt={overlayText} className="absolute inset-0 h-full w-full object-cover opacity-70" loading="lazy" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              <div className={`relative z-10 flex w-full flex-col justify-end p-4 sm:p-10 ${alignClasses}`}>
                {overlayText && (
                  <h2 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-white max-w-3xl break-words">{overlayText}</h2>
                )}
                {overlaySubtitle && (
                  <p className="mt-2 text-sm text-white/80 sm:text-base max-w-2xl">{overlaySubtitle}</p>
                )}
              </div>
            </div>
          );
        }

        if (type === "video_embed") {
          const url = data.url || "";
          const caption = data.caption || "";
          const aspectRatio = data.aspect_ratio || "16/9";
          const ratioMap: Record<string, string> = {
            "16/9": "56.25%", "4/3": "75%", "1/1": "100%", "9/16": "177.78%",
          };
          const { src, type: vidType } = getVideoEmbedUrl(url);
          if (!src) return null;
          return (
            <figure key={id} className="my-8">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-800">
                <div style={{ paddingBottom: ratioMap[aspectRatio] || "56.25%", position: "relative" }}>
                  <iframe src={src} className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={caption || "Video embed"} />
                </div>
              </div>
              {caption && (
                <figcaption className="mt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{caption}</figcaption>
              )}
            </figure>
          );
        }

        /* ------- LAYOUT BLOCKS ------- */

        if (type === "one_column") {
          return (
            <div key={id} className="my-6">
              <div className="space-y-4">
                <BlockRenderer blocks={(data.blocks || []).filter((b: Block) => b.visible !== false)} preview={preview} />
              </div>
            </div>
          );
        }

        if (type === "two_column") {
          const ratio = data.ratio || "1/1";
          const ratioClass = ratio === "2/1" ? "md:grid-cols-2 md:[&>*:first-child]:col-span-1" : "md:grid-cols-2";
          return (
            <div key={id} className="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <BlockRenderer blocks={(data.left_blocks || []).filter((b: Block) => b.visible !== false)} preview={preview} />
              </div>
              <div className="space-y-4">
                <BlockRenderer blocks={(data.right_blocks || []).filter((b: Block) => b.visible !== false)} preview={preview} />
              </div>
            </div>
          );
        }

        if (type === "three_column") {
          return (
            <div key={id} className="my-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {["col1_blocks", "col2_blocks", "col3_blocks"].map((col, ci) => (
                <div key={ci} className="space-y-4">
                  <BlockRenderer blocks={(data[col] || []).filter((b: Block) => b.visible !== false)} preview={preview} />
                </div>
              ))}
            </div>
          );
        }

        if (type === "grid_layout") {
          const cols = data.columns || 3;
          const childBlocks = (data.blocks || []).filter((b: Block) => b.visible !== false);
          const gridCols = cols <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
          return (
            <div key={id} className="my-6">
              <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
                {childBlocks.map((child: Block) => (
                  <BlockRenderer key={child.id} blocks={[child]} preview={preview} />
                ))}
              </div>
            </div>
          );
        }

        if (type === "card_layout") {
          const cards = data.cards || [];
          if (cards.length === 0) return null;
          return (
            <div key={id} className="my-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card: any, idx: number) => (
                <div key={idx} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  {card.image && (
                    <img src={card.image} alt={card.title || ""} className="h-48 w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  )}
                  <div className="p-4 sm:p-5">
                    {card.title && <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">{card.title}</h3>}
                    {card.description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{card.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (type === "divider") {
          const style = data.style || "solid";
          const styleClasses: Record<string, string> = {
            solid: "border-t border-slate-300 dark:border-slate-600",
            dashed: "border-t-2 border-dashed border-slate-300 dark:border-slate-600",
            dotted: "border-t-2 border-dotted border-slate-300 dark:border-slate-600",
            gradient: "h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full",
          };
          return <div key={id} className={`my-8 ${styleClasses[style] || styleClasses.solid}`} />;
        }

        if (type === "spacer") {
          return <div key={id} style={{ height: data.height || 32 }} />;
        }

        /* ------- SEO BLOCKS ------- */

        if (type === "faq") {
          const items = data.items || [];
          if (items.length === 0) return null;
          return (
            <div key={id} className="my-8 space-y-3">
              {items.map((pair: any, idx: number) => (
                <details key={idx} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all open:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <summary className="flex cursor-pointer items-center gap-2 sm:gap-3 px-4 py-3 sm:px-5 sm:py-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800/50">
                    <HelpCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="flex-1 text-xs sm:text-sm leading-snug">{pair.question}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-slate-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-slate-800">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{pair.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          );
        }

        if (type === "breadcrumb") {
          const items = data.items || [];
          if (items.length === 0) return null;
          return (
            <nav key={id} className="my-6" aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {items.map((item: any, idx: number) => {
                  const isLast = idx === items.length - 1;
                  const label = item.label || item.name || "";
                  const href = item.href || item.link || "";
                  return (
                    <li key={idx} className="flex items-center gap-1">
                      {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />}
                      {isLast || !href ? (
                        <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{label}</span>
                      ) : (
                        <Link href={href} className="hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[200px]">{label}</Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          );
        }

        if (type === "related_links") {
          const links = data.links || [];
          if (links.length === 0) return null;
          return (
            <div key={id} className="my-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">Related Links</h3>
              <ul className="space-y-2">
                {links.map((link: any, idx: number) => (
                  <li key={idx}>
                    <a href={link.url} target={link.url?.startsWith("http") ? "_blank" : undefined}
                      rel={link.url?.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
                      <span className="flex-1">{link.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (type === "cta") {
          const text = data.text || "Click Here";
          const link = data.url || "#";
          const variant = data.variant || "primary";
          const isExternal = link?.startsWith("http");
          const variantStyles: Record<string, string> = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
            outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30",
            ghost: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30",
          };
          return (
            <div key={id} className="my-8 flex justify-center">
              <a href={link} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all ${variantStyles[variant] || variantStyles.primary}`}
              >
                {text}
                {isExternal ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </a>
            </div>
          );
        }

        if (type === "table_of_contents") {
          if (headings.length < 2) return null;
          const tocTitle = data.title || "Table of Contents";
          return (
            <div key={id} className="my-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-3">
                <ListTree className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{tocTitle}</h3>
              </div>
              <nav className="space-y-1">
                {headings.map((h, idx) => (
                  <a key={idx} href={`#${h.id}`}
                    className={`block rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 ${
                      h.level > 2 ? "ml-4" : ""
                    } ${h.level > 3 ? "ml-8" : ""}`}
                  >{h.text}</a>
                ))}
              </nav>
            </div>
          );
        }

        /* ------- HYPERLOCAL DATA BLOCKS ------- */

        if (type === "district_facts") {
          const facts = data.facts || [];
          if (facts.length === 0) return null;
          return (
            <div key={id} className="my-8 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 px-4 py-3 sm:px-5 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">District Facts</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {facts.map((fact: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row px-4 py-3 sm:px-5">
                    <span className="w-full sm:w-1/2 text-sm font-bold text-slate-700 dark:text-slate-300">{fact.label}</span>
                    <span className="w-full sm:w-1/2 text-sm text-slate-600 dark:text-slate-400">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (type === "railway_stations") {
          const stations = data.stations || [];
          if (stations.length === 0) return null;
          return (
            <div key={id} className="my-8">
              <div className="mb-4 flex items-center gap-2">
                <Train className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Railway Stations</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-600 dark:text-slate-400">Station</th>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-600 dark:text-slate-400">Code</th>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-600 dark:text-slate-400">Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stations.map((s: any, idx: number) => (
                      <tr key={idx} className="bg-white transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
                          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {s.code}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-slate-600 dark:text-slate-400">{s.zone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (type === "emergency_contacts") {
          const contacts = data.contacts || [];
          if (contacts.length === 0) return null;
          return (
            <div key={id} className="my-8">
              <div className="mb-4 flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Emergency Contacts</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-red-50 dark:bg-red-950/20">
                    <tr>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-700 dark:text-slate-300">Service</th>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-700 dark:text-slate-300">Number</th>
                      <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-extrabold text-slate-700 dark:text-slate-300">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {contacts.map((c: any, idx: number) => (
                      <tr key={idx} className="bg-white transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 font-semibold text-slate-900 dark:text-white">{c.service}</td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
                          <a href={`tel:${c.number}`} className="font-bold text-blue-600 hover:underline dark:text-blue-400">{c.number}</a>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3 text-slate-600 dark:text-slate-400">{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (type === "odop_section") {
          const productName = data.product_name || "";
          const description = data.description || "";
          const image = data.image || "";
          if (!productName && !image) return null;
          return (
            <div key={id} className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row">
                {image && (
                  <div className="sm:w-2/5">
                    <img src={image} alt={productName} className="h-64 w-full object-cover sm:h-full" loading="lazy" />
                  </div>
                )}
                <div className="flex flex-col justify-center p-6 sm:w-3/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      One District One Product
                    </span>
                  </div>
                  {productName && <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{productName}</h3>}
                  {description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
                </div>
              </div>
            </div>
          );
        }

        if (type === "industries_section") {
          const industries = data.industries || [];
          if (industries.length === 0) return null;
          return (
            <div key={id} className="my-8">
              <div className="mb-4 flex items-center gap-2">
                <Factory className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Key Industries</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {industries.map((ind: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <h4 className="font-bold text-slate-900 dark:text-white break-words">{ind.name}</h4>
                    {ind.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{ind.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (type === "tourist_places") {
          const places = data.places || [];
          if (places.length === 0) return null;
          return (
            <div key={id} className="my-8">
              <div className="mb-4 flex items-center gap-2">
                <SunDim className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Tourist Places</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {places.map((p: any, idx: number) => (
                  <div key={idx} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    {p.image && <img src={p.image} alt={p.name} className="h-48 w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />}
                    <div className="p-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">{p.name}</h4>
                      {p.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (type === "popular_searches") {
          const searches = data.searches || [];
          if (searches.length === 0) return null;
          const maxCount = Math.max(...searches.map((s: any) => s.count || 0), 1);
          return (
            <div key={id} className="my-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Popular Searches</h3>
              </div>
              <div className="space-y-2">
                {searches.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{s.term}</span>
                        <span className="text-xs text-slate-400">{s.count?.toLocaleString() || 0}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${((s.count || 0) / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
