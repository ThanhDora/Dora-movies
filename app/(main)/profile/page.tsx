import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isVip, isAdmin } from "@/lib/vip";
import { getWatchHistory, getUserById } from "@/lib/db";
import ProfileActions from "./ProfileActions";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoSection from "./ProfileInfoSection";
import ChangePasswordForm from "./ChangePasswordForm";
import WatchHistorySection from "./WatchHistorySection";
import AdminQuickLinks from "./AdminQuickLinks";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const role = session.user.role;
  const admin = isAdmin(role);
  const vip = isVip(role, session.user.vip_until ?? null);
  const vipUntil = session.user.vip_until
    ? new Date(session.user.vip_until).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  let watchHistory: { movieSlug: string; episodePath: string | null; movieTitle: string; posterUrl: string | null; watchedAt: string }[] = [];
  try {
    watchHistory = await getWatchHistory(session.user.id!, 24);
  } catch {
    watchHistory = [];
  }

  let hasPassword = false;
  try {
    const user = await getUserById(session.user.id!);
    hasPassword = !!user?.password_hash;
  } catch {
    //
  }

  return (
    <main className="w-full min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <section className="w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-6 p-6 md:p-8 lg:p-10">
          <ProfileHeader
            name={session.user.name ?? null}
            email={session.user.email}
            image={session.user.image ?? null}
            role={role}
            admin={admin}
            vip={vip}
            vipUntil={vipUntil}
          />
        </section>

        <section className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden p-6 md:p-8 lg:p-10">
            <ProfileInfoSection
              email={session.user.email}
              name={session.user.name ?? null}
              vip={vip}
              vipUntil={vipUntil}
              admin={admin}
              role={role}
            />
          </div>
          {hasPassword && (
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden p-6 md:p-8 lg:p-10">
              <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Đổi mật khẩu</h2>
              <ChangePasswordForm />
            </div>
          )}
        </section>

        <section className="w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-8 p-6 md:p-8 lg:p-10">
          <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Hành động</h2>
          <ProfileActions isVip={vip} isAdmin={admin} />
        </section>

        <section className="w-full mb-8">
          <WatchHistorySection items={watchHistory} />
        </section>

        {admin && (
          <section className="w-full mt-10">
            <AdminQuickLinks />
          </section>
        )}

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <Link href="/" className="text-white/50 hover:text-white/80 text-sm">← Về trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
