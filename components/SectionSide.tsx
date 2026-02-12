import Link from "next/link";
import MovieCard from "./MovieCard";
import type { SectionData } from "@/types";

export default function SectionSide({ item }: { item: SectionData }) {
  const movies = item.data || [];
  const topview = item.topview || [];
  const link = item.link || "#";

  if (!movies.length) return null;

  return (
    <section className="mb-8 flex flex-col lg:flex-row gap-5">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-[#FF0000]">◆</span> {item.label}
          </h2>
          <Link href={link} className="text-sm text-[#ff2a14] hover:underline" title={item.label}>
            Xem thêm →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
      {topview.length > 0 && (
        <aside className="w-full lg:w-64 shrink-0">
          <h2 className="text-base font-bold text-white mb-2">Top</h2>
          <div className="bg-[#25252b] rounded-lg p-3 space-y-2">
            {topview.map((movie, idx) => {
              const key = idx + 1;
              const numClass = key === 1 ? "bg-[#ff2a14]" : key === 2 ? "bg-[#f2a20c]" : key === 3 ? "bg-[#148aff]" : "bg-[#32323c]";
              return (
                <Link
                  key={movie.id}
                  href={movie.url || `/phim/${movie.slug}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors"
                >
                  <span className={`w-7 h-7 flex items-center justify-center rounded text-white text-sm font-bold shrink-0 ${numClass}`}>
                    {key}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white text-sm font-medium truncate">{movie.name}</h3>
                    <p className="text-white/50 text-xs">Lượt xem: {movie.view_total ?? 0}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      )}
    </section>
  );
}
