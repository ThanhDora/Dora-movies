"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/movies", label: "Phim chờ duyệt" },
  { href: "/admin/users", label: "User & VIP" },
  { href: "/admin/admins", label: "Thêm admin" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 md:w-72 lg:w-80 border-r border-white/10 bg-[#0d1012] flex flex-col max-md:hidden">
      <div className="p-4 border-b border-white/10">
        <Link href="/admin" className="text-lg font-bold text-white">
          Dora Admin
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#ff2a14]/20 text-[#ff2a14]"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/profile"
          className="block rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          Trang cá nhân
        </Link>
        <Link
          href="/"
          className="block rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
