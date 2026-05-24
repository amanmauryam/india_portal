"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Globe, Shield, Menu, X, Landmark, Compass, Award, ExternalLink } from "lucide-react";
import { search as searchApi } from "@/lib/api";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced server-side search via paginated API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await searchApi(searchQuery.trim(), 8);
        if (data && data.results) {
          setSearchResults(
            data.results.map((r: any) => ({
              type: r.type.toLowerCase(),
              title: r.title,
              link: r.url,
              subtitle: r.subtitle,
            }))
          );
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search API error:", err);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search when click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-white to-emerald-600 p-0.5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 sm:h-10 sm:w-10">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900 text-white font-bold text-base sm:text-lg">
                🇮🇳
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 sm:text-lg dark:text-white">
                Bharat<span className="text-blue-600 dark:text-blue-500">Local</span>
              </span>
              <p className="hidden sm:block text-[10px] font-medium text-slate-500 dark:text-slate-400">Hyperlocal Utility Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Home
            </Link>
            <Link
              href="/blogs"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Blog & Alerts
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Contact
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin Access
            </Link>
          </nav>

          {/* Search Trigger & Mobile Menu Toggle */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 sm:px-3 sm:w-auto md:w-64"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Search states, districts...</span>
              <span className="sm:hidden truncate max-w-[80px]">Search...</span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3.5">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Home
              </Link>
              <Link
                href="/blogs"
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Blog & Alerts
              </Link>
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Contact
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white dark:bg-slate-50 dark:text-slate-950"
              >
                <Shield className="h-4 w-4" />
                Admin Panel Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-16 backdrop-blur-sm sm:pt-28">
          <div
            ref={searchRef}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Search Input Area */}
            <div className="flex items-center border-b border-slate-200 px-4 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search states, districts, services (e.g. Varanasi, Electricity)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                ESC
              </button>
            </div>

            {/* Search Results list */}
            <div className="max-h-96 overflow-y-auto p-2">
              {!searchQuery && (
                <div className="py-12 text-center">
                  <Globe className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">Search State, District or Utility Service</p>
                  <p className="text-[10px] text-slate-400">Start typing to search hyperlocal utility pages...</p>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="py-12 text-center">
                  <Compass className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">No results found for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-[10px] text-slate-400">Try searching for other terms like &quot;UPPCL&quot;, &quot;Varanasi&quot;, or &quot;Karnataka&quot;.</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Matching Pages ({searchResults.length})
                  </div>
                  {searchResults.map((result, idx) => (
                    <Link
                      key={idx}
                      href={result.link}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {result.type === "state" && <Landmark className="h-4 w-4" />}
                          {result.type === "district" && <Globe className="h-4 w-4" />}
                          {result.type === "service" && <Award className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{result.title}</p>
                          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{result.subtitle}</p>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
