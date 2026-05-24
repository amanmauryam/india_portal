import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — BharatLocal",
  description: "Get in touch with the BharatLocal team. Reach out for support, inquiries, or feedback about our hyperlocal utility directory.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Contact Us</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Have a question, suggestion, or found an incorrect link? We&rsquo;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Email</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    General inquiries:{" "}
                    <a href="mailto:hello@bharatlocal.in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                      hello@bharatlocal.in
                    </a>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Privacy matters:{" "}
                    <a href="mailto:privacy@bharatlocal.in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                      privacy@bharatlocal.in
                    </a>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Legal:{" "}
                    <a href="mailto:legal@bharatlocal.in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                      legal@bharatlocal.in
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Office Address</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    BharatLocal Foundation
                    <br />
                    GF-07, India Tech Hub
                    <br />
                    Sector 62, Noida
                    <br />
                    Uttar Pradesh 201309, India
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Response Time</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    We aim to respond to all inquiries within 24&ndash;48 business hours. For urgent issues regarding incorrect utility links, please mark your email as &ldquo;Urgent&rdquo; in the subject line.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
