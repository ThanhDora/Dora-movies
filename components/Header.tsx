"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { search } from "@/lib/api";
import type { MenuItem } from "@/types";
import type { SearchResultItem } from "@/types";

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Header({
  menu,
  siteTitle,
}: {
  menu: MenuItem[];
  siteTitle: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setTimeout(() => setResults([]), 0);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      search(query)
        .then((data) => setResults(data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (resultRef.current && !resultRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerOpen(true));
    });
    return () => cancelAnimationFrame(id);
  }, [menuOpen]);

  const closeMenu = () => setDrawerOpen(false);
  const handleDrawerTransitionEnd = () => {
    if (menuOpen && !drawerOpen) setMenuOpen(false);
  };

  return (
    <>
      <header id="header" className="fixed top-0 left-0 w-full z-50 bg-[rgba(7,7,10,0.92)] backdrop-blur-sm safe-area-inset-top">
        <div className="h-14 md:h-[70px] flex items-center">
          <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 flex items-center justify-between md:justify-start gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-1 text-white touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
            >
              <MenuIcon />
            </button>
            <Link href="/" className="shrink-0 flex items-center" title={siteTitle}>
              <Image src="/logo.png" alt={siteTitle} width={120} height={40} className="h-8 sm:h-10 w-auto object-contain" style={{ width: "auto" }} priority />
            </Link>
            <div
              className={`hidden md:flex relative items-center flex-1 max-w-[500px] h-[45px] rounded-xl bg-white/10 ${searchOpen ? "ring-2 ring-white/20" : ""}`}
              ref={resultRef}
            >
                <input
                  type="text"
                  className="flex-1 h-full pl-4 pr-2 bg-transparent text-white placeholder-white/50 text-sm rounded-l-xl border-0 outline-none min-w-0"
                  placeholder="Tìm phim..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />
                <div className="hidden sm:flex items-center px-2 text-white/60 text-sm italic">Tìm kiếm</div>
                <div className="flex items-center justify-center w-12 h-full text-white/80 shrink-0">
                  <SearchIcon />
                </div>
                {(results.length > 0 || loading) && (
                  <div className="absolute top-full left-0 right-0 mt-1 py-4 px-5 bg-[#25252b] rounded-lg shadow-xl border border-white/5 max-h-[320px] overflow-auto">
                    {loading ? (
                      <p className="text-white/70 text-sm">Đang tìm...</p>
                    ) : (
                      <ul className="space-y-0">
                        {results.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={item.slug}
                              className="flex gap-3 p-2 rounded hover:bg-white/10 text-white min-h-[44px] items-center"
                              onClick={() => { setResults([]); setQuery(""); }}
                            >
                              <span className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-white/10">
                                <Image src={item.image || "/placeholder.svg"} alt="" width={40} height={56} unoptimized className="object-cover w-full h-full" />
                              </span>
                              <span className="text-sm truncate">{item.title}{item.year ? ` (${item.year})` : ""}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
            </div>
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-start min-w-0 flex-wrap">
              {menu.map((item) =>
                item.children && item.children.length > 0 ? (
                  <div key={item.link} className="flex items-center gap-1.5 px-2.5 py-0">
                    <label className="text-white/90 font-bold text-sm cursor-pointer whitespace-nowrap" htmlFor={`nav-select-${item.link.replace(/[^a-z0-9-]/gi, "-")}`}>
                      {item.name}
                    </label>
                    <div className="relative inline-block min-w-[100px] max-w-[120px] h-7">
                      <span className="absolute inset-0 flex items-center pl-2 pr-6 text-white/95 text-xs border border-white/15 rounded bg-transparent pointer-events-none bg-size-[12px] bg-position-[right_6px_center] bg-no-repeat" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.8)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")" }}>-- Chọn --</span>
                      <select
                        id={`nav-select-${item.link.replace(/[^a-z0-9-]/gi, "-")}`}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                        value=""
                        onChange={(e) => { const href = e.target.value; if (href) router.push(href); }}
                        aria-label={item.name}
                      >
                        <option value="">-- Chọn --</option>
                        {item.children.map((child) => (
                          <option key={child.link} value={child.link}>{child.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <Link key={item.link} href={item.link} className="px-2.5 py-2 text-white/90 font-bold text-sm hover:text-[#ff2a14] transition-colors whitespace-nowrap" title={item.name}>
                    {item.name}
                  </Link>
                )
              )}
            </nav>
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {status === "loading" ? null : session?.user ? (
                <Link href="/profile" className="flex items-center gap-2 px-2.5 py-2 text-white/90 font-bold text-sm hover:text-[#ff2a14] transition-colors whitespace-nowrap min-w-0 truncate max-w-[180px]" title={session.user.name || session.user.email}>
                  <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                    {session.user.image ? (
                      session.user.image.startsWith("data:") ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image src={session.user.image} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <span className="text-sm text-white/80">
                        {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  Trang cá nhân
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-2.5 py-2 text-white/90 font-bold text-sm hover:text-[#ff2a14] transition-colors whitespace-nowrap shrink-0">
                    Đăng nhập
                  </Link>
                  <Link href="/register" className="px-2.5 py-2 text-white/90 font-bold text-sm hover:text-[#ff2a14] transition-colors whitespace-nowrap shrink-0">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
            <button
              type="button"
              className="md:hidden p-2 text-white touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => { setSearchOpen(true); setMenuOpen(true); }}
              aria-label="Tìm kiếm"
            >
              <SearchIcon />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-100 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${drawerOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeMenu}
          />
          <div
            className={`absolute left-0 top-0 bottom-0 w-full max-w-[320px] bg-[#16161a] shadow-xl flex flex-col overflow-hidden transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
            onTransitionEnd={handleDrawerTransitionEnd}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white font-bold">Menu</span>
              <button type="button" className="p-2 text-white touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={closeMenu} aria-label="Đóng">
                <CloseIcon />
              </button>
            </div>
            <div className="p-4 border-b border-white/10" ref={resultRef}>
              <input
                type="text"
                className="w-full h-12 px-4 rounded-xl bg-white/10 text-white placeholder-white/50 text-sm border-0 outline-none"
                placeholder="Tìm phim..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
              {(results.length > 0 || loading) && (
                <div className="mt-2 py-2 max-h-[240px] overflow-auto rounded-lg bg-[#25252b]">
                  {loading ? (
                    <p className="text-white/70 text-sm px-4 py-2">Đang tìm...</p>
                  ) : (
                    <ul>
                      {results.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={item.slug}
                            className="flex gap-3 px-4 py-3 text-white min-h-[44px] items-center active:bg-white/10"
                            onClick={() => { setResults([]); setQuery(""); closeMenu(); }}
                          >
                            <span className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-white/10">
                              <Image src={item.image || "/placeholder.svg"} alt="" width={40} height={56} unoptimized className="object-cover w-full h-full" />
                            </span>
                            <span className="text-sm truncate">{item.title}{item.year ? ` (${item.year})` : ""}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <nav className="flex-1 overflow-auto p-4">
              <ul className="space-y-0">
                {menu.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <li key={item.link} className="border-b border-white/10 last:border-0">
                      <span className="block py-3 text-white/70 text-sm font-medium">{item.name}</span>
                      <ul className="pb-2 pl-2 space-y-0">
                        {item.children.map((child) => (
                          <li key={child.link}>
                            <Link
                              href={child.link}
                              className="py-2.5 pl-2 text-white min-h-[44px] flex items-center active:bg-white/10 rounded -ml-2"
                              onClick={closeMenu}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.link} className="border-b border-white/10 last:border-0">
                      <Link
                        href={item.link}
                        className="block py-3 text-white font-medium min-h-[44px] items-center active:bg-white/10 rounded"
                        onClick={closeMenu}
                      >
                        {item.name}
                      </Link>
                    </li>
                  )
                )}
              </ul>
              <div className="p-4 border-t border-white/10 flex flex-col gap-2">
                {status === "loading" ? null : session?.user ? (
                  <Link href="/profile" className="flex items-center gap-3 py-3 text-white font-medium" onClick={closeMenu}>
                    <span className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                      {session.user.image ? (
                        session.user.image.startsWith("data:") ? (
                          <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Image src={session.user.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <span className="text-base text-white/80">
                          {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    Trang cá nhân
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="block py-3 text-white font-medium" onClick={closeMenu}>
                      Đăng nhập
                    </Link>
                    <Link href="/register" className="block py-3 text-white font-medium" onClick={closeMenu}>
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
