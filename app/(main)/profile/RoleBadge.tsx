import type { UserRole } from "@/types/db";

export default function RoleBadge({ role }: { role: UserRole }) {
  if (role === "super_admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-2 h-2 rounded-full bg-red-400" aria-hidden />
        Super Admin
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden />
        Admin
      </span>
    );
  }
  return null;
}
