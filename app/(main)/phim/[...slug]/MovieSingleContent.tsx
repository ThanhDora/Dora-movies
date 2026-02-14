"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Movie, Episode } from "@/types";
import TrailerModal from "@/components/TrailerModal";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";

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

/** Hiển thị tên server: "Mùa 1" → "Phần 1", "Phần 1" giữ nguyên, tên khác (VieON...) giữ nguyên. */
function formatPartLabel(serverName: string): string {
  if (!serverName || serverName === "Unknown") return "Phần 1";
  const muaMatch = serverName.match(/^Mùa\s*(\d+)$/i);
  if (muaMatch) return `Phần ${muaMatch[1]}`;
  const phanMatch = serverName.match(/^Phần\s*(\d+)$/i);
  if (phanMatch) return `Phần ${phanMatch[1]}`;
  return serverName;
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
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("episodes");
  const [favorite, setFavorite] = useState(false);
  const thumb = currentMovie.thumb_url || currentMovie.poster_url || LOADING_GIF;
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
  const [activePart, setActivePart] = useState<string>(serverNames[0] ?? "");
  const currentPartList = serverNames.length > 0 ? byServer.get(activePart) || [] : [];
  const byName = useMemo(() => groupByName(currentPartList), [currentPartList]);
  const episodeNames = Array.from(byName.keys()).sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, "") || "0");
    const numB = parseInt(b.replace(/[^0-9]/g, "") || "0");
    return numA - numB || a.localeCompare(b);
  });
  const hasEpisodes = episodeNames.length > 0;
  const EPISODES_VISIBLE = 24;
  const [episodesExpanded, setEpisodesExpanded] = useState(false);
  const [partDropdownOpen, setPartDropdownOpen] = useState(false);
  const episodeNamesToShow = episodesExpanded ? episodeNames : episodeNames.slice(0, EPISODES_VISIBLE);
  const hasMoreEpisodes = episodeNames.length > EPISODES_VISIBLE;

  // Đồng bộ activePart khi serverNames thay đổi (e.g. data load)
  useEffect(() => {
    if (serverNames.length > 0 && !serverNames.includes(activePart)) {
      setActivePart(serverNames[0]);
    }
  }, [serverNames.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

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
              <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 lg:w-[220px] shrink-0 flex-wrap lg:flex-nowrap">
                {watchUrl && (
                  <Link
                    href={watchUrl}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 lg:h-12 px-4 lg:px-6 rounded-lg lg:rounded-xl bg-gradient-to-r from-[#e6b800] to-[#f5c800] hover:from-[#f5c800] hover:to-[#ffd700] text-black font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PlayIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="hidden sm:inline">Xem ngay</span>
                    <span className="sm:hidden">Xem</span>
                  </Link>
                )}
                <div className="flex gap-2 lg:flex-col lg:gap-3 flex-1 lg:flex-none">
                  {trailerId && (
                    <button
                      type="button"
                      onClick={() => setTrailerOpen(true)}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 lg:h-12 px-3 lg:px-6 rounded-lg lg:rounded-xl bg-[#1a1a1e] hover:bg-[#25252b] text-white/90 hover:text-white font-medium text-xs lg:text-sm transition-all border border-white/10 hover:border-white/20 active:scale-[0.98]"
                      title="Trailer"
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                      <span className="hidden lg:inline">Trailer</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 lg:h-12 px-3 lg:px-6 rounded-lg lg:rounded-xl font-medium text-xs lg:text-sm transition-all border active:scale-[0.98] ${
                      favorite
                        ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/40 hover:border-red-500/60"
                        : "bg-[#1a1a1e] hover:bg-[#25252b] text-white/90 hover:text-white border-white/10 hover:border-white/20"
                    }`}
                    title={favorite ? "Đã thích" : "Yêu thích"}
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" fill={favorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="hidden lg:inline">{favorite ? "Đã thích" : "Yêu thích"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 lg:h-12 px-3 lg:px-6 rounded-lg lg:rounded-xl bg-[#1a1a1e] hover:bg-[#25252b] text-white/90 hover:text-white font-medium text-xs lg:text-sm transition-all border border-white/10 hover:border-white/20 active:scale-[0.98]"
                    title="Chia sẻ"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden lg:inline">Chia sẻ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaylistModalOpen(true)}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 lg:h-12 px-3 lg:px-6 rounded-lg lg:rounded-xl bg-[#1a1a1e] hover:bg-[#25252b] text-white/90 hover:text-white font-medium text-xs lg:text-sm transition-all border border-white/10 hover:border-white/20 active:scale-[0.98]"
                    title="Thêm vào playlist"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden lg:inline">Thêm vào playlist</span>
                  </button>
                </div>
              </div>
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
                      {serverNames.length > 1 ? (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setPartDropdownOpen((o) => !o)}
                            className="flex items-center gap-2 min-h-[40px] pl-3 pr-2.5 py-2 rounded-xl bg-[#25252b] text-white/90 font-medium text-sm border border-white/10"
                          >
                            <span className="max-w-[140px] truncate">{formatPartLabel(activePart)}</span>
                            <svg className={`w-4 h-4 shrink-0 transition-transform ${partDropdownOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 12 12">
                              <path d="M6 8L1 3h10z" />
                            </svg>
                          </button>
                          {partDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setPartDropdownOpen(false)} aria-hidden />
                              <div className="absolute left-0 top-full mt-1 py-2 bg-[#25252b] rounded-xl shadow-xl border border-white/10 z-20 min-w-[160px] max-h-[220px] overflow-auto">
                                {serverNames.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setActivePart(s); setPartDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${activePart === s ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"}`}
                                  >
                                    {formatPartLabel(s)}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/70 text-sm font-medium">{formatPartLabel(activePart)}</span>
                      )}
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
                {activeTab === "gallery" && (
                  <div>
                    <p className="text-white/50 text-sm">Gallery đang được cập nhật.</p>
                  </div>
                )}
                {activeTab === "actors" && (
                  <div>
                    {currentMovie.actors && currentMovie.actors.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {currentMovie.actors.map((actor) => (
                          <Link
                            key={actor.id}
                            href={actor.url || `/dien-vien/${actor.slug}`}
                            className="group flex flex-col items-center p-4 rounded-xl bg-[#25252b] hover:bg-[#2a2a32] transition-colors"
                          >
                            <div className="w-20 h-20 rounded-full bg-[#1f1f23] mb-3 flex items-center justify-center text-white/60 text-2xl font-bold group-hover:scale-110 transition-transform">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white font-medium text-sm text-center group-hover:text-[#e6b800] transition-colors">
                              {actor.name}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">Chưa có thông tin diễn viên.</p>
                    )}
                    {currentMovie.directors && currentMovie.directors.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-white font-semibold text-base mb-4">Đạo diễn</h3>
                        <div className="flex flex-wrap gap-3">
                          {currentMovie.directors.map((director) => (
                            <Link
                              key={director.id}
                              href={director.url || `/dao-dien/${director.slug}`}
                              className="px-4 py-2 rounded-lg bg-[#25252b] hover:bg-[#2a2a32] text-white/90 hover:text-[#e6b800] transition-colors text-sm font-medium"
                            >
                              {director.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "suggestions" && (
                  <div>
                    {movie_related && movie_related.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {movie_related.map((movie) => (
                          <Link
                            key={movie.id}
                            href={movie.url || `/phim/${movie.slug}`}
                            className="group"
                          >
                            <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-[#232328] mb-2">
                              <Image
                                src={movie.thumb_url || movie.poster_url || LOADING_GIF}
                                alt={movie.name}
                                width={200}
                                height={300}
                                unoptimized={(movie.thumb_url || movie.poster_url || "").startsWith("http")}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = LOADING_GIF;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayIcon className="w-12 h-12 text-white" />
                              </div>
                            </div>
                            <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-[#e6b800] transition-colors">
                              {movie.name}
                            </p>
                            {movie.origin_name && (
                              <p className="text-white/50 text-xs mt-1 line-clamp-1">{movie.origin_name}</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">Chưa có phim đề xuất.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Comments + modal giữ nguyên */}
      </main>
      {trailerId && <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} embedUrl={`https://www.youtube.com/embed/${trailerId}`} />}
      {playlistModalOpen && (
        <AddToPlaylistModal
          movieSlug={currentMovie.slug}
          movieTitle={currentMovie.name}
          posterUrl={currentMovie.poster_url || currentMovie.thumb_url || null}
          onClose={() => setPlaylistModalOpen(false)}
        />
      )}
    </>
  );
}