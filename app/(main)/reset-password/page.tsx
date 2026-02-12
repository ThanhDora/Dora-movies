"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

const inputBase =
  "w-full h-12 px-4 rounded-xl bg-white/5 text-white placeholder:text-white/40 border border-white/10 outline-none focus:border-[#e6b800] focus:ring-2 focus:ring-[#e6b800]/20 transition-colors";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Link không hợp lệ. Thiếu token.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 15) {
      setError("Mật khẩu phải từ 6 đến 15 ký tự.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Không kết nối được. Kiểm tra mạng hoặc thử lại.");
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-[400px] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
          <div className="flex flex-col items-center justify-center px-6 pt-8 pb-6 bg-[#151518] border-b border-white/10 min-h-[88px]">
            <Image src="/anime.png" alt="Dora Movies" width={48} height={32} className="h-8 w-auto object-contain mb-2" />
            <h1 className="text-lg font-bold text-white">Dora Movies</h1>
          </div>
          <div className="px-6 pt-6 pb-6 bg-[#1a1a1e]">
            <p className="text-red-400 text-sm mb-4">Link không hợp lệ. Vui lòng yêu cầu gửi lại email đặt mật khẩu.</p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] transition-colors"
            >
              Quên mật khẩu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-[400px] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex flex-col items-center justify-center px-6 pt-8 pb-6 bg-[#151518] border-b border-white/10 min-h-[88px]">
          <Image src="/anime.png" alt="Dora Movies" width={48} height={32} className="h-8 w-auto object-contain mb-2" />
          <h1 className="text-lg font-bold text-white">Dora Movies</h1>
        </div>
        <div className="px-6 pt-6 pb-6 bg-[#1a1a1e]">
          {done ? (
            <div className="text-center">
              <p className="text-green-400 font-medium mb-4">Đặt lại mật khẩu thành công.</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Đặt lại mật khẩu</h2>
              <p className="text-white/60 text-sm mb-6">Nhập mật khẩu mới (6–15 ký tự).</p>
              {error ? (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              ) : null}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-new" className="sr-only">Mật khẩu mới</label>
                  <input
                    id="reset-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={15}
                    className={inputBase}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reset-confirm" className="sr-only">Xác nhận mật khẩu</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={15}
                    className={inputBase}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] active:scale-[0.99] disabled:opacity-50 transition-all"
                >
                  {loading ? "Đang xử lý..." : "Đặt mật khẩu mới"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-white/60">
                <Link href="/login" className="text-[#e6b800] font-medium hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-white/60">Đang tải...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
