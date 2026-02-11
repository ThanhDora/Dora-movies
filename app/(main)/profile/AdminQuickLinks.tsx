import Link from "next/link";

export default function AdminQuickLinks() {
  const links = [
    { href: "/admin", label: "Dashboard", desc: "Tổng quan quản trị" },
    { href: "/admin/movies", label: "Phim chờ duyệt", desc: "Duyệt hoặc từ chối phim" },
    { href: "/admin/users", label: "User & VIP", desc: "Quản lý user, cấp VIP" },
    { href: "/admin/admins", label: "Thêm admin", desc: "Mời admin mới" },
  ];
  return (
    <section className="w-full rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Khu vực quản trị</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
        {links.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-1 p-5 bg-[#16161a] hover:bg-white/5 transition-colors group"
          >
            <span className="font-semibold text-white group-hover:text-[#ff2a14] transition-colors">{label}</span>
            <span className="text-sm text-white/50">{desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
