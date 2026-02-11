"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { Movie } from "@/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function stylizedTitle(name: string): string {
  if (!name) return "";
  return name.length > 24 ? name.toUpperCase().slice(0, 24) : name.toUpperCase();
}

export default function HomeHero({
  featured: initialFeatured,
  movies,
  watchUrls = [],
}: {
  featured: Movie;
  movies: Movie[];
  watchUrls?: string[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featured = movies[currentIndex] ?? initialFeatured;

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % movies.length);
    }, 10000);
    return () => clearInterval(id);
  }, [movies.length]);

  const selectMovie = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  const thumb = featured.poster_url || featured.thumb_url || "";
  const movieUrl = featured.url || `/phim/${featured.slug}`;
  const content = featured.content ? stripHtml(featured.content) : "";

  return (
    <>
      <div className="relative w-full flex flex-col">
        <div className="relative w-full min-h-[38vh] md:min-h-[100vh] bg-black overflow-hidden flex flex-col justify-end">
          <Image
            key={featured.id}
            src={thumb}
            alt=""
            fill
            className="object-contain md:object-cover transition-opacity duration-500"
            priority={currentIndex === 0}
            unoptimized={thumb.startsWith("http")}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/30 to-transparent md:block hidden pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-40 md:h-48 bg-linear-to-t from-[#0a0d0e] to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-[1600px] mx-auto w-full px-4 sm:px-10 md:px-14 pb-6 sm:pb-8 lg:pb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 md:gap-10">
            <div className="flex-1 min-w-0 max-w-4xl lg:max-w-2xl w-full text-center md:text-left">
              <Link href={movieUrl} className="block group">
                <p
                  className="text-white/40 lg:text-white/50 text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-wider select-none mb-1"
                  style={{ textShadow: "0 0 80px rgba(0,0,0,0.9)" }}
                >
                  {stylizedTitle(featured.name)}
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 group-hover:text-[#f97316] transition-colors">
                  {featured.name}
                </h1>
                {featured.origin_name ? (
                  <p className="text-[#eab308] md:text-white/90 text-base sm:text-lg lg:text-base mb-3 md:mb-4">
                    {featured.origin_name}
                  </p>
                ) : (
                  <p className="text-[#eab308] md:text-white/80 text-base mb-3 md:mb-4">{featured.name}</p>
                )}
              </Link>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 lg:gap-2.5 mb-3 lg:mb-4">
                {featured.publish_year && (
                  <span className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 rounded bg-white/15 lg:bg-[#1f1f23] text-white text-sm lg:text-base">
                    {String(featured.publish_year)}
                  </span>
                )}
                {featured.episode_time ? (
                  <span className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 rounded bg-white/15 lg:bg-[#1f1f23] text-white text-sm lg:text-base">
                    {featured.episode_time}/tập
                  </span>
                ) : (
                  <span className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 rounded bg-white/15 lg:bg-[#1f1f23] text-white/70 text-sm lg:text-base">
                    ? phút/tập
                  </span>
                )}
                {featured.quality && (
                  <span className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 rounded bg-white/15 lg:bg-[#1f1f23] text-white text-sm lg:text-base">
                    {featured.quality}
                  </span>
                )}
                {featured.language && (
                  <span className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 rounded bg-white/15 lg:bg-[#1f1f23] text-white text-sm lg:text-base">
                    {featured.language}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-wrap gap-2.5 mb-5">
                {(featured.categories || []).map((c) => (
                  <Link
                    key={c.id}
                    href={c.url || `/the-loai/${c.slug}`}
                    className="px-4 py-2 rounded bg-black/80 lg:bg-black text-white text-base hover:opacity-90 transition-opacity"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              {content ? (
                <p className="hidden md:block max-w-2xl text-white/90 text-base sm:text-lg leading-relaxed mb-5 line-clamp-5">
                  {content}
                </p>
              ) : null}
              {(featured.directors?.length || featured.actors?.length || featured.status) ? (
                <div className="hidden md:flex flex-col gap-1.5 text-white/80 text-sm sm:text-base mb-5">
                  {featured.directors?.length ? (
                    <p>
                      <span className="text-white/60">Đạo diễn:</span>{" "}
                      {(featured.directors || []).map((d) => d.name).join(", ")}
                    </p>
                  ) : null}
                  {featured.actors?.length ? (
                    <p>
                      <span className="text-white/60">Diễn viên:</span>{" "}
                      {(featured.actors || []).slice(0, 5).map((a) => a.name).join(", ")}
                      {(featured.actors?.length ?? 0) > 5 ? "..." : ""}
                    </p>
                  ) : null}
                  {featured.status ? (
                    <p>
                      <span className="text-white/60">Trạng thái:</span> {featured.status}
                      {featured.episode_current ? ` • ${featured.episode_current}/${featured.episode_total ?? "?"} tập` : ""}
                    </p>
                  ) : null}
                  {featured.rating_star != null && featured.rating_star > 0 && (
                    <p>
                      <span className="text-white/60">Đánh giá:</span> ★ {featured.rating_star.toFixed(1)}
                      {featured.rating_count ? ` (${featured.rating_count})` : ""}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            {movies.length > 0 && (
              <div
                className="hidden lg:flex flex-row gap-2 overflow-x-auto py-1 shrink-0 min-w-0 max-w-[380px] xl:max-w-[420px] [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {movies.map((movie, idx) => {
                  const isActive = idx === currentIndex;
                  const img = movie.thumb_url || movie.poster_url || "";
                  return (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => selectMovie(idx)}
                      className={`shrink-0 w-20 h-12 xl:w-24 xl:h-14 rounded overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        isActive ? "ring-2 ring-[#f97316] ring-offset-1 ring-offset-transparent opacity-100" : "opacity-60 hover:opacity-85"
                      }`}
                      title={movie.name}
                    >
                      <div className="aspect-video relative bg-[#232328] w-full h-full">
                        <Image src={img} alt="" fill className="object-cover" sizes="96px" unoptimized={img.startsWith("http")} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {movies.length > 0 && (
        <div
          className="lg:hidden w-full bg-[#0a0d0e] md:bg-[#0d0d12] py-3 px-3 rounded-b-2xl [&::-webkit-scrollbar]:hidden overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex flex-row gap-2 sm:gap-3 justify-start min-w-max">
            {movies.map((movie, idx) => {
              const isActive = idx === currentIndex;
              const img = movie.thumb_url || movie.poster_url || "";
              return (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => selectMovie(idx)}
                  className={`shrink-0 rounded-full overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white w-11 h-11 sm:w-12 sm:h-12 ${
                    isActive ? "ring-2 ring-[#ef4444] ring-offset-1 ring-offset-[#0a0d0e]" : "grayscale opacity-60 hover:opacity-80"
                  }`}
                  title={movie.name}
                >
                  <div className="relative w-full h-full bg-[#232328]">
                    <Image src={img} alt="" fill className="object-cover" sizes="48px" unoptimized={img.startsWith("http")} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
