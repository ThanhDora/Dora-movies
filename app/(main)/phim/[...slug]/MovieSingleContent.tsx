/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Movie, Episode } from "@/types";
// import LazyWhenInView from "@/components/LazyWhenInView";
// import LazyMovieGrid from "@/components/LazyMovieGrid";
// import StarRating from "@/components/StarRating";
import TrailerModal from "@/components/TrailerModal";
// import AddToPlaylistModal from "@/components/AddToPlaylistModal";

const LOADING_GIF = "/loading.gif";
const FAVORITE_KEY = "dora-favorites";

function stripHtml(html: string = ""): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function PlayIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}


function groupByName(eps: Episode[]): Map<string, Episode[]> {
  const m = new Map<string, Episode[]>();
  eps.forEach((ep) => {
    const name = ep.name || "Unknown";
    const list = m.get(name) || [];
    list.push(ep);
    m.set(name, list);
  });
  return m;
}

type TabId = "episodes" | "gallery" | "actors" | "suggestions";

export default function MovieSingleContent({
  currentMovie,
  movie_related = [],
  watchUrl,
  trailerId,
}: {
  currentMovie: Movie;
  movie_related?: Movie[];
  watchUrl: string;
  trailerId: string | null;
}) {
  const { data: session } = useSession();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("episodes");
  const [favorite, setFavorite] = useState(false);
  const thumb = currentMovie.thumb_url || currentMovie.poster_url || LOADING_GIF;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const episodes = currentMovie.episodes || [];
  const byServer = useMemo(() => {
    const m = new Map<string, Episode[]>();
    episodes.forEach((ep) => {
      const server = ep.server || "Unknown";
      const list = m.get(server) || [];
      list.push(ep);
      m.set(server, list);
    });
    return m;
  }, [episodes]);
  const serverNames = Array.from(byServer.keys()).sort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const firstServerList = serverNames.length > 0 ? byServer.get(serverNames[0]) || [] : [];
  const byName = useMemo(() => groupByName(firstServerList), [firstServerList]);
  const episodeNames = Array.from(byName.keys()).sort((a, b) => {
    // Sort numeric tốt hơn (Tập 1, Tập 2, Tập 10 không bị 1, 10, 2)
    const numA = parseInt(a.replace(/[^0-9]/g, "") || "0");
    const numB = parseInt(b.replace(/[^0-9]/g, "") || "0");
    return numA - numB || a.localeCompare(b);
  });
  const hasEpisodes = episodeNames.length > 0;
  const EPISODES_VISIBLE = 24;
  const [episodesExpanded, setEpisodesExpanded] = useState(false);
  const episodeNamesToShow = episodesExpanded ? episodeNames : episodeNames.slice(0, EPISODES_VISIBLE);
  const hasMoreEpisodes = episodeNames.length > EPISODES_VISIBLE;
  const RELATED_PER_PAGE = 20;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [relatedPage, setRelatedPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalRelatedPages = Math.max(1, Math.ceil(movie_related.length / RELATED_PER_PAGE));
  const relatedSlice = movie_related.slice((relatedPage - 1) * RELATED_PER_PAGE, relatedPage * RELATED_PER_PAGE);

  // Fix "Đã chiếu" không crash khi no episodes
  const lastEpisodeName = episodeNames.length > 0 ? episodeNames[episodeNames.length - 1] : null;
  const currentEpisode = currentMovie.episode_current ?? lastEpisodeName ?? "?";
  const totalEpisode = currentMovie.episode_total ?? episodeNames.length ?? "?";

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile/favorites")
        .then((r) => r.json())
        .then((data) => {
          const list = data?.items ?? [];
          setFavorite(list.some((i: { movieSlug: string }) => i.movieSlug === currentMovie.slug));
        })
        .catch(() => setFavorite(false));
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
    const next = !favorite;
    setFavorite(next);
    if (session?.user?.id) {
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
        const newList = next ? [...list, currentMovie.slug] : list.filter((s) => s !== currentMovie.slug);
        localStorage.setItem(FAVORITE_KEY, JSON.stringify(newList));
      } catch {
        setFavorite(!next);
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
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback old browser
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // silent
    }
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
            className="object-cover blur-sm"  // thêm blur background ngầu hơn
            priority
            unoptimized={thumb.startsWith("http")}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0a0d0e]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto px-3 sm:px-6 py-6 sm:py-10">
          {(currentMovie.notify || currentMovie.showtimes) && (
            <div className="mb-4 p-3 bg-[#25252b]/90 rounded-lg text-white/90 text-sm">
              {currentMovie.showtimes && <span>Lịch chiếu: {currentMovie.showtimes}</span>}
              {currentMovie.notify && <span className="ml-2">Thông báo: {stripHtml(currentMovie.notify)}</span>}
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
                  <Image src={thumb} alt={currentMovie.name || "Poster"} width={180} height={270} unoptimized={thumb.startsWith("http")} className="object-cover w-full h-full" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight uppercase tracking-tight">
                    {currentMovie.name || "Không có tiêu đề"}
                  </h1>
                  {currentMovie.origin_name && (
                    <p className="text-[#fde047] text-sm sm:text-base mt-1 font-medium">{currentMovie.origin_name}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                    {currentMovie.publish_year && (
                      <span className="inline-flex items-center px-2 py-1 text-white text-xs font-medium bg-[#1f1f23] border border-white/10">
                        {currentMovie.publish_year}
                      </span>
                    )}
                    {currentMovie.episode_time && (
                      <span className="inline-flex items-center px-2 py-1 text-white text-xs font-medium bg-[#1f1f23] border border-white/10">
                        {currentMovie.episode_time.includes("tập") ? currentMovie.episode_time : `${currentMovie.episode_time} phút/tập`}
                      </span>
                    )}
                    {(currentMovie.episode_current || currentMovie.episode_total) && (
                      <span className="inline-flex items-center px-2 py-1 text-white/90 text-xs font-medium bg-[#1f1f23] border border-white/10">
                        {currentEpisode}/{totalEpisode} tập
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
                      Đã chiếu: {currentEpisode}/{totalEpisode} tập
                    </p>
                  )}
                </div>
              </div>
              {/* Phần button giữ nguyên, tao không thấy lỗi */}
              ...
            </div>
            {/* Phần content + tabs giữ nguyên, chỉ fix episodes tab */}
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
                            const best = list.length > 0 ? list.sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0] : null;
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
                      <p className="text-white/50 text-sm">Chưa có tập phim.</p>
                    )}
                  </div>
                )}
                {/* Các tab khác giữ nguyên */}
              </div>
            </div>
          </div>
        </div>
        {/* Comments + modal giữ nguyên */}
      </main>
      {trailerId && <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} embedUrl={`https://www.youtube.com/embed/${trailerId}`} />}
    </>
  );
}