"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import type { Movie, Episode } from "@/types";
import LazyWhenInView from "@/components/LazyWhenInView";
import LazyMovieGrid from "@/components/LazyMovieGrid";
import StarRating from "@/components/StarRating";
import { reportEpisode } from "@/lib/api";

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
}: {
  currentMovie: Movie;
  episode: Episode;
  movie_related: Movie[];
  movie_related_top: Movie[];
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

  const currentServerEpisodes = byServer.get(activeServer) || [];
  const sameSlugSameServer = currentServerEpisodes.filter(
    (e) => e.slug === episode.slug && e.server === episode.server
  );

  const renderPlayer = useCallback(
    (type: string, link: string) => {
      const url = link.replace(/^http:\/\//i, "https://");
      if (type === "embed") {
        return <iframe key={playerKey} width="100%" height="100%" src={url} frameBorder={0} allow="autoplay" allowFullScreen className="w-full h-full" />;
      }
      if (type === "m3u8" || type === "mp4") {
        return <video key={playerKey} controls autoPlay className="w-full h-full" src={url} />;
      }
      return <iframe key={playerKey} width="100%" height="100%" src={url} frameBorder={0} allow="autoplay" allowFullScreen className="w-full h-full" />;
    },
    [playerKey]
  );

  const [playerContent, setPlayerContent] = useState<React.ReactNode>(() =>
    renderPlayer(episode.type, episode.link)
  );

  const chooseServer = useCallback(
    (ep: Episode) => {
      setCurrentEpisode(ep);
      setActiveServer(ep.server);
      setPlayerContent(renderPlayer(ep.type, ep.link));
      setPlayerKey((k) => k + 1);
      router.push(`/phim/${currentMovie.slug}/${ep.slug}-${ep.id}`, { scroll: false });
    },
    [currentMovie.slug, router, renderPlayer]
  );

  useEffect(() => {
    if (sameSlugSameServer.length) {
      const first = sameSlugSameServer[0];
      setTimeout(() => {
        setPlayerContent(renderPlayer(first.type, first.link));
      }, 0);
    }
  }, [activeServer, sameSlugSameServer, renderPlayer]);

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

  const movieUrl = currentMovie.url || `/phim/${currentMovie.slug}`;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {(currentMovie.notify || currentMovie.showtimes) && (
            <div className="mb-3 p-3 bg-[#25252b] rounded-lg text-white/80 text-sm">
              {currentMovie.showtimes && `Lịch chiếu : ${currentMovie.showtimes}`}
              {currentMovie.notify && ` | Thông báo : ${currentMovie.notify.replace(/<[^>]*>/g, "")}`}
            </div>
          )}
          <div className="w-full pb-[56.25%] relative h-0 bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 w-full h-full" id="player-wrapper">
              {playerContent}
            </div>
          </div>
          <div className="mt-3">
            <h1 className="text-lg font-bold text-white">
              <Link href={movieUrl} className="hover:text-[#ff2a14]">{currentMovie.name}</Link> - Tập {currentEpisode.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {sameSlugSameServer.map((server, idx) => (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => chooseServer(server)}
                  className={`min-h-[44px] inline-flex items-center px-3 py-2 rounded text-sm transition-colors touch-manipulation ${currentEpisode.id === server.id ? "bg-white text-[#0a0d0e]" : "bg-[#232328] text-white hover:bg-[#2a2a32] active:bg-[#2a2a32]"}`}
                >
                  Nguồn #{idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-full lg:w-72 shrink-0">
          <h2 className="text-lg font-bold text-white mb-3">Tập phim</h2>
          {serverNames.map((server) => {
            const eps = byServer.get(server) || [];
            const byName = groupByName(eps);
            const names = Array.from(byName.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            const isSelected = activeServer === server;
            return (
              <div key={server} className={isSelected ? "block" : "hidden"}>
                <div className="max-h-[400px] overflow-y-auto space-y-1">
                  {names.map((name) => {
                    const list = byName.get(name) || [];
                    const best = [...list].sort((a, b) => (b.type || "").localeCompare(a.type || ""))[0];
                    const isActive = list.some((e) => e.id === currentEpisode.id);
                    const thumb = currentMovie.thumb_url || currentMovie.poster_url || "";
                    return (
                      <Link
                        key={name}
                        href={best ? `/phim/${currentMovie.slug}/${best.slug}-${best.id}` : "#"}
                        className={`flex items-center gap-3 min-h-[72px] px-2 py-2 text-sm rounded transition-colors touch-manipulation ${isActive ? "bg-[#c92626] text-white" : "text-white/80 hover:bg-white/10 active:bg-white/10"}`}
                      >
                        <div className="w-12 h-[72px] shrink-0 rounded overflow-hidden bg-[#232328]">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt=""
                              width={48}
                              height={72}
                              className="w-full h-full object-cover"
                              unoptimized={thumb.startsWith("http")}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">Tập</div>
                          )}
                        </div>
                        <span className="font-medium truncate">Tập {name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>
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
              {!reportSent ? (
                <form onSubmit={handleReport} className="space-y-2">
                  <textarea value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} placeholder="Nội dung báo lỗi..." rows={2} className="w-full p-2 rounded bg-[#232328] text-white border border-white/10 text-sm resize-none focus:outline-none focus:border-[#ff2a14]" />
                  <button type="submit" className="px-4 py-2 bg-[#c92626] hover:bg-[#d92a2a] text-white font-medium rounded transition-colors">Gửi báo lỗi</button>
                </form>
              ) : (
                <p className="text-white/70 text-sm">Đã gửi báo lỗi.</p>
              )}
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
