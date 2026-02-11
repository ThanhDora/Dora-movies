"use client";

import LazyWhenInView from "./LazyWhenInView";
import MovieCard from "./MovieCard";
import type { Movie } from "@/types";

function CardPlaceholder() {
  return (
    <div className="w-full min-w-0">
      <div className="aspect-[2/3] rounded-lg bg-[#232328]/80 animate-pulse" />
      <div className="mt-2 h-4 w-3/4 rounded bg-[#25252b]/80 animate-pulse" />
      <div className="mt-1 h-3 w-1/2 rounded bg-[#25252b]/60 animate-pulse" />
    </div>
  );
}

export default function LazyMovieGrid({ movies }: { movies: Movie[] }) {
  if (!movies?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
      {movies.map((movie) => (
        <LazyWhenInView
          key={movie.id}
          placeholder={<CardPlaceholder />}
          rootMargin="80px 0px"
        >
          {() => <MovieCard movie={movie} />}
        </LazyWhenInView>
      ))}
    </div>
  );
}
