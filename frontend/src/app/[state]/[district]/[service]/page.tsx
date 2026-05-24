import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { 
  ArrowRight, ExternalLink, HelpCircle, AlertTriangle, 
  CheckCircle2, Compass, Landmark 
} from "lucide-react";
import { Metadata } from "next";

interface Params {
  state: string;
  district: string;
  service: string;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const serv = await getServiceBySlug(resolvedParams.state, resolvedParams.district, resolvedParams.service);
    return {
      title: `Official ${serv.name} Link & Guide | BharatLocal`,
      description: `Step-by-step guide on how to pay or apply for ${serv.name} in ${serv.district_name} District. Access verified links and anti-fraud alerts.`,
      alternates: { canonical: `/${serv.state_slug}/${serv.district_slug}/${serv.slug}` },
      openGraph: {
        title: `Official ${serv.name} Online Portal`,
        description: `Verified login/payment gates and guidelines for ${serv.name} in ${serv.district_name} District.`,
      },
      twitter: {
        title: `Official ${serv.name} Link & Guide | BharatLocal`,
        description: `Step-by-step guide on how to pay or apply for ${serv.name} in ${serv.district_name} District. Access verified links and anti-fraud alerts.`,
      },
    };
  } catch {
    return {
      title: "Service Portal | BharatLocal",
      alternates: { canonical: `/${resolvedParams.state}/${resolvedParams.district}/${resolvedParams.service}` },
    };
  }
}

export const revalidate = 60; // ISR - 1 minute

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  let service: any = null;

  try {
    service = await getServiceBySlug(resolvedParams.state, resolvedParams.district, resolvedParams.service);
  } catch (err) {
    console.error("Failed to load service detail page:", err);
    notFound();
  }

  if (!service) {
    notFound();
  }

  const breadcrumbs = [
    { name: service.state_name, link: `/${service.state_slug}` },
    { name: service.district_name, link: `/${service.state_slug}/${service.district_slug}` },
    { name: service.name }
  ];

  // Construct FAQPage Schema
  const faqSchema = service.faqs && service.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": service.faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <>
      <Navbar />
      
      {/* FAQ Schema Injector */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <Breadcrumb items={breadcrumbs} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Service Header card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Verified Service Gateway &bull; {service.category}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                {service.name}
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Official support page for {service.district_name} District, {service.state_name}.
              </p>

              {/* Verified Link Action Box */}
              <div className="mt-8 rounded-2xl bg-slate-900 p-6 text-white dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold">Verified Official Gateway Link</h3>
                  <p className="text-[11px] text-slate-400 mt-1 truncate max-w-md">{service.official_link}</p>
                </div>
                <a
                  href={service.official_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Visit Official Website
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Fake Website Warning Box */}
            {service.warning_notes && (
              <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/10">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-red-950 text-sm sm:text-base dark:text-red-400">
                      Anti-Fraud Warning: Check URL Carefully
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-red-800 dark:text-red-300">
                      {service.warning_notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Payment/Access Guide */}
            {service.step_by_step_guide && service.step_by_step_guide.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white mb-6">
                  Step-by-Step Procedure Guide
                </h2>
                <div className="space-y-6">
                  {service.step_by_step_guide.map((step: string, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-650 dark:text-slate-300 pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {service.faqs && service.faqs.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white mb-6">
                  Frequently Asked Questions (FAQs)
                </h2>
                <div className="space-y-4">
                  {service.faqs.map((faq: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                        {faq.question}
                      </h4>
                      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-650 dark:text-slate-300 pl-5">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Related services (Span 1) */}
          <div className="space-y-8">
            {/* Quick checklist */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">Safety Checklist</h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Verify SSL lock icon in browser URL bar.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Only use direct corporate gateways or verified government gateways (.gov.in).</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Never share card PINs, OTPs, or passwords with online support agents.</span>
                </li>
              </ul>
            </div>

            {/* Related Services */}
            {service.related_services_links && service.related_services_links.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4">Related Services</h3>
                <div className="flex flex-col gap-2.5">
                  {service.related_services_links.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3 transition-colors hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-800"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {link.name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                    </a>
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
