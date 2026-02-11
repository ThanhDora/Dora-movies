import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/vip";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.role || !isAdmin(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-[#0a0d0e] text-white">
      <nav className="border-b border-white/10 px-4 py-3 flex gap-4">
        <Link href="/admin" className="font-bold hover:text-[#ff2a14]">Dashboard</Link>
        <Link href="/admin/movies" className="hover:text-[#ff2a14]">Phim chờ duyệt</Link>
        <Link href="/admin/users" className="hover:text-[#ff2a14]">User & VIP</Link>
        <Link href="/admin/admins" className="hover:text-[#ff2a14]">Thêm admin</Link>
        <Link href="/" className="ml-auto text-white/70 hover:text-white">Về trang chủ</Link>
      </nav>
      <main className="p-4 max-w-[1200px] mx-auto">{children}</main>
    </div>
  );
}
