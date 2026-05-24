import Link from "next/link";
import type { Metadata } from "next";
import { Heart, Target, Shield, Globe, MapPin, Users, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Us — BharatLocal",
  description: "Learn about BharatLocal's mission to provide verified hyperlocal utility directories for every Indian district.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            <Heart className="h-3.5 w-3.5" /> Our Mission
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            About BharatLocal
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Making India&rsquo;s utility services accessible, verifiable, and safe for every citizen.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">Our Mission</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              To build India&rsquo;s most comprehensive, trustworthy directory of hyperlocal utility services — connecting citizens to verified payment portals, emergency contacts, and administrative resources for every district in the country.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">Our Vision</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              A digitally empowered India where every citizen can easily find, verify, and access the right government utility portal without falling prey to phishing sites or fraudulent links.
            </p>
          </div>
        </div>

        {/* What We Do */}
        <section className="mb-14">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl mb-6">What We Do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Directory Curation</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                We index state and district-level utility links — electricity boards, water departments, municipal portals — ensuring each entry is verified and current.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Anti-Fraud Alerts</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                We actively publish scam warnings and phishing alerts to help citizens identify and avoid fraudulent utility payment portals.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Public Empowerment</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                We provide step-by-step guides and safety checklists so citizens can confidently pay bills and access services online.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-14 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-950/20">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl mb-6">How It Works</h2>
          <div className="flex flex-col gap-6">
            {[
              { step: "01", title: "Select Your State", desc: "Browse India's state directory to find your region." },
              { step: "02", title: "Pick Your District", desc: "Drill down to your district for localized information." },
              { step: "03", title: "Access Utility Services", desc: "Find verified links for electricity, water, municipal services, and more." },
              { step: "04", title: "Follow Safety Guidelines", desc: "Use our anti-fraud checklists to ensure secure transactions." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
          >
            Explore States Directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
