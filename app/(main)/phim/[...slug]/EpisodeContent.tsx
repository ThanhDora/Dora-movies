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

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

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
  const [showControls, setShowControls] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMouseEnter = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    setShowControls(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    hideControlsTimerRef.current = setTimeout(() => setShowControls(false), 400);
  }, []);
  useEffect(() => () => { if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current); }, []);
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
    if (el.duration && isFinite(el.duration)) setDuration(el.duration);
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
    if (el.paused) el.play().catch(() => { });
  }, [introEndSeconds]);
  const togglePlay = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => { });
    else el.pause();
  }, []);
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    const p = parseFloat(e.target.value);
    if (el.duration && isFinite(el.duration)) {
      el.currentTime = (p / 100) * el.duration;
      setCurrentTime(el.currentTime);
    }
  }, []);
  const seekPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const handlePointerDown = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    setShowControls(true);
  }, []);
  return (
    <div className="relative w-full h-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handlePointerDown} onClick={handlePointerDown}>
      <video
        ref={ref}
        autoPlay
        className="w-full h-full"
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => { const d = (e.target as HTMLVideoElement).duration; if (isFinite(d)) setDuration(d); }}
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
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col justify-end bg-linear-to-t from-black/90 to-transparent pt-8 pb-2 px-3 transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <input
          type="range"
          min={0}
          max={100}
          value={seekPercent}
          onChange={handleSeek}
          className="w-full h-1.5 accent-[#f97316] cursor-pointer mb-2"
        />
        <div className="flex items-center gap-3">
          <button type="button" onClick={togglePlay} className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors" aria-label={isPlaying ? "Tạm dừng" : "Phát"}>
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <span className="text-white text-sm tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>
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
  episodePath = null,
  initialProgressSeconds,
  isLoggedIn = false,
}: {
  currentMovie: Movie;
  episode: Episode;
  movie_related: Movie[];
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
  const [episodesSheetOpen, setEpisodesSheetOpen] = useState(false);
  const [playerOverlayVisible, setPlayerOverlayVisible] = useState(false);
  const playerOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        .catch(() => { });
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
      }).catch(() => { });
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

  const showPlayerOverlay = useCallback(() => {
    if (playerOverlayTimerRef.current) {
      clearTimeout(playerOverlayTimerRef.current);
      playerOverlayTimerRef.current = null;
    }
    setPlayerOverlayVisible(true);
    playerOverlayTimerRef.current = setTimeout(() => {
      setPlayerOverlayVisible(false);
      playerOverlayTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => () => { if (playerOverlayTimerRef.current) clearTimeout(playerOverlayTimerRef.current); }, []);

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
                ? `fixed inset-0 z-50 bg-black flex flex-col group ${playerOverlayVisible ? "player-overlay-visible" : ""}`
                : `w-full pb-[56.25%] relative h-0 bg-black rounded-none sm:rounded-lg overflow-hidden group ${playerOverlayVisible ? "player-overlay-visible" : ""}`
            }
          >
            {cinemaMode && (
              <div className="player-show-controls-on-hover player-controls-mobile-dim flex items-center justify-between px-4 py-2 bg-black/80 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                <span className="text-white font-medium truncate text-sm">{currentMovie.name} - Tập {currentEpisode.name}</span>
                <button type="button" onClick={() => setCinemaMode(false)} className="shrink-0 px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors">
                  Thoát rạp phim
                </button>
              </div>
            )}
            <div className={`${cinemaMode ? "flex-1 min-h-0 relative" : "absolute inset-0 w-full h-full"} overflow-hidden`} id="player-wrapper" onTouchStart={showPlayerOverlay} onClick={showPlayerOverlay}>
              {playerContent}
              <button
                type="button"
                onClick={() => { setSeasonOpen(false); setEpisodesSheetOpen(true); }}
                className="player-show-controls-on-hover player-controls-mobile-dim absolute right-1 top-1 sm:right-2 sm:top-2 z-20 flex items-center gap-0.5 min-h-[24px] sm:min-h-[32px] px-1.5 py-0.5 sm:px-2.5 sm:py-1.5 rounded bg-black/50 text-white/85 text-[9px] sm:text-xs font-medium hover:bg-black/60 hover:text-white transition-opacity duration-200 opacity-0 group-hover:opacity-100 touch-manipulation border border-white/10"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Tập
              </button>
              {episodesSheetOpen && (
                <>
                  <div className="absolute inset-0 z-20 bg-black/50" onClick={() => setEpisodesSheetOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-0 bottom-0 z-21 w-[72%] max-w-[260px] sm:w-[85%] sm:max-w-[340px] flex flex-col bg-[#1a1a1e]/85 backdrop-blur-sm border-l border-white/10 shadow-2xl sheet-slide-from-right">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b border-white/10 shrink-0 h-[60px]">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white/90 font-semibold text-sm sm:text-base leading-tight line-clamp-2">{currentMovie.name}</h3>
                        <p className="text-[#fde047] font-medium text-xs sm:text-sm mt-0.5">Đang xem: Tập {currentEpisode.name}</p>
                      </div>
                      <button type="button" onClick={() => setEpisodesSheetOpen(false)} className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto px-3 pt-2.5 pb-5">
                      <div className="flex flex-col gap-2">
                        {episodeNamesSorted.map((name) => {
                          const list = currentServerByName.get(name) || [];
                          const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
                          const isActive = list.some((e) => e.id === currentEpisode.id);
                          const thumb = currentMovie.poster_url || currentMovie.thumb_url || "";
                          return (
                            <Link
                              key={name}
                              href={best ? `/phim/${currentMovie.slug}/${best.slug}-${best.id}` : "#"}
                              onClick={() => setEpisodesSheetOpen(false)}
                              className={`flex items-center gap-3 rounded-xl overflow-hidden transition-colors touch-manipulation active:scale-[0.98] min-h-0 ${isActive ? "bg-[#f97316]/20 ring-1 ring-[#f97316]/60" : "bg-[#25252b]/80 hover:bg-[#2a2a32]/80 border border-white/5"}`}
                            >
                              <div className="relative w-20 shrink-0 aspect-video rounded-lg overflow-hidden bg-[#232328]">
                                {thumb ? (
                                  <Image src={thumb} alt="" width={80} height={45} className="object-cover w-full h-full" unoptimized={thumb.startsWith("http")} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">T{name}</div>
                                )}
                                {isActive ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <PlayIconSmall />
                                  </div>
                                ) : null}
                              </div>
                              <span className={`flex-1 min-w-0 truncate text-sm font-semibold py-3 pr-3 ${isActive ? "text-[#f97316]" : "text-white/90"}`}>Tập {name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {cinemaMode && <div className="w-full pb-[56.25%] bg-transparent pointer-events-none" aria-hidden />}

          <div className="mt-6 sm:mt-8">
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight line-clamp-2">{currentMovie.name}</h2>
            <p className="text-[#fde047] font-medium text-sm mt-1 mb-3">Đang xem: Tập {currentEpisode.name}</p>
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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2">
              {episodeNamesToShow.map((name) => {
                const list = currentServerByName.get(name) || [];
                const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
                const isActive = list.some((e) => e.id === currentEpisode.id);
                return (
                  <Link
                    key={name}
                    href={best ? `/phim/${currentMovie.slug}/${best.slug}-${best.id}` : "#"}
                    className={`min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-1 px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors touch-manipulation active:scale-[0.98] ${isActive ? "bg-[#f97316] text-white ring-2 ring-[#f97316]/50" : "bg-[#25252b] text-white/90 hover:bg-[#2a2a32] border border-white/5"}`}
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
          <div className="mt-5 sm:mt-6 overflow-x-auto pb-1 -mx-1 flex gap-2 min-h-[44px] items-center border-b border-white/10 touch-manipulation">
            <button type="button" onClick={toggleFavorite} className="shrink-0 flex items-center gap-1.5 min-h-[44px] px-3 py-2.5 rounded-xl text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors" title="Yêu thích">
              <HeartIcon filled={favorite} />
              <span className="text-xs sm:text-sm font-medium">Yêu thích</span>
            </button>
            <button type="button" onClick={() => setPlaylistModalOpen(true)} className="shrink-0 flex items-center gap-1.5 min-h-[44px] px-3 py-2.5 rounded-xl text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors" title="Thêm vào">
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
            <button type="button" onClick={handleShare} className="shrink-0 flex items-center gap-1.5 min-h-[44px] px-3 py-2.5 rounded-xl text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors" title="Chia sẻ">
              <ShareIcon />
              <span className="text-xs sm:text-sm font-medium">Chia sẻ</span>
            </button>
            <button type="button" onClick={scrollToReport} className="shrink-0 flex items-center gap-1.5 min-h-[44px] px-3 py-2.5 rounded-xl text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors" title="Báo lỗi">
              <FlagIcon />
              <span className="text-xs sm:text-sm font-medium">Báo lỗi</span>
            </button>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-[auto_1fr] gap-3 sm:gap-4 items-start">
            <div className="w-[100px] sm:w-[160px] lg:w-[200px] aspect-2/3 rounded-xl overflow-hidden bg-[#232328] shrink-0">
              {(currentMovie.poster_url || currentMovie.thumb_url) ? (
                <Image src={currentMovie.poster_url || currentMovie.thumb_url || ""} alt="" width={280} height={420} className="object-cover w-full h-full" unoptimized={(currentMovie.poster_url || currentMovie.thumb_url || "").startsWith("http")} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">Poster</div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white leading-tight line-clamp-2">{currentMovie.name}</h1>
              {currentMovie.origin_name ? (
                <p className="text-[#fde047] text-xs sm:text-base mt-1 font-medium line-clamp-1">{currentMovie.origin_name}</p>
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
                {(currentMovie.categories || []).map((c) => (
                  <Link
                    key={c.id}
                    href={c.url || `/the-loai/${c.slug}`}
                    className="inline-flex items-center px-2 py-1 text-white text-xs font-semibold bg-white/15 border border-white/25 hover:bg-white/25 hover:border-white/40 transition-colors duration-200"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              {(currentMovie.actors?.length ?? 0) > 0 ? (
                <div className="mt-3 sm:mt-4 hidden sm:block">
                  <h3 className="text-white font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">Diễn viên</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-3">
                    {(currentMovie.actors || []).slice(0, 8).map((a) => (
                      <Link key={a.id} href={a.url || "#"} className="flex items-center gap-1.5 sm:gap-2 text-white/80 hover:text-white text-xs sm:text-sm min-h-[32px] sm:min-h-0 py-0.5 touch-manipulation">
                        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center text-[10px] sm:text-xs shrink-0">{a.name.charAt(0)}</span>
                        <span className="truncate max-w-[80px] sm:max-w-[100px]">{a.name}</span>
                      </Link>
                    ))}
                    {(currentMovie.actors?.length ?? 0) > 8 ? <span className="text-white/50 text-xs sm:text-sm">...</span> : null}
                  </div>
                </div>
              ) : null}
            </div>
            {(currentMovie.actors?.length ?? 0) > 0 ? (
              <div className="min-w-0 col-span-2 sm:hidden mt-3">
                <h3 className="text-white font-semibold text-xs mb-1.5">Diễn viên</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(currentMovie.actors || []).slice(0, 8).map((a) => (
                    <Link key={a.id} href={a.url || "#"} className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs min-h-[32px] py-0.5 touch-manipulation">
                      <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] shrink-0">{a.name.charAt(0)}</span>
                      <span className="truncate max-w-[80px]">{a.name}</span>
                    </Link>
                  ))}
                  {(currentMovie.actors?.length ?? 0) > 8 ? <span className="text-white/50 text-xs">...</span> : null}
                </div>
              </div>
            ) : null}
            {currentMovie.content ? (
              <div className="min-w-0 col-span-2">
                <p className="text-white/80 text-sm leading-relaxed">{stripHtml(currentMovie.content)}</p>
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sameSlugSameServer.map((server, idx) => (
              <button
                key={server.id}
                type="button"
                onClick={() => chooseServer(server)}
                className={`min-h-[44px] inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors touch-manipulation ${currentEpisode.id === server.id ? "bg-white text-[#0a0d0e]" : "bg-[#25252b] text-white hover:bg-[#2a2a32] active:bg-[#2a2a32]"}`}
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
          </div>
        )}
      </LazyWhenInView>
    </main>
  );
}
