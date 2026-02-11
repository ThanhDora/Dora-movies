"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Movie } from "@/types";

import "swiper/css";
import "swiper/css/navigation";

export default function Slider({ movies }: { movies: Movie[] }) {
  if (!movies?.length) return null;

  return (
    <Swiper
      modules={[Navigation]}
      navigation
      className="overflow-hidden! rounded-lg"
      spaceBetween={0}
      slidesPerView={1}
      loop
    >
      {movies.map((movie) => (
        <SwiperSlide key={movie.id}>
          <Link
            href={movie.url || `/phim/${movie.slug}`}
            className="block min-h-[200px] sm:min-h-[300px] md:min-h-[400px] relative bg-cover bg-center rounded-lg"
            style={{
              backgroundImage: `url(${movie.poster_url || movie.thumb_url})`,
            }}
          >
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute left-0 top-0 w-40 h-full bg-linear-to-r from-[#16161a] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 w-40 h-full bg-linear-to-l from-[#16161a] to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-[#16161a] to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-6 sm:right-6 text-white">
              <p className="text-base sm:text-xl font-bold line-clamp-2">{movie.name}</p>
              <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-1">{movie.origin_name}</p>
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
