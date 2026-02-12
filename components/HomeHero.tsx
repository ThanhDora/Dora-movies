"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Movie } from "@/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
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
  const [scrollInstant, setScrollInstant] = useState(false);
  const featured = movies[currentIndex] ?? initialFeatured;
  const thumbListRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const thumbListMobileRef = useRef<HTMLDivElement>(null);
  const activeThumbMobileRef = useRef<HTMLButtonElement>(null);
  const mobileScrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % movies.length);
    }, 10000);
    return () => clearInterval(id);
  }, [movies.length]);

  useEffect(() => {
    const behavior: ScrollBehavior = scrollInstant ? "instant" : "smooth";
    const run = () => {
      const list = thumbListRef.current;
      const thumb = activeThumbRef.current;
      if (list && thumb) {
        const listWidth = list.clientWidth;
        const thumbLeft = thumb.offsetLeft;
        const thumbWidth = thumb.offsetWidth;
        const target = Math.max(0, Math.min(list.scrollWidth - listWidth, thumbLeft - listWidth / 2 + thumbWidth / 2));
        list.scrollTo({ left: target, behavior });
      }
      const listM = thumbListMobileRef.current;
      const thumbM = activeThumbMobileRef.current;
      if (listM && thumbM) {
        const listWidth = listM.clientWidth;
        const listRect = listM.getBoundingClientRect();
        const thumbRect = thumbM.getBoundingClientRect();
        const thumbWidth = thumbRect.width;
        const thumbLeftInView = thumbRect.left - listRect.left;
        const thumbContentLeft = listM.scrollLeft + thumbLeftInView;
        const maxScroll = listM.scrollWidth - listWidth;
        const target = Math.max(0, Math.min(maxScroll, thumbContentLeft - listWidth / 2 + thumbWidth / 2));
        listM.scrollTo({ left: target, behavior });
      }
      setScrollInstant(false);
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollInstant intentionally read once per currentIndex change
  }, [currentIndex]);

  const selectMovie = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  const touchStartX = useRef(0);
  const didSwipe = useRef(false);
  const onHeroTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  }, []);
  const onHeroTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const delta = endX - touchStartX.current;
      const minSwipe = 50;
      if (delta < -minSwipe && movies.length > 1) {
        didSwipe.current = true;
        setScrollInstant(true);
        setCurrentIndex((i) => (i + 1) % movies.length);
      } else if (delta > minSwipe && movies.length > 1) {
        didSwipe.current = true;
        setScrollInstant(true);
        setCurrentIndex((i) => (i - 1 + movies.length) % movies.length);
      }
    },
    [movies.length]
  );
  const onHeroLinkClick = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.preventDefault();
      didSwipe.current = false;
    }
  }, []);

  const updateIndexFromMobileScroll = useCallback(() => {
    const listM = thumbListMobileRef.current;
    if (!listM || movies.length === 0) return;
    const listRect = listM.getBoundingClientRect();
    const centerX = listRect.left + listRect.width / 2;
    const buttons = listM.querySelectorAll<HTMLButtonElement>("button");
    let bestIdx = 0;
    let bestDist = Infinity;
    buttons.forEach((btn, i) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const d = Math.abs(cx - centerX);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    setCurrentIndex(bestIdx);
  }, [movies.length]);

  const onMobileThumbScroll = useCallback(() => {
    if (mobileScrollEndTimer.current) clearTimeout(mobileScrollEndTimer.current);
    mobileScrollEndTimer.current = setTimeout(() => {
      mobileScrollEndTimer.current = null;
      updateIndexFromMobileScroll();
    }, 180);
  }, [updateIndexFromMobileScroll]);

  const thumb = featured.poster_url || featured.thumb_url || "";
  const movieUrl = featured.url || `/phim/${featured.slug}`;
  const content = featured.content ? stripHtml(featured.content) : "";

  return (
    <>
      <div
        className="relative w-full flex flex-col touch-pan-y lg:touch-auto"
        onTouchStart={onHeroTouchStart}
        onTouchEnd={onHeroTouchEnd}
      >
        <div className="relative w-full min-h-[38vh] md:min-h-screen bg-black overflow-hidden flex flex-col justify-end">
          <Image
            key={featured.id}
            src={thumb}
            alt=""
            fill
            className="object-contain md:object-cover transition-opacity duration-700 ease-out md:duration-500"
            priority={currentIndex === 0}
            unoptimized={thumb.startsWith("http")}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/30 to-transparent md:block hidden pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-40 md:h-48 bg-linear-to-t from-[#0a0d0e] to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-[1600px] mx-auto w-full px-4 sm:px-10 md:px-14 pb-6 sm:pb-8 lg:pb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 md:gap-10">
            <div className="flex-1 min-w-0 max-w-4xl lg:max-w-2xl w-full text-center md:text-left">
              <Link href={movieUrl} className="block group" onClick={onHeroLinkClick}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white mb-1 group-hover:text-[#f97316] transition-colors">
                  {featured.name}
                </h1>
                {featured.origin_name ? (
                  <p className="text-[#fde047] text-base sm:text-lg md:text-xl mb-3 md:mb-4 font-medium">
                    {featured.origin_name}
                  </p>
                ) : (
                  <p className="text-[#fde047] text-base sm:text-lg md:text-xl mb-3 md:mb-4 font-medium">{featured.name}</p>
                )}
              </Link>
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 lg:gap-2 mb-2 lg:mb-2.5 items-center">
                {featured.rating_star != null && featured.rating_star > 0 && (
                  <span className="inline-flex overflow-hidden">
                    <span className="bg-[#e6b800] pl-2 pr-1.5 py-1 text-black text-[10px] lg:text-xs font-bold uppercase tracking-tight">
                      IMDb
                    </span>
                    <span className="bg-[#1f1f23] pl-1.5 pr-2 py-1 text-white text-xs font-medium border border-white/10 border-l-0">
                      {featured.rating_star.toFixed(1)}
                    </span>
                  </span>
                )}
                {featured.publish_year && (
                  <span className="inline-flex items-center px-2 py-1 text-white text-xs font-medium bg-[#1f1f23] border border-white/10">
                    {String(featured.publish_year)}
                  </span>
                )}
                {featured.episode_time ? (
                  <span className="inline-flex items-center px-2 py-1 text-white text-xs font-medium bg-[#1f1f23] border border-white/10">
                    {String(featured.episode_time).toLowerCase().includes("tập")
                      ? featured.episode_time
                      : /^\d+$/.test(String(featured.episode_time).trim())
                        ? `${featured.episode_time} phút/tập`
                        : `${featured.episode_time}/tập`}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-white/70 text-xs font-medium bg-[#1f1f23] border border-white/10">
                    ? phút/tập
                  </span>
                )}
                {featured.quality && (
                  <span className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-[#f97316]/25 border border-[#f97316]/50">
                    {featured.quality}
                  </span>
                )}
                {featured.language && (
                  <span className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-[#f97316]/25 border border-[#f97316]/50">
                    {featured.language}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-wrap justify-start gap-1.5 lg:gap-2 mb-3 lg:mb-5">
                {(featured.categories || []).map((c) => (
                  <Link
                    key={c.id}
                    href={c.url || `/the-loai/${c.slug}`}
                    className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-white/15 border border-white/25 hover:bg-white/25 hover:border-white/40 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              {content ? (
                <div className="hidden md:block max-w-2xl mb-4 md:mb-5">
                  <p className="text-white/90 text-xs sm:text-sm leading-relaxed line-clamp-3 md:line-clamp-5">
                    {content}
                  </p>
                </div>
              ) : null}
              {(featured.directors?.length || featured.actors?.length || featured.status) ? (
                <div className="hidden md:flex flex-col gap-1.5 text-white/80 text-xs sm:text-sm md:text-base mb-5">
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
              <div className="hidden lg:block relative shrink-0 w-full max-w-[380px] xl:max-w-[420px]">
                <div
                  ref={thumbListRef}
                  className="flex flex-row gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden pl-[max(0.5rem,50%-2.75rem)] pr-[max(0.5rem,50%-2.75rem)]"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {movies.map((movie, idx) => {
                    const isActive = idx === currentIndex;
                    const img = movie.thumb_url || movie.poster_url || "";
                    return (
                      <button
                        key={movie.id}
                        ref={isActive ? activeThumbRef : null}
                        type="button"
                        onClick={() => selectMovie(idx)}
                        className={`shrink-0 w-20 h-12 xl:w-24 xl:h-14 rounded overflow-hidden transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? "opacity-100" : "opacity-25 hover:opacity-50"
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
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center py-1"
                  aria-hidden
                >
                  <div className="w-20 h-12 xl:w-24 xl:h-14 rounded border-2 border-[#f97316] shrink-0" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {movies.length > 0 && (
        <div className="lg:hidden w-full bg-[#0a0d0e] md:bg-[#0d0d12] py-3 rounded-b-2xl relative overflow-hidden">
          <div
            ref={thumbListMobileRef}
            className="w-full [&::-webkit-scrollbar]:hidden overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
            onScroll={onMobileThumbScroll}
            onTouchEnd={() => requestAnimationFrame(updateIndexFromMobileScroll)}
          >
            <div className="flex flex-row gap-2 sm:gap-3 justify-start min-w-max pl-[max(0.75rem,50%-1.5rem)] pr-[max(0.75rem,50%-1.5rem)]">
              {movies.map((movie, idx) => {
                const isActive = idx === currentIndex;
                const img = movie.thumb_url || movie.poster_url || "";
                return (
                  <button
                    key={movie.id}
                    ref={isActive ? activeThumbMobileRef : null}
                    type="button"
                    onClick={() => selectMovie(idx)}
                    className={`shrink-0 snap-center rounded-full overflow-hidden transition-opacity duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white w-11 h-11 sm:w-12 sm:h-12 ${isActive ? "opacity-100" : "grayscale opacity-25 hover:opacity-50"
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
        </div>
      )}
    </>
  );
}
