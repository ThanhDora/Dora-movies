"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { search } from "@/lib/api";
import type { SearchResultItem } from "@/types";

function SearchIcon() {
  return (
    <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

const SEARCH_DEBOUNCE_MS = 300;
const URL_DEBOUNCE_MS = 400;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chỉ đồng bộ từ URL vào input đúng một lần khi mount (khi vào trang hoặc back/forward)
  useEffect(() => {
    setQuery(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce gọi API search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setLoading(true);
      search(query)
        .then((data) => setResults(data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [query]);

  // Debounce cập nhật URL để tránh re-render liên tục khi gõ (gây giật/nhảy chữ trên mobile)
  useEffect(() => {
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    urlDebounceRef.current = setTimeout(() => {
      const q = query.trim();
      if (q) {
        router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
      } else {
        router.replace("/search", { scroll: false });
      }
    }, URL_DEBOUNCE_MS);
    return () => {
      if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    };
  }, [query, router]);

  // Focus input sau khi mount (trễ nhẹ tránh giật trên mobile)
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="sticky top-14 md:top-[70px] z-10 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 bg-[#0a0d0e]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 h-12 rounded-xl bg-white/10 pl-4 pr-2">
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            className="flex-1 min-w-0 h-full bg-transparent text-white placeholder-white/50 text-base outline-none border-0"
            placeholder="Tìm phim..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-label="Tìm phim"
          />
          <Link
            href="/"
            className="text-white/70 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 shrink-0"
          >
            Hủy
          </Link>
        </div>
      </div>
      <div className="mt-4">
        {!query.trim() ? (
          <p className="text-white/50 text-sm">Nhập từ khóa để tìm phim.</p>
        ) : loading ? (
          <p className="text-white/70 text-sm py-8">Đang tìm...</p>
        ) : results.length === 0 ? (
          <p className="text-white/50 text-sm py-8">Không tìm thấy kết quả.</p>
        ) : (
          <ul className="space-y-0">
            {results.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.slug}
                  className="flex gap-3 p-3 rounded-xl hover:bg-white/5 active:bg-white/10 text-white min-h-[72px] items-center"
                >
                  <span className="relative w-12 h-[72px] shrink-0 rounded-lg overflow-hidden bg-white/10">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt=""
                      width={48}
                      height={72}
                      className="object-cover w-full h-full"
                      unoptimized={item.image?.startsWith("http")}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-white block truncate">
                      {item.title}{item.year ? ` (${item.year})` : ""}
                    </span>
                    {item.original_title ? (
                      <span className="text-white/50 text-sm block truncate">{item.original_title}</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
