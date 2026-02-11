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
      <h1 className="text-2xl font-bold mb-6">Phim chờ duyệt</h1>
      {list.length === 0 ? (
        <p className="text-white/70">Không có phim nào chờ duyệt. Chạy sync: POST /api/cron/sync-movies</p>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 py-2 border-b border-white/10"
            >
              <div>
                <Link href={`/phim/${m.slug}`} target="_blank" className="text-[#ff2a14] hover:underline">
                  {m.slug}
                </Link>
                <span className="text-white/50 text-sm ml-2">{m.source} · {new Date(m.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
              <ApproveRejectButtons id={m.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
