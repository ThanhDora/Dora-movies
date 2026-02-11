"use client";

import Link from "next/link";
import Image from "next/image";
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
  const { data: session, status } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [headerSolid, setHeaderSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <header
        id="header"
        className={`fixed top-0 left-0 w-full z-50 safe-area-inset-top transition-[background-color,backdrop-filter] duration-300 ${
          headerSolid ? "bg-[#0a0d0e] backdrop-blur-sm" : "bg-transparent backdrop-blur-none"
        }`}
      >
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
              <Image src="/anime.png" alt={siteTitle} width={120} height={40} className="h-8 sm:h-10 w-auto object-contain" style={{ width: "auto" }} priority />
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
            <nav className="hidden md:flex items-center gap-0 flex-1 justify-start min-w-0 flex-wrap">
              {menu.map((item) =>
                item.children && item.children.length > 0 ? (
                  <div
                    key={item.link}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.link)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <span
                      className={`flex items-center gap-1.5 px-4 py-3 text-base font-bold whitespace-nowrap rounded transition-colors min-h-[48px] cursor-pointer ${openDropdown === item.link ? "text-amber-400 bg-white/5" : "text-white/90 hover:text-[#ff2a14] hover:bg-white/5"}`}
                      aria-expanded={openDropdown === item.link}
                      aria-haspopup="true"
                      aria-label={item.name}
                    >
                      {item.name}
                      <svg className={`w-5 h-5 shrink-0 transition-transform ${openDropdown === item.link ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 12 12">
                        <path d="M6 8L1 3h10z" />
                      </svg>
                    </span>
                    {openDropdown === item.link && (
                      <div className="absolute left-0 top-full pt-1 z-50">
                        <div className="min-w-[520px] max-w-[92vw] py-6 px-7 bg-[#25252b] rounded-xl shadow-xl border border-white/10">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
                            {item.children.map((child) => (
                              <Link
                                key={child.link}
                                href={child.link}
                                className="block py-3.5 px-3 text-white text-[15px] font-medium hover:text-[#ff2a14] hover:bg-white/5 rounded-lg transition-colors wrap-anywhere"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.link} href={item.link} className="px-3 py-2.5 text-white/90 font-bold text-sm hover:text-[#ff2a14] transition-colors whitespace-nowrap min-h-[44px] flex items-center" title={item.name}>
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
                        // eslint-disable-next-line @next/next/no-img-element
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
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out ${drawerOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeMenu}
          />
          <div
            className={`absolute left-0 top-6 w-[min(300px,85vw)] max-h-[calc(100vh-3rem)] bg-[#1e1e24] rounded-tr-2xl rounded-br-2xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-200 ease-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
            onClick={(e) => e.stopPropagation()}
            onTransitionEnd={handleDrawerTransitionEnd}
          >
            <div className="flex items-center px-3 py-3 border-b border-white/10 shrink-0">
              <button type="button" className="p-2 text-white touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0" onClick={closeMenu} aria-label="Đóng">
                <CloseIcon />
              </button>
              <Link href="/" className="flex-1 flex justify-center" onClick={closeMenu} title={siteTitle}>
                <Image src="/anime.png" alt={siteTitle} width={72} height={28} className="h-7 w-auto object-contain" />
              </Link>
              <span className="w-11 shrink-0" aria-hidden />
            </div>
            <div className="overflow-auto px-3 py-3 flex flex-col gap-2">
              {status === "loading" ? null : session?.user ? (
                <Link href="/profile" className="flex items-center gap-3 w-full min-h-[48px] px-4 py-3 rounded-xl bg-white text-[#0a0a0c] font-bold text-sm shrink-0" onClick={closeMenu}>
                  <span className="w-9 h-9 rounded-full bg-white/20 overflow-hidden flex items-center justify-center shrink-0">
                    {session.user.image ? (
                      session.user.image.startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image src={session.user.image} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <span className="text-xs text-[#0a0a0c]/80">{(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  Trang cá nhân
                </Link>
              ) : (
                <Link href="/login" className="flex items-center gap-3 w-full min-h-[48px] px-4 py-3 rounded-xl bg-white text-[#0a0a0c] font-bold text-sm shrink-0" onClick={closeMenu}>
                  <svg className="w-6 h-6 shrink-0 text-[#0a0a0c]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Thành viên
                </Link>
              )}
              <div ref={resultRef}>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-white/10 text-white placeholder-white/50 text-xs border border-white/10 outline-none focus:border-white/20"
                  placeholder="Tìm phim..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />
                {(results.length > 0 || loading) && (
                  <div className="mt-1.5 py-1.5 max-h-[180px] overflow-auto rounded-lg bg-[#25252b]">
                    {loading ? (
                      <p className="text-white/70 text-xs px-3 py-1.5">Đang tìm...</p>
                    ) : (
                      <ul>
                        {results.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={item.slug}
                              className="flex gap-2 px-3 py-2 text-white min-h-[40px] items-center active:bg-white/10 text-xs"
                              onClick={() => { setResults([]); setQuery(""); closeMenu(); }}
                            >
                              <span className="relative w-8 h-11 shrink-0 rounded overflow-hidden bg-white/10">
                                <Image src={item.image || "/placeholder.svg"} alt="" width={32} height={44} unoptimized className="object-cover w-full h-full" />
                              </span>
                              <span className="truncate">{item.title}{item.year ? ` (${item.year})` : ""}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <nav className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                {menu.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <div key={item.link} className="col-span-2">
                      <button
                        type="button"
                        onClick={() => setOpenMobileMenu((prev) => (prev === item.link ? null : item.link))}
                        className="flex items-center justify-between w-full min-h-[44px] px-3 py-2.5 text-white font-medium text-sm rounded-lg active:bg-white/10"
                      >
                        {item.name}
                        <svg className={`w-4 h-4 shrink-0 text-white/50 transition-transform ${openMobileMenu === item.link ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 12 12">
                          <path d="M6 8L1 3h10z" />
                        </svg>
                      </button>
                      {openMobileMenu === item.link && (
                        <ul className="pl-4 pb-2 space-y-0 border-l border-white/10 ml-3">
                          {item.children.map((child) => (
                            <li key={child.link}>
                              <Link
                                href={child.link}
                                className="flex items-center py-2.5 pl-3 text-white/85 text-sm min-h-[40px] active:bg-white/5 rounded-r -ml-px border-l-2 border-transparent hover:border-[#ff2a14]"
                                onClick={closeMenu}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.link}
                      href={item.link}
                      className="flex items-center min-h-[44px] px-3 py-2.5 text-white font-medium text-sm rounded-lg active:bg-white/10"
                      onClick={closeMenu}
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
