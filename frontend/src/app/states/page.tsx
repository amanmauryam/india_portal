import Link from "next/link";
import { getStates } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import Pagination from "@/components/Pagination";
import { Landmark, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All States Directory | BharatLocal",
  description: "Browse verified government utility links, emergency contacts, and district information for all Indian states.",
  alternates: { canonical: "/states" },
};

export const revalidate = 60;

const LIMIT = 12;

export default async function StatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const offset = (page - 1) * LIMIT;

  let states: any[] = [];
  let total = 0;
  try {
    const data = await getStates(LIMIT, offset);
    states = data?.items || [];
    total = data?.total || 0;
  } catch (err) {
    console.error("Failed to load states:", err);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const breadcrumbs = [{ name: "All States Directory" }];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <Breadcrumb items={breadcrumbs} />

        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            All States Directory
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Browse all Indian states to access district-level utility portals and verified government services.
          </p>
        </div>

        {states.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500">No states found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {states.map((state) => (
                <Link
                  key={state.id}
                  href={`/${state.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-850 dark:text-slate-300">
                    <Landmark className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{state.name}</h2>
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
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} basePath="/states" />
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
