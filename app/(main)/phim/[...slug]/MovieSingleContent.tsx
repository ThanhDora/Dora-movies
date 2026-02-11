"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Movie } from "@/types";
import LazyWhenInView from "@/components/LazyWhenInView";
import LazyMovieGrid from "@/components/LazyMovieGrid";
import StarRating from "@/components/StarRating";
import TrailerModal from "@/components/TrailerModal";

const LOADING_GIF = "/loading.gif";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function PlayIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

const btnPrimary = "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#c92626] hover:bg-[#d92a2a] active:bg-[#b82222] text-white font-semibold rounded-lg shadow-lg shadow-red-500/40 transition-colors touch-manipulation";

export default function MovieSingleContent({
  currentMovie,
  movie_related,
  movie_related_top,
  watchUrl,
  trailerId,
}: {
  currentMovie: Movie;
  movie_related: Movie[];
  movie_related_top: Movie[];
  watchUrl: string;
  trailerId: string | null;
}) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const thumb = currentMovie.thumb_url || currentMovie.poster_url || LOADING_GIF;
  const movieUrl = currentMovie.url || `/phim/${currentMovie.slug}`;

  return (
    <>
      <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {(currentMovie.notify || currentMovie.showtimes) && (
          <div className="mb-4 p-4 bg-[#25252b] rounded-lg text-white/90 text-sm">
            {currentMovie.showtimes && <p><strong>Lịch chiếu : </strong> {currentMovie.showtimes}</p>}
            {currentMovie.notify && <p><strong>Thông báo : </strong> {currentMovie.notify}</p>}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="shrink-0 flex justify-center lg:block">
            <div className="relative w-full max-w-[200px] sm:max-w-[240px] aspect-2/3 rounded-lg overflow-hidden bg-[#232328] group mx-auto lg:mx-0">
              {watchUrl && (
                <Link href={watchUrl} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white" title={`Xem phim ${currentMovie.name}`}>
                  <PlayIcon />
                </Link>
              )}
              <Image src={thumb} alt={currentMovie.name} width={240} height={360} unoptimized={thumb.startsWith("http")} className="object-cover w-full h-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1">{currentMovie.name}</h1>
            <h2 className="text-white/70 text-sm mb-3">{currentMovie.origin_name}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-white/60 text-sm">{currentMovie.publish_year}</span>
              {(currentMovie.regions || []).map((r) => (
                <Link key={r.id} href={r.url || `/quoc-gia/${r.slug}`} className="text-white/60 hover:text-[#ff2a14] text-sm transition-colors">{r.name}</Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {watchUrl && (
                <Link href={watchUrl} className={btnPrimary} title={`Xem phim ${currentMovie.name}`}>
                  <PlayIcon className="w-4 h-4" /><span>Xem phim</span>
                </Link>
              )}
              {trailerId && (
                <button type="button" className={btnPrimary} onClick={() => setTrailerOpen(true)}>
                  <PlayIcon className="w-4 h-4" /><span>Trailer</span>
                </button>
              )}
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2"><dt className="text-white/60 min-w-[100px]">Đạo diễn：</dt><dd className="text-white/90">{(currentMovie.directors || []).map((d, i) => (<span key={d.id}>{i > 0 && ", "}<Link href={d.url || `/dao-dien/${d.slug}`} className="hover:text-[#ff2a14]">{d.name}</Link></span>))}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60 min-w-[100px]">Diễn viên：</dt><dd className="text-white/90">{(currentMovie.actors || []).map((a, i) => (<span key={a.id}>{i > 0 && ", "}<Link href={a.url || `/dien-vien/${a.slug}`} className="hover:text-[#ff2a14]">{a.name}</Link></span>))}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60">Trạng thái：</dt><dd className="text-white/90">{currentMovie.status || ""} | {currentMovie.episode_current} | {currentMovie.episode_total}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60">Thời lượng：</dt><dd className="text-white/90">{currentMovie.episode_time}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60">Ngôn ngữ：</dt><dd className="text-white/90">{currentMovie.language} {currentMovie.quality}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60 w-[100px] shrink-0">Nội dung：</dt><dd className="text-white/80">{currentMovie.content ? stripHtml(currentMovie.content) : ""}</dd></div>
            </dl>
            <p className="mt-2 text-sm text-white/70">
              {(currentMovie.tags || []).map((t, i) => (<span key={t.id}>{i > 0 && ", "}<Link href={t.url || `/tu-khoa/${t.slug}`} className="hover:text-[#ff2a14]">{t.name}</Link></span>))}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {watchUrl && <Link href={watchUrl} className={btnPrimary} title={currentMovie.name}><PlayIcon className="w-4 h-4" /><span>Xem phim</span></Link>}
              {trailerId && <button type="button" className={btnPrimary} onClick={() => setTrailerOpen(true)}><PlayIcon className="w-4 h-4" /><span>Trailer</span></button>}
            </div>
          </div>
        </div>
        <div className="mb-8">
          <StarRating movieSlug={currentMovie.slug} initialScore={currentMovie.rating_star ?? 0} initialCount={currentMovie.rating_count ?? 0} />
        </div>
        <LazyWhenInView
          placeholder={<div className="min-h-[420px] rounded-lg bg-[#25252b]/40 animate-pulse" aria-hidden />}
          rootMargin="150px 0px"
        >
          {() => (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-3">Bình luận</h2>
                <div className="w-full bg-white rounded-lg overflow-hidden">
                  <div className="fb-comments w-full" data-href={movieUrl} data-width="100%" data-numposts={5} data-colorscheme="light" data-lazy="true" />
                </div>
                <h2 className="text-lg font-bold text-white mt-6 mb-3">Có thể bạn thích</h2>
                <LazyMovieGrid movies={movie_related} />
              </div>
              <aside className="w-full lg:w-72 shrink-0">
                <h2 className="text-lg font-bold text-white mb-3">Xem nhiều</h2>
                <div className="bg-[#25252b] rounded-lg p-3 space-y-2">
                  {movie_related_top.map((movie, idx) => {
                    const key = idx + 1;
                    const numClass = key === 1 ? "bg-[#ff2a14]" : key === 2 ? "bg-[#f2a20c]" : key === 3 ? "bg-[#148aff]" : "bg-[#32323c]";
                    return (
                      <Link key={movie.id} href={movie.url || `/phim/${movie.slug}`} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                        <span className={`w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold shrink-0 ${numClass}`}>{key}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white text-sm font-medium truncate">{movie.name}</h3>
                          <p className="text-white/50 text-xs">Lượt xem: {movie.view_total ?? 0}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </aside>
            </div>
          )}
        </LazyWhenInView>
      </main>
      {trailerId && <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} embedUrl={`https://www.youtube.com/embed/${trailerId}`} />}
    </>
  );
}
