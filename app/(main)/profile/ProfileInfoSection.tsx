import EditNameForm from "./EditNameForm";

export default function ProfileInfoSection({
  email,
  name,
  vip,
  vipUntil,
  admin,
  role,
}: {
  email: string;
  name: string | null;
  vip: boolean;
  vipUntil: string | null;
  admin: boolean;
  role: string;
}) {
  return (
    <>
      <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Thông tin</h2>
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-white/50 text-sm mb-1.5">Email</label>
          <div className="py-2.5 px-4 rounded-lg bg-white/5 text-white/90 text-sm truncate">
            {email}
          </div>
        </div>
        <div>
          <label className="block text-white/50 text-sm mb-1.5">Tên</label>
          <EditNameForm initialName={name} inline />
        </div>
        <div>
          <label className="block text-white/50 text-sm mb-1.5">Gói</label>
          <div className="py-2.5 px-4 rounded-lg bg-white/5 text-white/90 text-sm">
            {vip ? (vipUntil ? `VIP (đến ${vipUntil})` : "VIP") : admin ? "–" : "Miễn phí"}
          </div>
        </div>
        {admin && (
          <div>
            <label className="block text-white/50 text-sm mb-1.5">Vai trò</label>
            <div className="py-2.5 px-4 rounded-lg bg-white/5 text-white/90 text-sm">
              {role === "super_admin" ? "Super Admin" : "Admin"}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
