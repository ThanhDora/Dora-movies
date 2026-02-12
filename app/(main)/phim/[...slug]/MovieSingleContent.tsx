"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Movie, Episode } from "@/types";
import LazyWhenInView from "@/components/LazyWhenInView";
import LazyMovieGrid from "@/components/LazyMovieGrid";
import StarRating from "@/components/StarRating";
import TrailerModal from "@/components/TrailerModal";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";

const LOADING_GIF = "/loading.gif";
const FAVORITE_KEY = "dora-favorites";

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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function groupByName(eps: Episode[]): Map<string, Episode[]> {
  const m = new Map<string, Episode[]>();
  eps.forEach((ep) => {
    const name = ep.name || "";
    const list = m.get(name) || [];
    list.push(ep);
    m.set(name, list);
  });
  return m;
}

type TabId = "episodes" | "gallery" | "actors" | "suggestions";

export default function MovieSingleContent({
  currentMovie,
  movie_related,
  watchUrl,
  trailerId,
}: {
  currentMovie: Movie;
  movie_related: Movie[];
  watchUrl: string;
  trailerId: string | null;
}) {
  const { data: session } = useSession();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("episodes");
  const [favorite, setFavorite] = useState(false);
  const thumb = currentMovie.thumb_url || currentMovie.poster_url || LOADING_GIF;
  const movieUrl = currentMovie.url || `/phim/${currentMovie.slug}`;
  const episodes = currentMovie.episodes || [];
  const byServer = useMemo(() => {
    const m = new Map<string, Episode[]>();
    episodes.forEach((ep) => {
      const list = m.get(ep.server) || [];
      list.push(ep);
      m.set(ep.server, list);
    });
    return m;
  }, [episodes]);
  const serverNames = Array.from(byServer.keys()).sort();
  const firstServerList = serverNames.length ? byServer.get(serverNames[0]) || [] : [];
  const byName = useMemo(() => groupByName(firstServerList), [firstServerList]);
  const episodeNames = Array.from(byName.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const hasEpisodes = episodeNames.length > 0;
  const EPISODES_VISIBLE = 24;
  const [episodesExpanded, setEpisodesExpanded] = useState(false);
  const episodeNamesToShow = episodesExpanded ? episodeNames : episodeNames.slice(0, EPISODES_VISIBLE);
  const hasMoreEpisodes = episodeNames.length > EPISODES_VISIBLE;
  const RELATED_PER_PAGE = 20;
  const [relatedPage, setRelatedPage] = useState(1);
  const totalRelatedPages = Math.max(1, Math.ceil(movie_related.length / RELATED_PER_PAGE));
  const relatedSlice = movie_related.slice((relatedPage - 1) * RELATED_PER_PAGE, relatedPage * RELATED_PER_PAGE);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile/favorites")
        .then((r) => r.json())
        .then((data) => {
          const list = data?.items ?? [];
          setFavorite(list.some((i: { movieSlug: string }) => i.movieSlug === currentMovie.slug));
        })
        .catch(() => {});
    } else {
      try {
        const raw = localStorage.getItem(FAVORITE_KEY);
        const list: string[] = raw ? JSON.parse(raw) : [];
        setFavorite(list.includes(currentMovie.slug));
      } catch {
        setFavorite(false);
      }
    }
  }, [currentMovie.slug, session?.user?.id]);

  const toggleFavorite = useCallback(() => {
    if (session?.user?.id) {
      const next = !favorite;
      setFavorite(next);
      const url = "/api/profile/favorites";
      if (next) {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieSlug: currentMovie.slug,
            movieTitle: currentMovie.name ?? null,
            posterUrl: currentMovie.poster_url || currentMovie.thumb_url || null,
          }),
        }).catch(() => setFavorite(!next));
      } else {
        fetch(`${url}?movieSlug=${encodeURIComponent(currentMovie.slug)}`, { method: "DELETE" }).catch(() => setFavorite(!next));
      }
    } else {
      try {
        const raw = localStorage.getItem(FAVORITE_KEY);
        const list: string[] = raw ? JSON.parse(raw) : [];
        const next = list.includes(currentMovie.slug) ? list.filter((s) => s !== currentMovie.slug) : [...list, currentMovie.slug];
        localStorage.setItem(FAVORITE_KEY, JSON.stringify(next));
        setFavorite(next.includes(currentMovie.slug));
      } catch {
        //
      }
    }
  }, [currentMovie.slug, currentMovie.name, currentMovie.poster_url, currentMovie.thumb_url, favorite, session?.user?.id]);

  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: currentMovie.name, url });
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
        return;
      }
    } catch {
      //
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      return;
    } catch {
      //
    }
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      //
    }
    document.body.removeChild(textarea);
  }, [currentMovie.name]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "episodes", label: "TẬP PHIM" },
    { id: "gallery", label: "GALLERY" },
    { id: "actors", label: "DIỄN VIÊN" },
    { id: "suggestions", label: "ĐỀ XUẤT" },
  ];

  return (
    <>
      <main className="relative min-h-[60vh]">
        <div className="absolute inset-0 z-0">
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover"
            priority
            unoptimized={thumb.startsWith("http")}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/80 to-[#0a0d0e]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-3 sm:px-6 py-6 sm:py-10">
          {(currentMovie.notify || currentMovie.showtimes) && (
            <div className="mb-4 p-3 bg-[#25252b]/90 rounded-lg text-white/90 text-sm">
              {currentMovie.showtimes && <span>Lịch chiếu: {currentMovie.showtimes}</span>}
              {currentMovie.notify && <span className="ml-2">Thông báo: {currentMovie.notify.replace(/<[^>]*>/g, "")}</span>}
            </div>
          )}
          <div className="rounded-2xl bg-[#0f0f12]/95 backdrop-blur-sm border border-white/5 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
              <div className="grid grid-cols-[auto_1fr] gap-4 flex-1 min-w-0 items-start">
                <div className="relative w-[120px] sm:w-[160px] lg:w-[180px] aspect-2/3 rounded-xl overflow-hidden bg-[#232328] shadow-xl shrink-0">
                  {watchUrl && (
                    <Link href={watchUrl} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity z-10 text-white" title={currentMovie.name}>
                      <PlayIcon className="w-12 h-12" />
                    </Link>
                  )}
                  <Image src={thumb} alt="" width={180} height={270} unoptimized={thumb.startsWith("http")} className="object-cover w-full h-full" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight uppercase tracking-tight">
                    {currentMovie.name}
                  </h1>
                  {currentMovie.origin_name ? (
                    <p className="text-[#fde047] text-sm sm:text-base mt-1 font-medium">{currentMovie.origin_name}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                    {currentMovie.publish_year && (
                      <span className="inline-flex items-center px-2 py-1 text-white text-xs font-medium bg-[#1f1f23] border border-white/10">
                        {String(currentMovie.publish_year)}
                      </span>
                    )}
                    {currentMovie.episode_time ? (
                      <span className="inline-flex items-center px-2 py-1 text-white text-xs font-medium bg-[#1f1f23] border border-white/10">
                        {String(currentMovie.episode_time).toLowerCase().includes("tập")
                          ? currentMovie.episode_time
                          : /^\d+$/.test(String(currentMovie.episode_time).trim())
                            ? `${currentMovie.episode_time} phút/tập`
                            : `${currentMovie.episode_time}/tập`}
                      </span>
                    ) : null}
                    {currentMovie.episode_current != null && currentMovie.episode_total != null && (
                      <span className="inline-flex items-center px-2 py-1 text-white/90 text-xs font-medium bg-[#1f1f23] border border-white/10">
                        {String(currentMovie.episode_current).replace(/\s*[Tt]ập\s*$/i, "")}/{String(currentMovie.episode_total).replace(/\s*[Tt]ập\s*$/i, "")} tập
                      </span>
                    )}
                    {currentMovie.quality && (
                      <span className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-[#f97316]/25 border border-[#f97316]/50">
                        {currentMovie.quality}
                      </span>
                    )}
                    {currentMovie.language && (
                      <span className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-[#f97316]/25 border border-[#f97316]/50">
                        {currentMovie.language}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(currentMovie.categories || []).slice(0, 6).map((c) => (
                      <Link
                        key={c.id}
                        href={c.url || `/the-loai/${c.slug}`}
                        className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-white/15 border border-white/25 hover:bg-white/25 hover:border-white/40 transition-colors duration-200"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                  {hasEpisodes && (
                    <p className="text-white/50 text-xs mt-2">
                      Đã chiếu: {String(currentMovie.episode_current ?? episodeNames[episodeNames.length - 1] ?? "?").replace(/\s*[Tt]ập\s*$/i, "")}/{String(currentMovie.episode_total ?? episodeNames.length ?? "?").replace(/\s*[Tt]ập\s*$/i, "")} tập
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-auto shrink-0 flex flex-col items-stretch lg:items-end gap-4 lg:gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:flex-row lg:gap-3">
                  {watchUrl && (
                    <Link
                      href={watchUrl}
                      className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#fb923c] text-white font-bold text-sm transition-colors sm:col-span-2 lg:col-span-none lg:px-8 shadow-lg shadow-[#f97316]/25"
                    >
                      <PlayIcon className="w-5 h-5 shrink-0" />
                      Xem Ngay
                    </Link>
                  )}
                  {trailerId && (
                    <button
                      type="button"
                      onClick={() => setTrailerOpen(true)}
                      className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#25252b] text-white font-medium text-sm hover:bg-[#2a2a32] border border-white/10 transition-colors lg:min-h-[48px]"
                    >
                      <PlayIcon className="w-4 h-4 shrink-0" />
                      Trailer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-row lg:gap-2 lg:flex-nowrap">
                  <button type="button" onClick={toggleFavorite} className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#25252b] text-white/90 hover:bg-[#2a2a32] border border-white/5 text-sm font-medium transition-colors lg:min-w-[100px]" title="Yêu thích">
                    <HeartIcon filled={favorite} className="shrink-0" />
                    <span className="truncate">Yêu thích</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaylistModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#25252b] text-white/90 hover:bg-[#2a2a32] border border-white/5 text-sm font-medium transition-colors lg:min-w-[100px]"
                    title="Thêm vào"
                  >
                    <PlusIcon className="shrink-0" />
                    <span className="truncate">Thêm vào</span>
                  </button>
                  {playlistModalOpen && (
                    <AddToPlaylistModal
                      movieSlug={currentMovie.slug}
                      movieTitle={currentMovie.name}
                      posterUrl={currentMovie.poster_url || currentMovie.thumb_url || null}
                      onClose={() => setPlaylistModalOpen(false)}
                    />
                  )}
                  <button type="button" onClick={handleShare} className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#25252b] text-white/90 hover:bg-[#2a2a32] border border-white/5 text-sm font-medium transition-colors lg:min-w-[100px]" title="Chia sẻ">
                    <ShareIcon className="shrink-0" />
                    <span className="truncate">{shareCopied ? "Đã copy" : "Chia sẻ"}</span>
                  </button>
                  <a href="#comments" className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#25252b] text-white/90 hover:bg-[#2a2a32] border border-white/5 text-sm font-medium transition-colors lg:min-w-[100px]" title="Bình luận">
                    <CommentIcon className="shrink-0" />
                    <span className="truncate">Bình luận</span>
                  </a>
                </div>
                <div className="flex items-center justify-center lg:justify-end gap-2 text-white/80 text-sm py-1 lg:pt-1">
                  <svg className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  <span className="font-semibold">{(currentMovie.rating_star ?? 0).toFixed(1)}</span>
                  <span className="text-white/60">Đánh giá</span>
                </div>
              </div>
            </div>
            {currentMovie.content ? (
              <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-0">
                <p className="text-white/70 text-sm leading-relaxed">
                  {stripHtml(currentMovie.content)}
                </p>
              </div>
            ) : null}

            <div className="border-t border-white/10">
              <div className="flex flex-wrap gap-0">
                {tabs.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`min-h-[48px] px-4 sm:px-6 text-sm font-semibold transition-colors ${activeTab === id ? "text-amber-500 border-b-2 border-amber-500 bg-white/5" : "text-white/60 hover:text-white/90"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-4 sm:p-6">
                {activeTab === "episodes" && (
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-white/70 text-sm font-medium">MÙA 1</span>
                      <button type="button" className="min-h-[40px] px-3 py-2 rounded-xl bg-[#25252b] text-white/80 text-sm font-medium">
                        PHỤ ĐỀ
                      </button>
                    </div>
                    {hasEpisodes ? (
                      <>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {episodeNamesToShow.map((name) => {
                            const list = byName.get(name) || [];
                            const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
                            return best ? (
                              <Link
                                key={name}
                                href={`/phim/${currentMovie.slug}/${best.slug}-${best.id}`}
                                className="min-h-[48px] flex items-center justify-center rounded-xl bg-[#25252b] text-white font-medium text-sm hover:bg-[#2a2a32] transition-colors"
                              >
                                Tập {name}
                              </Link>
                            ) : null;
                          })}
                        </div>
                        {hasMoreEpisodes && (
                          <button
                            type="button"
                            onClick={() => setEpisodesExpanded((e) => !e)}
                            className="mt-3 text-sm font-medium text-[#ff2a14] hover:text-[#ff5a44] transition-colors"
                          >
                            {episodesExpanded ? "Thu gọn" : `Xem thêm (${episodeNames.length - EPISODES_VISIBLE} tập)`}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-white/50 text-sm">Chưa có tập.</p>
                    )}
                  </div>
                )}
                {activeTab === "gallery" && (
                  <p className="text-white/50 text-sm">Gallery đang cập nhật.</p>
                )}
                {activeTab === "actors" && (
                  <div className="flex flex-wrap gap-3">
                    {(currentMovie.actors || []).map((a) => (
                      <Link key={a.id} href={a.url || "#"} className="flex items-center gap-2 p-2 rounded-xl bg-[#25252b] hover:bg-[#2a2a32] transition-colors min-w-0">
                        <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white font-medium shrink-0">{a.name.charAt(0)}</span>
                        <span className="text-white text-sm truncate max-w-[120px]">{a.name}</span>
                      </Link>
                    ))}
                    {(currentMovie.actors?.length ?? 0) === 0 && <p className="text-white/50 text-sm">Chưa có thông tin diễn viên.</p>}
                  </div>
                )}
                {activeTab === "suggestions" && (
                  <LazyMovieGrid movies={relatedSlice} />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-3 sm:px-6 pb-8">
          <div id="comments" className="rounded-2xl bg-[#0f0f12]/95 backdrop-blur-sm border border-white/5 p-4 sm:p-6 mt-6">
            <StarRating movieSlug={currentMovie.slug} initialScore={currentMovie.rating_star ?? 0} initialCount={currentMovie.rating_count ?? 0} />
            <h2 className="text-lg font-bold text-white mt-4 mb-3">Bình luận</h2>
            <div className="w-full bg-white rounded-lg overflow-hidden">
              <div className="fb-comments w-full" data-href={movieUrl} data-width="100%" data-numposts={5} data-colorscheme="light" data-lazy="true" />
            </div>
          </div>
        </div>
      </main>
      {trailerId && <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} embedUrl={`https://www.youtube.com/embed/${trailerId}`} />}
    </>
  );
}
