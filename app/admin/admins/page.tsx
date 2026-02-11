import { auth } from "@/lib/auth";
import AddAdminForm from "./AddAdminForm";

export default async function AdminAdminsPage() {
  const session = await auth();
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Thêm admin</h1>
      <p className="text-white/60 text-sm mb-6">
        User đã tồn tại sẽ được cập nhật role; chưa có sẽ được tạo. User cần đăng nhập (Google/Facebook/Email) để kích hoạt.
      </p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 max-w-lg">
        <AddAdminForm currentUserRole={session?.user?.role ?? ""} />
      </div>
    </div>
  );
}
