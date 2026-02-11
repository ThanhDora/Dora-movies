import { listUsers } from "@/lib/db";
import GrantVipForm from "./GrantVipForm";

export default async function AdminUsersPage() {
  let users: { id: string; email: string; name: string | null; role: string; vip_until: string | null }[] = [];
  try {
    users = await listUsers();
  } catch {
    users = [];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý user & cấp VIP</h1>
      <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <h2 className="font-bold mb-3">Cấp VIP thủ công</h2>
        <GrantVipForm users={users} />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-white/20">
            <th className="py-2">Email</th>
            <th className="py-2">Tên</th>
            <th className="py-2">Role</th>
            <th className="py-2">VIP đến</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-white/10">
              <td className="py-2">{u.email}</td>
              <td className="py-2">{u.name ?? "–"}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2">{u.vip_until ? new Date(u.vip_until).toLocaleDateString("vi-VN") : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
