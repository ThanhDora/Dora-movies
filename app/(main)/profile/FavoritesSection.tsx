"use client";

import Link from "next/link";
import { useState } from "react";

export type FavoriteItem = {
  movieSlug: string;
  movieTitle: string | null;
  posterUrl: string | null;
  createdAt: string;
};

const ROW_LIMIT = 20;

function MovieCard({ item }: { item: FavoriteItem }) {
  return (
    <Link href={`/phim/${item.movieSlug}`} className="group block shrink-0 w-[120px] sm:w-[140px]" key={item.movieSlug}>
      <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-white/10">
        {item.posterUrl ? (
          <img src={item.posterUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">No image</div>
        )}
      </div>
      <p className="mt-2 text-white/90 text-sm font-medium line-clamp-2 group-hover:text-[#ff2a14] transition-colors">{item.movieTitle || item.movieSlug}</p>
    </Link>
  );
}

export default function FavoritesSection({ items }: { items: FavoriteItem[] }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) {
    return (
      <section className="w-full mb-8">
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">Yêu thích</h2>
        <p className="text-white/50 text-sm">Chưa có phim yêu thích. Thêm từ trang phim bằng nút Yêu thích.</p>
      </section>
    );
  }
  const rowItems = items.slice(0, ROW_LIMIT);
  const hasMore = items.length > ROW_LIMIT;

  return (
    <section className="w-full mb-8">
      <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">Yêu thích</h2>
      {expanded ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-5">
            {items.map((item) => (
              <MovieCard key={item.movieSlug} item={item} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-4 text-sm font-medium text-[#ff2a14] hover:text-[#ff5a44] transition-colors"
          >
            Thu gọn
          </button>
        </>
      ) : (
        <>
          <div className="overflow-x-auto pb-2 -mx-1">
            <div className="flex gap-4 md:gap-5 min-w-0">
              {rowItems.map((item) => (
                <MovieCard key={item.movieSlug} item={item} />
              ))}
            </div>
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-4 text-sm font-medium text-[#ff2a14] hover:text-[#ff5a44] transition-colors"
            >
              Xem thêm ({items.length} phim)
            </button>
          )}
        </>
      )}
    </section>
  );
}
