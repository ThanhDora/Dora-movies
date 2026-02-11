import Link from "next/link";

export type WatchHistoryItem = {
  movieSlug: string;
  episodePath: string | null;
  movieTitle: string;
  posterUrl: string | null;
  watchedAt: string;
};

export default function WatchHistorySection({ items }: { items: WatchHistoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4">Lịch sử xem</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-5">
        {items.map((item) => {
          const href = item.episodePath ? `/phim/${item.movieSlug}/${item.episodePath}` : `/phim/${item.movieSlug}`;
          const dateStr = new Date(item.watchedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
          return (
            <Link
              key={`${item.movieSlug}-${item.watchedAt}`}
              href={href}
              className="group block"
            >
              <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-white/10">
                {item.posterUrl ? (
                  <img src={item.posterUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">No image</div>
                )}
              </div>
              <p className="mt-2 text-white/90 text-sm font-medium line-clamp-2 group-hover:text-[#ff2a14] transition-colors">{item.movieTitle}</p>
              <p className="text-white/50 text-xs mt-0.5">{item.episodePath ? `Đã xem · ${dateStr}` : dateStr}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
