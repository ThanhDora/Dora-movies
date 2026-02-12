"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("page", "1");
    const filter = searchParams.get("filter");
    if (filter) params.set("filter", filter);
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`?${params.toString()}`);
  }

  function handleClear() {
    setSearch("");
    const params = new URLSearchParams();
    params.set("page", "1");
    const filter = searchParams.get("filter");
    if (filter) params.set("filter", filter);
    router.push(`?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="mb-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm phim theo tên hoặc slug..."
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#e6b800] focus:ring-1 focus:ring-[#e6b800] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-[#e6b800] hover:bg-[#d4a800] text-[#0a0a0c] text-sm font-medium transition-colors"
        >
          Tìm kiếm
        </button>
      </div>
    </form>
  );
}
