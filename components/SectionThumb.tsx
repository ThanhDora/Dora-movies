import Link from "next/link";
import MovieCard from "./MovieCard";
import type { SectionData } from "@/types";

export default function SectionThumb({ item }: { item: SectionData }) {
  const movies = item.data || [];
  if (!movies.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="text-[#FF0000]">◆</span> {item.label}
        </h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
