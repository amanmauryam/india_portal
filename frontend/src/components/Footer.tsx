import Link from "next/link";
import { ShieldAlert, Info, Heart, ExternalLink } from "lucide-react";
import CookiePreferencesButton from "./CookiePreferencesButton";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Anti-Fraud Public Advisory Banner */}
        <div className="mb-10 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Public Safety Advisory: Avoid Utility Disconnection Scams</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                State utility boards (UPPCL, BESCOM, etc.) will never send disconnection warnings from personal 10-digit mobile numbers or demand you download third-party remote control applications. Always verify that online payments are completed on official secure domains ending in <span className="font-semibold">.gov.in</span> or registered corporate gateways.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <span className="font-extrabold text-base text-slate-900 dark:text-white">
              Bharat<span className="text-blue-600 dark:text-blue-500">Local</span>
            </span>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Your comprehensive directory for state-wise district utility services. Discover verified administrative links, emergency numbers, local ODOP product promotions, and step-by-step service payment guides.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Portal Index</h5>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  States Directory
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Blog & Anti-Fraud Advisories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Legal</h5>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/privacy-policy" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <CookiePreferencesButton />
              </li>
            </ul>
          </div>

          {/* External Directories */}
          <div>
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">National Portals</h5>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white"
                >
                  National Portal of India
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.digitalindia.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white"
                >
                  Digital India
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} BharatLocal Hyperlocal Utility Portal. All Rights Reserved.
          </p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1 text-[11px] text-slate-400">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for Digital India.
          </p>
        </div>
      </div>
    </footer>
  );
}
