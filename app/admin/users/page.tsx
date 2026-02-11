import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/db";
import AddAdminForm from "../admins/AddAdminForm";
import UsersTableWithSearch from "./UsersTableWithSearch";

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.id ?? "";

  let users: { id: string; email: string; name: string | null; role: string; vip_until: string | null }[] = [];
  try {
    users = await listUsers();
  } catch {
    users = [];
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">User & VIP</h1>
      <p className="text-white/60 text-sm mb-6">
        Danh sách user. Tìm theo email hoặc tên. Gỡ admin hoặc xóa tài khoản trong cột Thao tác.
      </p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">Thêm admin</h2>
        <AddAdminForm currentUserRole={session?.user?.role ?? ""} />
      </div>
      <UsersTableWithSearch users={users} currentUserId={currentUserId} currentUserRole={session?.user?.role ?? ""} />
    </div>
  );
}
