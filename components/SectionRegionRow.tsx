"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import type { Movie } from "@/types";

const LOADING_GIF = "/loading.gif";
const ROW_LIMIT = 20;
const CARD_WIDTH = 140;
const GAP = 12;
const SCROLL_INTERVAL_MS = 10000;

function MovieCardSmall({ movie }: { movie: Movie }) {
  const thumb = movie.thumb_url || movie.poster_url || "";
  const url = movie.url || `/phim/${movie.slug}`;
  return (
    <div className="shrink-0 w-[100px] sm:w-[120px] md:w-[140px]">
      <Link href={url} className="group block" title={movie.name}>
        <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-[#232328] shadow-lg">
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
          {movie.quality && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#ff2a14] text-white rounded">
              {movie.quality}
            </span>
          )}
        </div>
      </Link>
      <div className="mt-1.5 px-0.5">
        <Link href={url} className="block text-[10px] sm:text-xs font-semibold text-white hover:text-[#ff2a14] transition-colors line-clamp-2 mb-0.5" title={movie.name}>
          {movie.name}
        </Link>
        {movie.origin_name && (
          <p className="text-white/50 text-[9px] mb-0.5 line-clamp-1">
            {movie.origin_name}
          </p>
        )}
        {((movie.directors && movie.directors.length > 0) || (movie.actors && movie.actors.length > 0)) && (
          <div className="text-[9px] text-white/60 line-clamp-1 mt-0.5">
            {movie.directors && movie.directors.length > 0 && (
              <span>Đạo diễn: {movie.directors.slice(0, 1).map((d) => d.name).join(", ")}</span>
            )}
            {movie.directors && movie.directors.length > 0 && movie.actors && movie.actors.length > 0 && <span className="mx-1">•</span>}
            {movie.actors && movie.actors.length > 0 && (
              <span>Diễn viên: {movie.actors.slice(0, 1).map((a) => a.name).join(", ")}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const THEMES = {
  korea: { accent: "#e11d48", accentHover: "#f43f5e", border: "#e11d48", bg: "#1a0d10" },
  china: { accent: "#eab308", accentHover: "#facc15", border: "#eab308", bg: "#1a1810" },
  usuk: { accent: "#3b82f6", accentHover: "#60a5fa", border: "#3b82f6", bg: "#0d111a" },
} as const;

export type RegionRowTheme = keyof typeof THEMES;

export default function SectionRegionRow({
  title,
  link,
  movies,
  embedded = false,
  theme = "korea",
}: {
  title: string;
  link: string;
  movies: Movie[];
  embedded?: boolean;
  theme?: RegionRowTheme;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const list = movies.slice(0, ROW_LIMIT);
  const hasMore = movies.length > ROW_LIMIT;
  const colors = THEMES[theme];

  useEffect(() => {
    if (!scrollRef.current || list.length <= 1 || paused) return;
    const el = scrollRef.current;
    const step = CARD_WIDTH + GAP;
    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const next = el.scrollLeft + step;
      el.scrollTo({ left: next >= maxScroll ? 0 : next, behavior: "smooth" });
    }, SCROLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [list.length, paused]);

  if (!list.length) return null;

  const content = (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span
            className="h-9 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: colors.border }}
            aria-hidden
          />
          <h2
            className="text-lg sm:text-xl font-bold tracking-tight"
            style={{ color: colors.accent }}
          >
            {title}
          </h2>
        </div>
        {hasMore && (
          <Link
            href={link}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: colors.accent }}
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
        {list.map((movie) => (
          <div key={movie.id} className="shrink-0">
            <MovieCardSmall movie={movie} />
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: colors.bg }}>
        {content}
      </div>
    );
  }
  return (
    <section className="mb-10 relative overflow-hidden rounded-2xl p-4 sm:p-5" style={{ backgroundColor: colors.bg }}>
      {content}
    </section>
  );
}
