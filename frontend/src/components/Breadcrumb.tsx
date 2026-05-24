import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || (typeof window !== "undefined" ? window.location.origin : "");

interface BreadcrumbItem {
  name: string;
  link?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Generate JSON-LD Breadcrumb List Schema
  const origin = typeof window !== "undefined" ? window.location.origin : PORTAL_URL;
  const schemaList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": origin
      },
      ...items.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 2,
        "name": item.name,
        "item": item.link ? `${origin}${item.link}` : undefined
      }))
    ]
  };

  return (
    <nav className="flex flex-col gap-2.5 mb-6" aria-label="Breadcrumb">
      {/* JSON-LD breadcrumb schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaList) }}
      />
      
      <ol className="flex flex-wrap items-center gap-x-1 md:gap-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400 gap-1"
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            Home
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center min-w-0">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
              {isLast || !item.link ? (
                <span className="text-slate-900 font-extrabold truncate max-w-[120px] sm:max-w-[200px] dark:text-white">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.link}
                  className="hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[120px] sm:max-w-[200px]"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
