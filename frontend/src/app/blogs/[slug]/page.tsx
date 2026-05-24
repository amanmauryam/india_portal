import { notFound } from "next/navigation";
import { getBlog } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import BlockRenderer from "@/components/BlockRenderer";
import { Calendar, User, ShieldAlert } from "lucide-react";
import { Metadata } from "next";

interface Params {
  slug: string;
}

// Generate dynamic metadata for Blog Post SEO
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const post = await getBlog(resolvedParams.slug);
    return {
      title: post.meta_title || `${post.title} | BharatLocal`,
      description: post.meta_description || "Cyber security announcement or helpful hyperlocal utility guides.",
      alternates: { canonical: `/blogs/${post.slug}` },
      openGraph: {
        title: post.og_title || post.meta_title || post.title,
        description: post.og_description || post.meta_description,
        images: post.og_image ? [{ url: post.og_image, width: 1200, height: 630 }] : [],
      },
      twitter: {
        title: post.meta_title || `${post.title} | BharatLocal`,
        description: post.meta_description || "Cyber security announcement or helpful hyperlocal utility guides.",
      },
    };
  } catch {
    return {
      title: "Security Advisories | BharatLocal",
      alternates: { canonical: `/blogs/${resolvedParams.slug}` },
    };
  }
}

export const revalidate = 60; // ISR - 1 minute

export default async function BlogDetailPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  let post: any = null;

  try {
    post = await getBlog(resolvedParams.slug);
  } catch (err) {
    console.error("Failed to load blog post details:", err);
    notFound();
  }

  if (!post) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Blog & Security Advisories", link: "/blogs" },
    { name: post.title }
  ];

  return (
    <>
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <Breadcrumb items={breadcrumbs} />

        <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
          
          {/* Header Metadata */}
          <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/30 dark:text-red-400">
              <ShieldAlert className="h-3 w-3" /> Anti-Fraud Advisory
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3.5xl leading-tight">
              {post.title}
            </h1>
            
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Written by: <span className="text-slate-850 dark:text-slate-300">{post.author_name}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </header>

          {/* Dynamic Block-based Content Body */}
          <div className="mt-8">
            <BlockRenderer blocks={post.content_blocks} />
          </div>
          
        </article>
      </main>

      <Footer />
    </>
  );
}
