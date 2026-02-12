import { getAllMovies } from "@/lib/db";
import MovieManagement from "./MovieManagement";
import SyncAllButton from "./SyncAllButton";
import type { DbMovieApproval } from "@/types/db";

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const currentPage = isNaN(page) || page < 1 ? 1 : page;

  let moviesData: { movies: DbMovieApproval[]; total: number; page: number; limit: number; totalPages: number } = {
    movies: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };
  let errorMessage: string | null = null;
  
  try {
    moviesData = await getAllMovies({ page: currentPage, limit: 20 });
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV === "development") {
      console.error("[AdminMoviesPage] Error:", e);
    }
    moviesData = { movies: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Quản lý phim</h1>
        <SyncAllButton />
      </div>
      <div className="mt-6">
        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Lỗi: {errorMessage}
          </div>
        )}
        <p className="text-white/60 text-sm mb-4">
          {moviesData.total === 0
            ? "Chưa có phim nào. Nhấn nút 'Đồng bộ phim' để tải phim từ API."
            : `Tổng cộng ${moviesData.total} phim`}
        </p>
        {moviesData.movies.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/50 text-sm">
            {moviesData.total === 0 ? (
              <>
                <p className="mb-2">Chưa có phim nào.</p>
                <p className="text-xs text-white/40">
                  Nhấn nút "Đồng bộ phim" ở trên để tải tất cả phim từ API.
                </p>
              </>
            ) : (
              <p>Không có phim nào ở trang này.</p>
            )}
          </div>
        ) : (
          <MovieManagement
            movies={moviesData.movies}
            currentPage={moviesData.page}
            totalPages={moviesData.totalPages}
            total={moviesData.total}
          />
        )}
      </div>
    </div>
  );
}
