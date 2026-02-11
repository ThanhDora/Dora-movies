import { getPendingMovieApprovals } from "@/lib/db";
import Link from "next/link";
import ApproveRejectButtons from "./ApproveRejectButtons";

export default async function AdminMoviesPage() {
  let list: { id: string; slug: string; source: string; status: string; created_at: string }[] = [];
  try {
    list = await getPendingMovieApprovals();
  } catch {
    list = [];
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Phim chờ duyệt</h1>
      <p className="text-white/60 text-sm mb-6">
        {list.length === 0
          ? "Không có phim nào. Chạy sync: POST /api/cron/sync-movies"
          : `${list.length} phim đang chờ duyệt`}
      </p>
      {list.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/50 text-sm">
          Chưa có phim chờ duyệt. Gọi API sync để thêm phim mới.
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <ul className="divide-y divide-white/10">
            {list.map((m) => (
              <li
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/phim/${m.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#ff2a14] hover:underline truncate block"
                  >
                    {m.slug}
                  </Link>
                  <span className="text-white/50 text-xs mt-0.5 block">
                    {m.source} · {new Date(m.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <ApproveRejectButtons id={m.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
