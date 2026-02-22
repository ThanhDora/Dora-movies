"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/types";

const LOADING_GIF = "/loading.gif";

const PlayIcon = memo(function PlayIcon() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
      <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
});

function hasVideo(movie: Movie): boolean {
  return !movie.is_copyright && (movie.episodes?.length ?? 0) > 0;
}

function isComingSoon(movie: Movie): boolean {
  if (movie.episodes === undefined) return false;
  return movie.episodes.length === 0 || !!movie.is_copyright;
}

function MovieCard({ movie }: { movie: Movie }) {
  const thumb = movie.thumb_url || movie.poster_url || "";
  const url = movie.url || `/phim/${movie.slug}`;
  const hasDirectors = movie.directors && Array.isArray(movie.directors) && movie.directors.length > 0;
  const hasActors = movie.actors && Array.isArray(movie.actors) && movie.actors.length > 0;
  const showAuthor = hasDirectors || hasActors;
  const comingSoon = isComingSoon(movie);
  const showPlay = hasVideo(movie) || movie.episodes === undefined;

  return (
    <div className="w-full min-w-0">
      <div className="group">
        <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-[#232328]">
          {showPlay && (
            <Link href={url} title={movie.name} className="block absolute inset-0 z-10">
              <PlayIcon />
            </Link>
          )}
          <Image
            src={thumb || LOADING_GIF}
            alt={movie.name}
            width={240}
            height={360}
            unoptimized={thumb.startsWith("http")}
            className="object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = LOADING_GIF;
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-1 px-2 py-1.5 text-xs text-white/90 bg-black/50">
            {movie.quality && movie.quality !== "0" && <span>{movie.quality}</span>}
            {movie.language && movie.language !== "0" && <span>{movie.language}</span>}
            {(typeof movie.publish_year === "string"
              ? movie.publish_year !== "0"
              : Boolean(movie.publish_year)
            ) && movie.publish_year && <span>{movie.publish_year}</span>}
          </div>
          {comingSoon && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-semibold bg-amber-500/90 text-black rounded">
              Sắp chiếu
            </div>
          )}
          {!comingSoon && movie.status && movie.episodes !== undefined && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 text-xs bg-[#ff2a14] text-white rounded">
              {movie.status}
            </div>
          )}
        </div>
        <div className="mt-2 px-1">
          <Link href={url} className="block font-semibold text-white hover:text-[#ff2a14] transition-colors line-clamp-2 text-sm mb-1" title={movie.name}>
            {movie.name}
          </Link>
          {movie.origin_name && (
            <p className="text-white/50 text-[10px] mb-1 line-clamp-1">
              {movie.origin_name}
            </p>
          )}
          {showAuthor && (
            <div className="text-xs text-white/60 line-clamp-1 mt-0.5">
              {hasDirectors && (
                <span>
                  Đạo diễn: {movie.directors!.slice(0, 2).map((d) => d.name).join(", ")}
                </span>
              )}
              {hasDirectors && hasActors && <span className="mx-1">•</span>}
              {hasActors && (
                <span>
                  Diễn viên: {movie.actors!.slice(0, 2).map((a) => a.name).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MovieCard);
