import Link from "next/link";
import { getBlogs } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { ShieldAlert, FileText, ArrowRight, Calendar } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Security Advisories & Utility Guides | BharatLocal",
  description: "Learn how to secure your digital transactions, verify government links, and avoid common utility bill payment scams in India.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Official Security Advisories & Utility Guides | BharatLocal",
    description: "Learn how to secure your digital transactions, verify government links, and avoid common utility bill payment scams in India.",
  },
  twitter: {
    title: "Official Security Advisories & Utility Guides | BharatLocal",
    description: "Learn how to secure your digital transactions, verify government links, and avoid common utility bill payment scams in India.",
  },
};

export const revalidate = 60; // ISR - 1 minute

export default async function BlogsPage() {
  let blogs: any[] = [];
  try {
    blogs = await getBlogs() || [];
  } catch (err) {
    console.error("Failed to load blog posts:", err);
  }

  const breadcrumbs = [
    { name: "Blog & Security Advisories" }
  ];

  return (
    <>
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <Breadcrumb items={breadcrumbs} />

        <div className="mb-10 text-center sm:text-left">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <ShieldAlert className="h-3.5 w-3.5" /> Cyber Security Index
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Security Announcements & Tutorials
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-3xl">
            Stay informed on online billing safety, step-by-step registration guidelines, and phishing warning alerts across various Indian municipality boards.
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">No articles published yet</h3>
            <p className="mt-2 text-xs text-slate-500">Sign in to the Admin Dashboard to write and publish your first article.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogs.map((post) => (
              <article
                key={post.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <span>{post.status}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold text-slate-950 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                    <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-3 text-xs leading-relaxed text-slate-650 dark:text-slate-400 line-clamp-3">
                    {post.meta_description}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Published by: <span className="text-slate-800 dark:text-slate-200">{post.author_name}</span>
                  </p>
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Read Guide
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
