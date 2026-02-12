"use client";

import Link from "next/link";
import Image from "next/image";
import { Leckerli_One } from "next/font/google";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import type { Movie } from "@/types";

import "swiper/css";
import "swiper/css/effect-coverflow";

const rankFont = Leckerli_One({ weight: "400", subsets: ["latin"], display: "swap" });
const LOADING_GIF = "/loading.gif";
const RANK_COLORS = ["#eab308", "#c0c0c0", "#cd7f32", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8"];

function Top10Card({ movie, rank }: { movie: Movie; rank: number }) {
  const thumb = movie.thumb_url || movie.poster_url || "";
  const url = movie.url || `/phim/${movie.slug}`;
  const epText = movie.episode_current && movie.episode_total ? `${movie.episode_current}/${movie.episode_total}` : movie.episode_current || "";
  const year = movie.publish_year ?? "";
  const status = epText ? `Hoàn Tất (${epText})` : movie.status || "";
  const rankColor = RANK_COLORS[rank - 1] ?? "#eab308";

  return (
    <Link
      href={url}
      className="group block w-full transition-transform hover:scale-[1.02]"
      title={movie.name}
    >
      <div className="relative rounded-2xl overflow-hidden bg-[#1a1a1d] shadow-lg shadow-black/30">
        <div className="relative aspect-2/3 rounded-t-2xl overflow-hidden">
          <Image
            src={thumb || LOADING_GIF}
            alt={movie.name}
            width={280}
            height={420}
            unoptimized={thumb.startsWith("http")}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 rounded-t-2xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = LOADING_GIF;
            }}
          />
          {epText && (
            <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">
              PD. {epText}
            </span>
          )}
        </div>
        <div
          className="absolute left-0 bottom-0 z-20 flex items-end pl-2 pb-1 pointer-events-none"
          style={{ height: "48%" }}
        >
          <span
            className={`${rankFont.className} text-7xl sm:text-8xl font-bold leading-none tabular-nums`}
            style={{
              color: rankColor,
              textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.8)",
            }}
          >
            {rank}
          </span>
        </div>
        <div className="relative z-0 pb-4 pr-4 pl-16 pt-8 bg-[#0f0f12] rounded-b-2xl">
          <p className="text-white font-bold text-base line-clamp-2 leading-tight">{movie.name}</p>
          {movie.origin_name && (
            <p className="text-white/55 text-sm mt-1 line-clamp-1">{movie.origin_name}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {year && (
              <span className="inline-block px-2.5 py-1 bg-white/15 text-white text-xs rounded-md">
                {year}
              </span>
            )}
            {status && (
              <span className="inline-block px-2.5 py-1 bg-white/15 text-white text-xs rounded-md">
                {status}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Top10MoviesSection({ movies }: { movies: Movie[] }) {
  const list = movies.slice(0, 10);
  if (!list.length) return null;
  const ring = list.length === 10
    ? [
        { movie: list[9], rank: 10 },
        ...list.slice(0, 9).map((movie, i) => ({ movie, rank: i + 1 })),
      ]
    : list.map((movie, i) => ({ movie, rank: i + 1 }));

  return (
    <section className="mb-10 overflow-visible">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-1 rounded-full bg-[#eab308]" aria-hidden />
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Top 10 phim lẻ
        </h2>
      </div>
      <div className="overflow-visible mx-auto px-6 sm:px-10 max-w-6xl" style={{ perspective: "1200px" }}>
        <Swiper
          modules={[Autoplay, EffectCoverflow]}
          effect="coverflow"
          loop
          initialSlide={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          grabCursor
          centeredSlides
          slidesPerView="auto"
          coverflowEffect={{
            rotate: 30,
            stretch: 20,
            depth: 100,
            modifier: 1.15,
            slideShadows: true,
          }}
          className="top10-swiper overflow-visible pb-2"
          style={{ paddingTop: 32, paddingBottom: 32 }}
        >
        {ring.map(({ movie, rank }) => (
          <SwiperSlide key={movie.id} className="w-[220px]! sm:w-[280px]!">
            <Top10Card movie={movie} rank={rank} />
          </SwiperSlide>
        ))}
        </Swiper>
      </div>
    </section>
  );
}
