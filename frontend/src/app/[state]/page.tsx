import Link from "next/link";
import { notFound } from "next/navigation";
import { getState } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Compass, Landmark, MapPin, ArrowRight } from "lucide-react";
import { Metadata } from "next";

const RESERVED_SLUGS = new Set(["api", "admin", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]);

interface Params {
  state: string;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  if (RESERVED_SLUGS.has(resolvedParams.state)) notFound();
  try {
    const state = await getState(resolvedParams.state);
    return {
      title: `${state.name} District Utilities Directory | BharatLocal`,
      description: state.description || `Verified utility payment links and administrative portal lists for all districts in ${state.name}.`,
      alternates: { canonical: `/${state.slug}` },
      openGraph: {
        title: `${state.name} Local Utilities Directory`,
        description: state.description || `Search utility portals, emergency hotlines, and district information in ${state.name}.`,
      },
      twitter: {
        title: `${state.name} District Utilities Directory | BharatLocal`,
        description: state.description || `Verified utility payment links and administrative portal lists for all districts in ${state.name}.`,
      },
    };
  } catch {
    return {
      title: "State Directory | BharatLocal",
      alternates: { canonical: `/${resolvedParams.state}` },
    };
  }
}

export const revalidate = 60; // ISR - 1 minute

export default async function StatePage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  if (RESERVED_SLUGS.has(resolvedParams.state)) notFound();
  let state: any = null;

  try {
    state = await getState(resolvedParams.state);
  } catch (err) {
    console.error("Failed to load state details:", err);
    notFound();
  }

  if (!state) {
    notFound();
  }

  const breadcrumbs = [
    { name: state.name }
  ];

  return (
    <>
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <Breadcrumb items={breadcrumbs} />

        {/* State Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white dark:bg-slate-950 sm:px-12 sm:py-16">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
              <Landmark className="h-3.5 w-3.5" /> State Administrative Hub
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {state.name} Directory
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
              {state.description || `Browse utilities, local industry overviews, and official registration resources for all districts in ${state.name}.`}
            </p>
          </div>
        </div>

        {/* Districts Grid */}
        <section className="mt-12">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Districts in {state.name}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select a district to view localized services, railway details, emergency lines, and local products.
            </p>
          </div>

          {!state.districts || state.districts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Compass className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-sm font-semibold text-slate-500">No districts registered</p>
              <p className="text-xs text-slate-400">No district index matches this state. Check back later or use the admin dashboard to add districts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {state.districts.map((dist: any) => (
                <Link
                  key={dist.id}
                  href={`/${state.slug}/${dist.slug}`}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <h3 className="text-base font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {dist.name} District
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
                    {dist.overview || "Access emergency listings, famous tourist landmarks, railway schedules, and local ODOP projects."}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    Explore District Intelligence
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
