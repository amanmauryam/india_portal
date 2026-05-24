import Link from "next/link";
import type { Metadata } from "next";
import { getStates, getBlogs } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Landmark, ShieldAlert, FileText, ArrowRight, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "BharatLocal — India Hyperlocal Utility Portal",
    description: "Find verified government utility links, emergency contacts, railway stations, and ODOP information for every Indian district.",
  },
  twitter: {
    title: "BharatLocal — India Hyperlocal Utility Portal",
    description: "Find verified government utility links, emergency contacts, railway stations, and ODOP information for every Indian district.",
  },
};

export const revalidate = 60; // Incremental Static Regeneration (ISR) - 1 minute

export default async function HomePage() {
  let states: any[] = [];
  let blogs: any[] = [];

  try {
    const [statesData, blogsData] = await Promise.all([
      getStates(3),
      getBlogs("PUBLISHED", 3)
    ]);
    states = statesData?.items || [];
    blogs = blogsData?.items || [];
  } catch (err) {
    console.error("Failed to load homepage SSR data:", err);
  }

  return (
    <>
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 py-20 text-white dark:bg-slate-950 sm:py-28">
          {/* Subtle Orange/Green Tri-color Ambient Gradients */}
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
              🇮🇳 Hyperlocal Administrative Index
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Official Utility Directories <br className="hidden sm:inline" />
              For Every Indian District
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Find verified direct government links, billing portals, emergency contacts, local railway stations, and ODOP (One District One Product) information for all Indian states and districts.
            </p>
          </div>
        </section>

        {/* States Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Browse by State Directory
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Select your state to access district-level utility connections and intelligence sheets.
              </p>
            </div>
            <Link
              href="/states"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              View All States
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {states.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-500">No states directory loaded</p>
              <p className="text-xs text-slate-400">Database connection may be loading or database needs seeding.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {states.map((state) => (
                <Link
                  key={state.id}
                  href={`/${state.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-850 dark:text-slate-300">
                    <Landmark className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{state.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
                    {state.description || "Browse electricity boards, water connections, municipality links, emergency portals, and tourist attractions."}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                    View Directory
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Security & Blogs Section */}
        <section className="border-t border-slate-200 bg-slate-50/50 py-16 dark:border-slate-800 dark:bg-slate-950/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Recent Advisories & Guides
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Official announcements and blog articles detailing online utility safety and hyperlocal guides.
                </p>
              </div>
              <Link
                href="/blogs"
                className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                View All Articles
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {blogs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500">No recent articles found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {blogs.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/30 dark:text-red-400">
                        <ShieldAlert className="h-3 w-3" /> Security Alert
                      </span>
                      <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white line-clamp-2">{post.title}</h3>
                      <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                        {post.meta_description}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 font-medium">
                        By {post.author_name} &bull; {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/blogs/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Read Guidelines
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Portal Info Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Why BharatLocal?</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Utility billing connections in India are often distributed across complex regional providers (e.g. Purvanchal Vidyut, BESCOM, local Nagar Nigams). Citizens frequently encounter duplicate/phishing websites when searching for payment gates. 
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                BharatLocal indexes these regional boards into a clean hierarchical layout (State &rarr; District &rarr; Service) with safety notes and step-by-step verified procedures to make digital interactions seamless and safe.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-500">10,000+</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Pages</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-extrabold text-amber-500">100%</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Links</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900 col-span-2">
                <p className="text-base font-bold text-slate-900 dark:text-white">Active Anti-Phishing Alerts</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Real-time warning signs for payment systems.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
