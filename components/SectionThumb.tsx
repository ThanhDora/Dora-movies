import Link from "next/link";
import MovieCard from "./MovieCard";
import type { SectionData } from "@/types";

export default function SectionThumb({ item }: { item: SectionData }) {
  const movies = item.data || [];
  if (!movies.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-[#FF0000]">◆</span> {item.label}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
