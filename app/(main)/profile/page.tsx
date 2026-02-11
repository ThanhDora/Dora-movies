import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isVip } from "@/lib/vip";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const vip = isVip(session.user.role, session.user.vip_until ?? null);
  const vipUntil = session.user.vip_until ? new Date(session.user.vip_until).toLocaleDateString("vi-VN") : null;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-8">
      <div className="max-w-md mx-auto bg-white/5 rounded-xl p-6 border border-white/10">
        <h1 className="text-xl font-bold text-white mb-4">Tài khoản</h1>
        <p className="text-white/80"><strong>Email:</strong> {session.user.email}</p>
        {session.user.name ? <p className="text-white/80 mt-2"><strong>Tên:</strong> {session.user.name}</p> : null}
        <p className="text-white/80 mt-2">
          <strong>Gói:</strong> {vip ? <>VIP {vipUntil ? `(đến ${vipUntil})` : ""}</> : "Miễn phí"}
        </p>
        {!vip ? (
          <Link href="/vip" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#ff2a14] text-white font-medium">
            Nâng cấp VIP
          </Link>
        ) : null}
      </div>
    </main>
  );
}
