"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import type { Movie } from "@/types";

const LOADING_GIF = "/loading.gif";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function ChevronRight() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function AnimeTreasureSection({
  title = "Kho phim hành động",
  link,
  featured,
  movies,
  watchUrl,
}: {
  title?: string;
  link: string;
  featured: Movie;
  movies: Movie[];
  watchUrl?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const thumbListRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const didSwipe = useRef(false);
  const current = movies[currentIndex] ?? featured;
  const thumb = current.poster_url || current.thumb_url || LOADING_GIF;
  const movieUrl = current.url || `/phim/${current.slug}`;
  const content = current.content ? stripHtml(current.content) : "";
  const epText = current.episode_current && current.episode_total ? `Tập ${current.episode_current}/${current.episode_total}` : current.episode_current ? `Tập ${current.episode_current}` : "";

  const selectMovie = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % movies.length);
    }, 5000);
    return () => clearInterval(id);
  }, [movies.length]);

  useEffect(() => {
    const list = thumbListRef.current;
    const thumb = activeThumbRef.current;
    if (!list || !thumb) return;
    const listWidth = list.clientWidth;
    const thumbLeft = thumb.offsetLeft;
    const thumbWidth = thumb.offsetWidth;
    const scrollLeft = thumbLeft - listWidth / 2 + thumbWidth / 2;
    list.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
  }, [currentIndex]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const delta = endX - touchStartX.current;
      const minSwipe = 50;
      if (delta < -minSwipe && movies.length > 1) {
        didSwipe.current = true;
        setCurrentIndex((i) => (i + 1) % movies.length);
      } else if (delta > minSwipe && movies.length > 1) {
        didSwipe.current = true;
        setCurrentIndex((i) => (i - 1 + movies.length) % movies.length);
      }
    },
    [movies.length]
  );

  const onCardClick = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.preventDefault();
      didSwipe.current = false;
    }
  }, []);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-1 rounded-full bg-[#eab308]" aria-hidden />
        <Link
          href={link}
          className="flex items-center gap-1.5 text-white hover:text-amber-400 transition-colors w-fit"
        >
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
          <ChevronRight />
        </Link>
      </div>
      <div className="rounded-2xl overflow-hidden bg-[#0f0f12] shadow-lg">
        <div
          className="block lg:hidden touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Link href={movieUrl} onClick={onCardClick} className="block">
          <div className="relative aspect-video w-full rounded-t-2xl overflow-hidden">
            <Image
              src={thumb}
              alt={current.name}
              fill
              className="object-cover"
              sizes="100vw"
              unoptimized={thumb.startsWith("http")}
              onError={(e) => {
                (e.target as HTMLImageElement).src = LOADING_GIF;
              }}
            />
          </div>
          <div className="p-4 pb-2">
            <h3 className="text-lg font-bold text-white leading-tight">{current.name}</h3>
            {current.origin_name && (
              <p className="text-amber-400 text-sm mt-1">{current.origin_name}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {current.publish_year && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs">
                  {String(current.publish_year)}
                </span>
              )}
              {current.quality && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs">
                  {current.quality}
                </span>
              )}
              {epText && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs">
                  {epText}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(current.categories || []).slice(0, 4).map((c) => (
                <span key={c.id} className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs">
                  {c.name}
                </span>
              ))}
            </div>
            {content ? (
              <p className="text-white/80 text-sm mt-3 leading-relaxed line-clamp-2">
                {content}
              </p>
            ) : null}
          </div>
          </Link>
        </div>
        {movies.length > 0 && (
          <div className="flex justify-center gap-1.5 py-4 lg:hidden">
            {movies.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectMovie(idx)}
                className={`w-2 h-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  idx === currentIndex ? "bg-amber-500" : "bg-white/25"
                }`}
                aria-label={`Phim ${idx + 1}`}
              />
            ))}
          </div>
        )}
        <div className="hidden lg:flex relative flex-col lg:flex-row min-h-[320px] lg:min-h-[380px]">
          <div className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-center order-2 lg:order-1 max-w-xl">
            <Link href={movieUrl} className="block group mb-3">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight group-hover:text-amber-400 transition-colors">
                {current.name}
              </h3>
              {current.origin_name && (
                <p className="text-white/60 text-base sm:text-lg mt-1">{current.origin_name}</p>
              )}
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {current.publish_year && (
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs">
                  {String(current.publish_year)}
                </span>
              )}
              {current.episode_current && current.episode_total && (
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs">
                  Mùa 1
                </span>
              )}
              {epText && (
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs">
                  {epText}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(current.categories || []).slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={c.url || `/the-loai/${c.slug}`}
                  className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs hover:bg-white/25 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            {content ? (
              <div className="mt-4">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1.5">Nội dung phim</p>
                <p className="text-white/85 text-sm sm:text-base leading-relaxed line-clamp-6">
                  {content}
                </p>
              </div>
            ) : null}
          </div>
          <div className="relative flex-1 min-h-[200px] lg:min-h-[380px] order-1 lg:order-2 lg:max-w-[65%]">
            <div className="absolute inset-0 bg-linear-to-r from-[#0f0f12] via-[#0f0f12]/80 to-transparent lg:via-transparent z-10 pointer-events-none" />
            <Image
              src={thumb}
              alt={current.name}
              fill
              className="object-cover object-right"
              sizes="(max-width: 1024px) 100vw, 65vw"
              unoptimized={thumb.startsWith("http")}
              onError={(e) => {
                (e.target as HTMLImageElement).src = LOADING_GIF;
              }}
            />
            {movies.length > 0 && (
              <div
                ref={thumbListRef}
                className="absolute bottom-0 left-0 right-0 z-20 flex gap-1.5 p-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pl-[max(0.5rem,50%-1.75rem)] pr-[max(0.5rem,50%-1.75rem)]"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {movies.map((movie, idx) => {
                  const isActive = idx === currentIndex;
                  const img = movie.thumb_url || movie.poster_url || LOADING_GIF;
                  return (
                    <button
                      key={movie.id}
                      ref={isActive ? activeThumbRef : null}
                      type="button"
                      onClick={() => selectMovie(idx)}
                      className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden transition-all duration-300 snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 [&>div]:rounded-full [&>div]:overflow-hidden ${
                        isActive ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-[#0f0f12] opacity-100" : "opacity-25 hover:opacity-50"
                      }`}
                      title={movie.name}
                    >
                      <div
                        className="relative w-full h-full bg-[#232328] rounded-full overflow-hidden"
                        style={{ transform: "translateZ(0)", clipPath: "circle(50% at 50% 50%)", WebkitClipPath: "circle(50% at 50% 50%)" }}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized={img.startsWith("http")}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = LOADING_GIF;
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
