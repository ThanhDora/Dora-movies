"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Movie, Episode } from "@/types";
import LazyWhenInView from "@/components/LazyWhenInView";
import LazyMovieGrid from "@/components/LazyMovieGrid";
import StarRating from "@/components/StarRating";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import { reportEpisode } from "@/lib/api";

const PROGRESS_SAVE_INTERVAL_MS = 5000;
const FAVORITE_KEY = "dora-favorites";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${filled ? "text-red-500" : "text-white/90"}`} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function PlayIconSmall() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

const INTRO_SKIP_SECONDS = 90;

function VideoPlayerWithProgress({
  src,
  initialProgressSeconds,
  onTimeUpdate,
  onEnded,
  saveIntervalMs,
  skipIntro = false,
  introEndSeconds = INTRO_SKIP_SECONDS,
}: {
  src: string;
  initialProgressSeconds?: number;
  onTimeUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  saveIntervalMs: number;
  skipIntro?: boolean;
  introEndSeconds?: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const appliedRef = useRef(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || appliedRef.current || initialProgressSeconds == null || initialProgressSeconds <= 0) return;
    const onCanPlay = () => {
      if (appliedRef.current) return;
      const t = Math.min(initialProgressSeconds, el.duration - 1);
      if (t > 0 && isFinite(t)) {
        el.currentTime = t;
        appliedRef.current = true;
      }
    };
    el.addEventListener("loadedmetadata", onCanPlay);
    el.addEventListener("canplay", onCanPlay);
    if (el.readyState >= 2) onCanPlay();
    return () => {
      el.removeEventListener("loadedmetadata", onCanPlay);
      el.removeEventListener("canplay", onCanPlay);
    };
  }, [initialProgressSeconds]);
  const updateSkipVisible = useCallback(() => {
    const el = ref.current;
    if (!el || !skipIntro) return;
    const t = el.currentTime;
    if (t >= introEndSeconds) setShowSkipIntro(false);
    else if (el.duration && isFinite(el.duration)) setShowSkipIntro(true);
  }, [skipIntro, introEndSeconds]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !skipIntro) return;
    el.addEventListener("loadeddata", updateSkipVisible);
    el.addEventListener("playing", updateSkipVisible);
    updateSkipVisible();
    return () => {
      el.removeEventListener("loadeddata", updateSkipVisible);
      el.removeEventListener("playing", updateSkipVisible);
    };
  }, [skipIntro, updateSkipVisible]);
  const lastSaveRef = useRef(0);
  const endedTriggeredRef = useRef(false);
  const handleTimeUpdate = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const t = el.currentTime;
    setCurrentTime(t);
    if (skipIntro && t >= introEndSeconds) setShowSkipIntro(false);
    else if (skipIntro && el.duration && isFinite(el.duration) && t < introEndSeconds) setShowSkipIntro(true);
    if (onEnded && !endedTriggeredRef.current && el.duration && isFinite(el.duration) && t >= Math.max(0, el.duration - 2)) {
      endedTriggeredRef.current = true;
      onEnded();
    }
    if (onTimeUpdate) {
      const now = Date.now();
      if (now - lastSaveRef.current >= saveIntervalMs) {
        lastSaveRef.current = now;
        onTimeUpdate(t);
      }
    }
  }, [onTimeUpdate, saveIntervalMs, skipIntro, introEndSeconds, onEnded]);
  const skipIntroClick = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowSkipIntro(false);
    const target =
      el.duration != null && isFinite(el.duration) && el.duration < introEndSeconds
        ? Math.max(0, el.duration - 1)
        : introEndSeconds;
    el.currentTime = target;
    const again = () => {
      if (el.currentTime < introEndSeconds - 2) el.currentTime = target;
    };
    setTimeout(again, 200);
    if (el.paused) el.play().catch(() => {});
  }, [introEndSeconds]);
  return (
    <div className="relative w-full h-full">
      <video
        ref={ref}
        controls
        autoPlay
        className="w-full h-full"
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
      />
      {showSkipIntro && (
        <button
          type="button"
          onClick={skipIntroClick}
          className="absolute right-4 bottom-24 sm:bottom-20 z-20 px-4 py-2.5 rounded-lg bg-[#ff2a14] text-white text-sm font-semibold hover:bg-[#e02512] transition-colors shadow-lg"
        >
          Bỏ qua giới thiệu
        </button>
      )}
    </div>
  );
}

function groupEpisodesByServer(episodes: Episode[]): Map<string, Episode[]> {
  const byServer = new Map<string, Episode[]>();
  episodes.forEach((ep) => {
    const list = byServer.get(ep.server) || [];
    list.push(ep);
    byServer.set(ep.server, list);
  });
  return byServer;
}

function groupByName(eps: Episode[]): Map<string, Episode[]> {
  const byName = new Map<string, Episode[]>();
  eps.forEach((ep) => {
    const name = ep.name || "";
    const list = byName.get(name) || [];
    list.push(ep);
    byName.set(name, list);
  });
  return byName;
}

export default function EpisodeContent({
  currentMovie,
  episode,
  movie_related,
  movie_related_top,
  episodePath = null,
  initialProgressSeconds,
  isLoggedIn = false,
}: {
  currentMovie: Movie;
  episode: Episode;
  movie_related: Movie[];
  movie_related_top: Movie[];
  episodePath?: string | null;
  initialProgressSeconds?: number;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const episodes = currentMovie.episodes || [];
  const byServer = groupEpisodesByServer(episodes);
  const serverNames = Array.from(byServer.keys()).sort();
  const [activeServer, setActiveServer] = useState(episode.server);
  const [currentEpisode, setCurrentEpisode] = useState(episode);
  const [playerKey, setPlayerKey] = useState(0);
  const [reportMsg, setReportMsg] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const RELATED_PER_PAGE = 20;
  const [relatedPage, setRelatedPage] = useState(1);
  const totalRelatedPages = Math.max(1, Math.ceil(movie_related.length / RELATED_PER_PAGE));
  const relatedSlice = movie_related.slice((relatedPage - 1) * RELATED_PER_PAGE, relatedPage * RELATED_PER_PAGE);
  const lastSavedProgressRef = useRef(0);
  const reportSectionRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const [favorite, setFavorite] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [skipIntro, setSkipIntro] = useState(true);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

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

  const currentServerEpisodes = byServer.get(activeServer) || [];
  const currentServerByName = groupByName(currentServerEpisodes);
  const episodeNamesSorted = Array.from(currentServerByName.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const EPISODES_VISIBLE = 24;
  const [episodesExpanded, setEpisodesExpanded] = useState(false);
  const episodeNamesToShow = episodesExpanded ? episodeNamesSorted : episodeNamesSorted.slice(0, EPISODES_VISIBLE);
  const hasMoreEpisodes = episodeNamesSorted.length > EPISODES_VISIBLE;
  const currentEpisodeIndex = episodeNamesSorted.indexOf(currentEpisode.name || "");
  const nextEpisodePath =
    currentEpisodeIndex >= 0 && currentEpisodeIndex < episodeNamesSorted.length - 1
      ? (() => {
          const nextName = episodeNamesSorted[currentEpisodeIndex + 1];
          const list = currentServerByName.get(nextName) || [];
          const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
          return best ? `/phim/${currentMovie.slug}/${best.slug}-${best.id}` : null;
        })()
      : null;
  const sameSlugSameServer = currentServerEpisodes.filter(
    (e) => e.slug === episode.slug && e.server === episode.server
  );

  const saveProgress = useCallback(
    (seconds: number) => {
      if (!isLoggedIn || !episodePath || !currentMovie.slug || seconds < 5 || seconds <= lastSavedProgressRef.current) return;
      lastSavedProgressRef.current = seconds;
      fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieSlug: currentMovie.slug, episodePath, progressSeconds: Math.floor(seconds) }),
      }).catch(() => {});
    },
    [isLoggedIn, episodePath, currentMovie.slug]
  );

  const handleVideoEnded = useCallback(() => {
    if (autoNext && nextEpisodePath) router.push(nextEpisodePath);
  }, [autoNext, nextEpisodePath, router]);

  useEffect(() => {
    if (!autoNext || !nextEpisodePath) return;
    const raw = currentMovie.episode_time || "";
    const match = raw.match(/(\d+)/);
    const minutes = match ? Math.min(120, Math.max(5, parseInt(match[1], 10))) : 45;
    const totalSeconds = minutes * 60;
    const alreadyWatched = initialProgressSeconds ?? 0;
    const remainingSeconds = Math.max(10, totalSeconds - alreadyWatched);
    const id = setTimeout(() => {
      router.push(nextEpisodePath);
    }, remainingSeconds * 1000);
    return () => clearTimeout(id);
  }, [autoNext, nextEpisodePath, currentMovie.episode_time, currentMovie.slug, episodePath, initialProgressSeconds, router]);

  const renderPlayer = useCallback(
    (type: string, link: string, progress?: number) => {
      const url = link.replace(/^http:\/\//i, "https://");
      if (type === "embed") {
        return <iframe key={playerKey} width="100%" height="100%" src={url} frameBorder={0} allow="autoplay" allowFullScreen className="w-full h-full" />;
      }
      if (type === "m3u8" || type === "mp4") {
        return (
          <VideoPlayerWithProgress
            key={playerKey}
            src={url}
            initialProgressSeconds={progress}
            onTimeUpdate={isLoggedIn ? saveProgress : undefined}
            onEnded={autoNext && nextEpisodePath ? handleVideoEnded : undefined}
            saveIntervalMs={PROGRESS_SAVE_INTERVAL_MS}
            skipIntro={skipIntro}
          />
        );
      }
      return <iframe key={playerKey} width="100%" height="100%" src={url} frameBorder={0} allow="autoplay" allowFullScreen className="w-full h-full" />;
    },
    [playerKey, isLoggedIn, saveProgress, autoNext, nextEpisodePath, handleVideoEnded, skipIntro]
  );

  const progressForPlayer =
    episodePath && `${currentEpisode.slug}-${currentEpisode.id}` === episodePath ? initialProgressSeconds : undefined;
  const [playerContent, setPlayerContent] = useState<React.ReactNode>(() =>
    renderPlayer(episode.type, episode.link, progressForPlayer)
  );

  const chooseServer = useCallback(
    (ep: Episode) => {
      setCurrentEpisode(ep);
      setActiveServer(ep.server);
      const progress = episodePath && `${ep.slug}-${ep.id}` === episodePath ? initialProgressSeconds : undefined;
      setPlayerContent(renderPlayer(ep.type, ep.link, progress));
      setPlayerKey((k) => k + 1);
      router.push(`/phim/${currentMovie.slug}/${ep.slug}-${ep.id}`, { scroll: false });
    },
    [currentMovie.slug, router, renderPlayer, episodePath, initialProgressSeconds]
  );

  useEffect(() => {
    if (sameSlugSameServer.length) {
      const first = sameSlugSameServer[0];
      const progress =
        episodePath && `${first.slug}-${first.id}` === episodePath ? initialProgressSeconds : undefined;
      setTimeout(() => {
        setPlayerContent(renderPlayer(first.type, first.link, progress));
      }, 0);
    }
  }, [activeServer, sameSlugSameServer, renderPlayer, episodePath, initialProgressSeconds]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportSent) return;
    try {
      await reportEpisode(currentMovie.slug, `${currentEpisode.slug}-${currentEpisode.id}`, { id: currentEpisode.id, message: reportMsg });
      setReportSent(true);
    } catch {
      //
    }
  };

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${currentMovie.name} - Tập ${currentEpisode.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        showToast("Đã chia sẻ");
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Đã copy link");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Đã copy link");
      } catch {
        showToast("Không thể chia sẻ");
      }
    }
  }, [currentMovie.name, currentEpisode.name, showToast]);

  const scrollToReport = useCallback(() => {
    reportSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const selectServerAndGoFirst = useCallback(
    (serverName: string) => {
      setSeasonOpen(false);
      const eps = byServer.get(serverName) || [];
      const byN = groupByName(eps);
      const names = Array.from(byN.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const firstName = names[0];
      if (!firstName) return;
      const list = byN.get(firstName) || [];
      const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
      if (best) router.push(`/phim/${currentMovie.slug}/${best.slug}-${best.id}`);
    },
    [byServer, currentMovie.slug, router]
  );

  const movieUrl = currentMovie.url || `/phim/${currentMovie.slug}`;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-3 sm:py-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 px-4 py-2 rounded-lg bg-[#25252b] text-white text-sm font-medium shadow-lg border border-white/10 animate-in fade-in duration-200">
          {toast}
        </div>
      )}
      <div>
        <div className="min-w-0">
          {(currentMovie.notify || currentMovie.showtimes) && (
            <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-[#25252b] rounded-lg text-white/80 text-xs sm:text-sm">
              {currentMovie.showtimes && `Lịch chiếu : ${currentMovie.showtimes}`}
              {currentMovie.notify && ` | ${currentMovie.notify.replace(/<[^>]*>/g, "")}`}
            </div>
          )}
          <div
            className={
              cinemaMode
                ? "fixed inset-0 z-50 bg-black flex flex-col"
                : "w-full pb-[56.25%] relative h-0 bg-black rounded-none sm:rounded-lg overflow-hidden"
            }
          >
            {cinemaMode && (
              <div className="flex items-center justify-between px-4 py-2 bg-black/80 shrink-0">
                <span className="text-white font-medium truncate text-sm">{currentMovie.name} - Tập {currentEpisode.name}</span>
                <button type="button" onClick={() => setCinemaMode(false)} className="shrink-0 px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors">
                  Thoát rạp phim
                </button>
              </div>
            )}
            <div className={cinemaMode ? "flex-1 min-h-0 relative" : "absolute inset-0 w-full h-full"} id="player-wrapper">
              {playerContent}
            </div>
          </div>
          {cinemaMode && <div className="w-full pb-[56.25%] bg-transparent pointer-events-none" aria-hidden />}

          <div className="mt-4 sm:mt-5">
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">Tập phim</h2>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSeasonOpen((o) => !o)}
                  className="flex items-center gap-2 min-h-[44px] pl-4 pr-3 py-2 rounded-xl bg-[#25252b] text-white font-medium text-sm border border-white/10"
                >
                  <span className="max-w-[120px] sm:max-w-none truncate">{activeServer}</span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform ${seasonOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 8L1 3h10z" />
                  </svg>
                </button>
                {seasonOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSeasonOpen(false)} aria-hidden />
                    <div className="absolute left-0 top-full mt-1 py-2 bg-[#25252b] rounded-xl shadow-xl border border-white/10 z-20 min-w-[160px] max-h-[220px] overflow-auto">
                      {serverNames.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => selectServerAndGoFirst(s)}
                          className={`w-full text-left px-4 py-2.5 text-sm ${activeServer === s ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button type="button" className="min-h-[44px] px-4 py-2 rounded-xl bg-[#25252b] text-white font-medium text-sm shrink-0 border border-white/10" title="Phụ đề">
                PHỤ ĐỀ
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {episodeNamesToShow.map((name) => {
                const list = currentServerByName.get(name) || [];
                const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
                const isActive = list.some((e) => e.id === currentEpisode.id);
                return (
                  <Link
                    key={name}
                    href={best ? `/phim/${currentMovie.slug}/${best.slug}-${best.id}` : "#"}
                    className={`min-h-[48px] flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${isActive ? "bg-[#f97316] text-white ring-2 ring-[#f97316]/50" : "bg-[#25252b] text-white/90 hover:bg-[#2a2a32] border border-white/5"}`}
                  >
                    {isActive ? <PlayIconSmall /> : null}
                    <span>Tập {name}</span>
                  </Link>
                );
              })}
            </div>
            {hasMoreEpisodes && (
              <button
                type="button"
                onClick={() => setEpisodesExpanded((e) => !e)}
                className="mt-3 text-sm font-medium text-[#ff2a14] hover:text-[#ff5a44] transition-colors"
              >
                {episodesExpanded ? "Thu gọn" : `Xem thêm (${episodeNamesSorted.length - EPISODES_VISIBLE} tập)`}
              </button>
            )}
          </div>
          <div className="mt-3 sm:mt-4 overflow-x-auto pb-1 -mx-1 flex gap-2 min-h-[44px] items-center border-b border-white/10">
              <button type="button" onClick={toggleFavorite} className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-white/90 hover:bg-white/10" title="Yêu thích">
                <HeartIcon filled={favorite} />
                <span className="text-xs sm:text-sm font-medium">Yêu thích</span>
              </button>
              <button type="button" onClick={() => setPlaylistModalOpen(true)} className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-white/90 hover:bg-white/10" title="Thêm vào">
                <PlusIcon />
                <span className="text-xs sm:text-sm font-medium">Thêm vào</span>
              </button>
              {playlistModalOpen && (
                <AddToPlaylistModal
                  movieSlug={currentMovie.slug}
                  movieTitle={currentMovie.name}
                  posterUrl={currentMovie.poster_url || currentMovie.thumb_url || null}
                  onClose={() => setPlaylistModalOpen(false)}
                />
              )}
              <button type="button" onClick={handleShare} className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-white/90 hover:bg-white/10" title="Chia sẻ">
                <ShareIcon />
                <span className="text-xs sm:text-sm font-medium">Chia sẻ</span>
              </button>
              <button type="button" onClick={scrollToReport} className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-white/90 hover:bg-white/10" title="Báo lỗi">
                <FlagIcon />
                <span className="text-xs sm:text-sm font-medium">Báo lỗi</span>
              </button>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col gap-4">
            <div className="w-full max-w-[280px] mx-auto sm:mx-0 sm:float-left sm:mr-4 sm:mb-2 aspect-2/3 rounded-xl overflow-hidden bg-[#232328] shrink-0">
              {(currentMovie.poster_url || currentMovie.thumb_url) ? (
                <Image src={currentMovie.poster_url || currentMovie.thumb_url || ""} alt="" width={280} height={420} className="object-cover w-full h-full" unoptimized={(currentMovie.poster_url || currentMovie.thumb_url || "").startsWith("http")} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">Poster</div>
              )}
            </div>
            <div className="min-w-0 sm:overflow-hidden">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">{currentMovie.name}</h1>
              {currentMovie.origin_name ? <p className="text-white/60 text-sm mt-1">{currentMovie.origin_name}</p> : null}
              <div className="flex flex-wrap gap-2 mt-2">
                {currentMovie.quality ? <span className="px-2 py-1 rounded bg-white/15 text-white text-xs">{currentMovie.quality}</span> : null}
                {currentMovie.episode_time ? <span className="px-2 py-1 rounded bg-white/15 text-white text-xs">{currentMovie.episode_time}/tập</span> : null}
                {currentMovie.language ? <span className="px-2 py-1 rounded bg-white/15 text-white text-xs">{currentMovie.language}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(currentMovie.categories || []).map((c) => (
                  <Link key={c.id} href={c.url || `/the-loai/${c.slug}`} className="px-2.5 py-1 rounded-lg bg-[#25252b] text-white text-xs sm:text-sm hover:bg-[#2a2a32] transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
              {currentMovie.content ? (
                <p className="text-white/80 text-sm leading-relaxed mt-3">{stripHtml(currentMovie.content)}</p>
              ) : null}
              {(currentMovie.actors?.length ?? 0) > 0 ? (
                <div className="mt-4">
                  <h3 className="text-white font-semibold text-sm mb-2">Diễn viên</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(currentMovie.actors || []).slice(0, 8).map((a) => (
                      <Link key={a.id} href={a.url || "#"} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
                        <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs shrink-0">{a.name.charAt(0)}</span>
                        <span className="truncate max-w-[100px]">{a.name}</span>
                      </Link>
                    ))}
                    {(currentMovie.actors?.length ?? 0) > 8 ? <span className="text-white/50 text-sm">...</span> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 clear-left">
            {sameSlugSameServer.map((server, idx) => (
              <button
                key={server.id}
                type="button"
                onClick={() => chooseServer(server)}
                className={`min-h-[40px] sm:min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-sm transition-colors touch-manipulation ${currentEpisode.id === server.id ? "bg-white text-[#0a0d0e]" : "bg-[#25252b] text-white hover:bg-[#2a2a32] active:bg-[#2a2a32]"}`}
              >
                Nguồn #{idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
      <LazyWhenInView
        placeholder={<div className="mt-8 min-h-[420px] rounded-lg bg-[#25252b]/40 animate-pulse" aria-hidden />}
        rootMargin="150px 0px"
      >
        {() => (
          <div className="mt-8 flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <StarRating movieSlug={currentMovie.slug} initialScore={currentMovie.rating_star ?? 0} initialCount={currentMovie.rating_count ?? 0} />
              <h2 className="text-lg font-bold text-white mt-6 mb-3">Bình luận</h2>
              <div className="w-full bg-white rounded-lg overflow-hidden">
                <div className="fb-comments w-full" data-href={movieUrl} data-width="100%" data-numposts={5} data-colorscheme="light" />
              </div>
              <h2 className="text-lg font-bold text-white mt-6 mb-3">Báo lỗi</h2>
              <div ref={reportSectionRef}>
              {!reportSent ? (
                <form onSubmit={handleReport} className="space-y-2">
                  <textarea value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} placeholder="Nội dung báo lỗi..." rows={2} className="w-full p-2 rounded bg-[#232328] text-white border border-white/10 text-sm resize-none focus:outline-none focus:border-[#ff2a14]" />
                  <button type="submit" className="px-4 py-2 bg-[#c92626] hover:bg-[#d92a2a] text-white font-medium rounded transition-colors">Gửi báo lỗi</button>
                </form>
              ) : (
                <p className="text-white/70 text-sm">Đã gửi báo lỗi.</p>
              )}
              </div>
              <h2 className="text-lg font-bold text-white mt-6 mb-3">Có thể bạn thích</h2>
              <LazyMovieGrid movies={relatedSlice} />
              {movie_related.length > RELATED_PER_PAGE && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRelatedPage((p) => Math.max(1, p - 1))}
                    disabled={relatedPage <= 1}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Trước
                  </button>
                  <span className="text-white/70 text-sm px-2">Trang {relatedPage} / {totalRelatedPages}</span>
                  <button
                    type="button"
                    onClick={() => setRelatedPage((p) => Math.min(totalRelatedPages, p + 1))}
                    disabled={relatedPage >= totalRelatedPages}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Sau
                  </button>
                </div>
              )}
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
  );
}
