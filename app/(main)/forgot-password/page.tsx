import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12">
      <div className="max-w-md mx-auto bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <h1 className="text-xl font-bold text-white mb-4">Quên mật khẩu</h1>
        <p className="text-white/80 text-sm mb-4">
          Chức năng đặt lại mật khẩu qua email sẽ được bật sau khi cấu hình dịch vụ gửi email (Resend/SendGrid).
        </p>
        <Link href="/login" className="text-[#ff2a14] hover:underline">Quay lại đăng nhập</Link>
      </div>
    </main>
  );
}
