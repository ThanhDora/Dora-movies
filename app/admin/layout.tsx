import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

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
      <AdminSidebar />
      <header className="md:hidden sticky top-0 z-30 border-b border-white/10 bg-[#0d1012] px-4 py-3 flex items-center gap-2 flex-wrap">
        <Link href="/admin" className="font-bold text-white">Dora Admin</Link>
        <Link href="/admin/movies" className="text-sm text-white/80 hover:text-[#ff2a14]">Phim</Link>
        <Link href="/admin/users" className="text-sm text-white/80 hover:text-[#ff2a14]">User</Link>
        <Link href="/admin/admins" className="text-sm text-white/80 hover:text-[#ff2a14]">Thêm admin</Link>
        <Link href="/profile" className="text-sm text-white/60 hover:text-white ml-auto">Cá nhân</Link>
        <Link href="/" className="text-sm text-white/60 hover:text-white">Trang chủ</Link>
      </header>
      <main className="md:pl-72 lg:pl-80 min-h-screen">
        <div className="p-4 md:p-8 lg:p-10 max-w-[1200px] md:max-w-[1400px] lg:max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
