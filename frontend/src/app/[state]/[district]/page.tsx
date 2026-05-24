import Link from "next/link";
import { notFound } from "next/navigation";
import { getDistrictBySlug } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { 
  Building, Phone, Train, Compass, Sparkles, AlertTriangle, 
  HelpCircle, Link as LinkIcon, ArrowRight, MapPin 
} from "lucide-react";
import { Metadata } from "next";

const RESERVED_SLUGS = new Set(["api", "admin", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]);

interface Params {
  state: string;
  district: string;
}

// Dynamic metadata generator for District SEO
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  if (RESERVED_SLUGS.has(resolvedParams.state)) notFound();
  try {
    const dist = await getDistrictBySlug(resolvedParams.state, resolvedParams.district);
    return {
      title: `${dist.name} District Utility Services & Info | BharatLocal`,
      description: dist.overview || `Access emergency numbers, ODOP information, railway stations, and utility billing details for ${dist.name} District, ${dist.state_name}.`,
      alternates: { canonical: `/${dist.state_slug}/${dist.slug}` },
      openGraph: {
        title: `${dist.name} District Portal`,
        description: dist.overview || `Administrative links, water and power billing gates for ${dist.name} District.`,
      },
      twitter: {
        title: `${dist.name} District Utility Services & Info | BharatLocal`,
        description: dist.overview || `Access emergency numbers, ODOP information, railway stations, and utility billing details for ${dist.name} District, ${dist.state_name}.`,
      },
    };
  } catch {
    return {
      title: "District Portal | BharatLocal",
      alternates: { canonical: `/${resolvedParams.state}/${resolvedParams.district}` },
    };
  }
}

export const revalidate = 60; // ISR - 1 minute

export default async function DistrictPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  if (RESERVED_SLUGS.has(resolvedParams.state)) notFound();
  let district: any = null;

  try {
    district = await getDistrictBySlug(resolvedParams.state, resolvedParams.district);
  } catch (err) {
    console.error("Failed to load district page:", err);
    notFound();
  }

  if (!district) {
    notFound();
  }

  const breadcrumbs = [
    { name: district.state_name, link: `/${district.state_slug}` },
    { name: district.name }
  ];

  return (
    <>
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <Breadcrumb items={breadcrumbs} />

        {/* District Page Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                District Intelligence Sheet
              </span>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                {district.name} District
              </h1>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-350">
                {district.overview || "Information index page for emergency listings, utility boards, railway schedules, and local attractions."}
              </p>
            </div>

            {/* Utility Services Grid */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-5 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                Verified Utility Portals
              </h2>
              
              {!district.verified_portals || district.verified_portals.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No localized utility services registered for this district yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {district.verified_portals.map((portal: any) => (
                    <a
                      key={portal.id}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                    >
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          {portal.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {portal.name}
                        </h4>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5 ml-2" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Tourism & Famous Places */}
            {district.famous_places && district.famous_places.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-5 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-emerald-600" />
                  Key Landmarks & Tourism
                </h2>
                <div className="space-y-4">
                  {district.famous_places.map((place: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-slate-200 pl-4 py-0.5 dark:border-slate-700">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{place.name}</h4>
                      <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{place.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Industries Section */}
            {district.industries_overview && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-600" />
                  Industrial Profile
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {district.industries_overview}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Columns (Span 1) */}
          <div className="space-y-8">
            
            {/* Emergency Contacts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Emergency Services
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(district.emergency_contacts || {}).map(([key, val]: any) => (
                  <div key={key} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <span className="capitalize font-bold text-slate-500 dark:text-slate-400">{key}</span>
                    <a
                      href={`tel:${val.split("/")[0].trim()}`}
                      className="font-bold text-red-600 hover:underline dark:text-red-400 flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {val}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* ODOP Showcase */}
            {district.odop && district.odop.product_name && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 overflow-hidden relative">
                <span className="inline-block bg-orange-100 text-orange-800 text-[9px] font-bold px-2 py-0.5 rounded-full mb-3 uppercase dark:bg-orange-950 dark:text-orange-300">
                  🇮🇳 One District One Product (ODOP)
                </span>
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{district.odop.product_name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {district.odop.description}
                </p>
                {district.odop.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={district.odop.image_url}
                    alt={district.odop.product_name}
                    className="mt-4 w-full h-32 object-cover rounded-xl border border-slate-100 dark:border-slate-800"
                  />
                )}
              </div>
            )}

            {/* Railway Transit Station info */}
            {district.railway_stations && district.railway_stations.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
                  <Train className="h-5 w-5 text-amber-600" />
                  Railway Station Junctions
                </h3>
                <ul className="space-y-2">
                  {district.railway_stations.map((station: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {station}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Most Searched Queries */}
            {district.most_searched_queries && district.most_searched_queries.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  Most Searched Queries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {district.most_searched_queries.map((q: string, idx: number) => (
                    <span 
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
