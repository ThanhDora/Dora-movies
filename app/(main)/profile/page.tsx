import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isVip } from "@/lib/vip";
import ProfileActions from "./ProfileActions";
import ProfileAvatar from "./ProfileAvatar";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const vip = isVip(session.user.role, session.user.vip_until ?? null);
  const vipUntil = session.user.vip_until
    ? new Date(session.user.vip_until).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12">
      <div className="max-w-md mx-auto bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex flex-col items-center text-center mb-6">
          <ProfileAvatar
            image={session.user.image ?? null}
            name={session.user.name}
            email={session.user.email}
          />
          <h1 className="text-xl font-bold text-white mt-4">
            {session.user.name || "Thành viên"}
          </h1>
          <p className="text-white/60 text-sm mt-1">{session.user.email}</p>
          <div className="mt-3">
            {vip ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                VIP{vipUntil ? ` · Đến ${vipUntil}` : ""}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white/70 border border-white/15">
                Miễn phí
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Email</span>
            <span className="text-white/90">{session.user.email}</span>
          </div>
          {session.user.name ? (
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Tên</span>
              <span className="text-white/90">{session.user.name}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Gói</span>
            <span className="text-white/90">{vip ? `VIP ${vipUntil ? `(đến ${vipUntil})` : ""}` : "Miễn phí"}</span>
          </div>
        </div>
        <ProfileActions isVip={vip} />
        <p className="mt-4 text-center text-white/50 text-xs">
          <Link href="/" className="hover:text-white/70">← Về trang chủ</Link>
        </p>
      </div>
    </main>
  );
}
