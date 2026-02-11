"use client";

import Link from "next/link";
import Image from "next/image";
import type { Movie, Region } from "@/types";

const LOADING_GIF = "/loading.gif";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function PlayIcon() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
      <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

export default function MovieCard({ movie }: { movie: Movie }) {
  const thumb = movie.thumb_url || movie.poster_url || "";
  const url = movie.url || `/phim/${movie.slug}`;
  const regions = movie.regions || [];
  const content = movie.content ? stripHtml(movie.content) : "";

  return (
    <div className="w-full min-w-0">
      <div className="group">
        <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-[#232328]">
          <Link href={url} title={movie.name} className="block absolute inset-0 z-10">
            <PlayIcon />
          </Link>
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
            <span>{movie.quality}</span>
            <span>{movie.language}</span>
            <span>{movie.publish_year}</span>
          </div>
          {movie.status && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 text-xs bg-[#ff2a14] text-white rounded">
              {movie.status}
            </div>
          )}
        </div>
        <div className="mt-2 px-1">
          <div className="flex flex-wrap gap-1 text-xs text-white/60">
            {regions.map((r: Region) => (
              <Link key={r.id} href={r.url || `/quoc-gia/${r.slug}`} className="hover:text-[#ff2a14] transition-colors">
                {r.name}
              </Link>
            ))}
          </div>
          {content && <p className="text-xs text-white/50 line-clamp-2 mt-0.5">{content}</p>}
          <Link href={url} className="block mt-1 font-semibold text-white/95 hover:text-[#ff2a14] transition-colors line-clamp-2 text-sm" title={movie.name}>
            {movie.name}
          </Link>
          <p className="text-xs text-white/50 mt-0.5">{movie.origin_name}</p>
        </div>
      </div>
    </div>
  );
}
