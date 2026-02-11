import Link from "next/link";

const cards = [
  {
    href: "/admin/movies",
    title: "Phim chờ duyệt",
    desc: "Duyệt hoặc từ chối phim đồng bộ từ API",
  },
  {
    href: "/admin/users",
    title: "User & VIP",
    desc: "Danh sách user, cấp VIP thủ công",
  },
  {
    href: "/admin/admins",
    title: "Thêm admin",
    desc: "Mời admin mới (email + role)",
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-white/60 text-sm mb-8">Chọn chức năng bên dưới để quản lý.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] hover:border-[#ff2a14]/30 transition-colors group"
          >
            <h2 className="font-semibold text-white group-hover:text-[#ff2a14] transition-colors mb-1">
              {title}
            </h2>
            <p className="text-sm text-white/50">{desc}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold text-white mb-2">Sync phim từ API</h2>
        <p className="text-white/60 text-sm mb-2">
          Gọi endpoint với header Authorization để đồng bộ phim chờ duyệt.
        </p>
        <code className="block text-xs text-white/80 bg-black/30 rounded-lg p-3 overflow-x-auto">
          POST /api/cron/sync-movies<br />
          Authorization: Bearer CRON_SECRET
        </code>
      </div>
    </div>
  );
}
