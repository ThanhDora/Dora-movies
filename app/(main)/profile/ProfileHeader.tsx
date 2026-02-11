import type { UserRole } from "@/types/db";
import ProfileAvatar from "./ProfileAvatar";
import RoleBadge from "./RoleBadge";

export default function ProfileHeader({
  name,
  email,
  image,
  role,
  admin,
  vip,
  vipUntil,
}: {
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  admin: boolean;
  vip: boolean;
  vipUntil: string | null;
}) {
  return (
    <div className="w-full flex flex-col items-center text-center">
      <ProfileAvatar image={image} name={name} email={email} />
      <h1 className="text-2xl md:text-3xl font-bold text-white mt-4">
        {name || "Thành viên"}
      </h1>
      <p className="text-white/60 text-base mt-1">{email}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {admin && <RoleBadge role={role} />}
        {vip ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
            VIP{vipUntil ? ` · Đến ${vipUntil}` : ""}
          </span>
        ) : !admin ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/70 border border-white/15">
            Miễn phí
          </span>
        ) : null}
      </div>
    </div>
  );
}
