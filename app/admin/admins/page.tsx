import AddAdminForm from "./AddAdminForm";

export default function AdminAdminsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Thêm admin</h1>
      <p className="text-white/70 mb-4">
        Nhập email (và tên). User đã tồn tại sẽ được cập nhật role; chưa có sẽ được tạo với role admin. User cần đăng nhập (Google/Facebook/Email) để kích hoạt.
      </p>
      <AddAdminForm />
    </div>
  );
}
