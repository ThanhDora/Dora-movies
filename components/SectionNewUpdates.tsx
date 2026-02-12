"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import type { SectionData, Movie } from "@/types";

const LOADING_GIF = "/loading.gif";
const ROW_LIMIT = 20;
const CARD_WIDTH = 140;
const GAP = 12;
const SCROLL_INTERVAL_MS = 10000;

function MovieCardSmall({ movie }: { movie: Movie }) {
  const thumb = movie.thumb_url || movie.poster_url || "";
  const url = movie.url || `/phim/${movie.slug}`;
  return (
    <Link href={url} className="group block shrink-0 w-[100px] sm:w-[120px] md:w-[140px]" title={movie.name}>
      <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-[#232328] border border-white/10 shadow-lg">
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <Image
          src={thumb || LOADING_GIF}
          alt={movie.name}
          width={CARD_WIDTH}
          height={Math.round(CARD_WIDTH * 1.5)}
          unoptimized={thumb.startsWith("http")}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = LOADING_GIF;
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-linear-to-t from-black/90 to-transparent text-[10px] sm:text-xs text-white/95 truncate">
          {movie.name}
        </div>
        {movie.quality && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#ff2a14] text-white rounded">
            {movie.quality}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function SectionNewUpdates({ item }: { item: SectionData }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const movies = (item.data || []).slice(0, ROW_LIMIT);
  const hasMore = (item.data || []).length > ROW_LIMIT;
  const link = item.link || "/catalog";

  useEffect(() => {
    if (!scrollRef.current || movies.length <= 1 || paused) return;
    const el = scrollRef.current;
    const step = CARD_WIDTH + GAP;
    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const next = el.scrollLeft + step;
      el.scrollTo({ left: next >= maxScroll ? 0 : next, behavior: "smooth" });
    }, SCROLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [movies.length, paused]);

  if (!movies.length) return null;

  return (
    <section className="mb-10 relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-[#1a1a1f] to-[#0f0f12] p-4 sm:p-5 shadow-xl">
      <div className="absolute inset-0 pointer-events-none rounded-2xl border border-[#ff2a14]/20" aria-hidden />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-1 rounded-full bg-[#ff2a14]" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {item.label}
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#ff2a14]/20 text-[#ff2a14] rounded">
            Mới
          </span>
        </div>
        {hasMore && (
          <Link
            href={link}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff2a14] text-white text-sm font-medium hover:bg-[#ff4a24] transition-colors"
          >
            Xem thêm
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-1 scroll-smooth"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {movies.map((movie) => (
          <div key={movie.id} className="shrink-0">
            <MovieCardSmall movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
