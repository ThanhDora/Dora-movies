import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin</h1>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/movies" className="text-[#ff2a14] hover:underline">
            Phim chờ duyệt
          </Link>
          <span className="text-white/60 ml-2">– Duyệt hoặc từ chối phim từ API</span>
        </li>
        <li>
          <Link href="/admin/users" className="text-[#ff2a14] hover:underline">
            Quản lý user & cấp VIP
          </Link>
          <span className="text-white/60 ml-2">– Danh sách user, cấp VIP thủ công</span>
        </li>
        <li>
          <Link href="/admin/admins" className="text-[#ff2a14] hover:underline">
            Thêm admin
          </Link>
          <span className="text-white/60 ml-2">– Mời admin mới (email + role)</span>
        </li>
      </ul>
      <p className="mt-8 text-white/50 text-sm">
        Sync phim từ API: <code className="bg-white/10 px-1 rounded">POST /api/cron/sync-movies</code> với header{" "}
        <code className="bg-white/10 px-1 rounded">Authorization: Bearer CRON_SECRET</code>
      </p>
    </div>
  );
}
