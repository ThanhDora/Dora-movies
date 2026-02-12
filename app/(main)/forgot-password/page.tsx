"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const inputBase =
  "w-full h-12 px-4 rounded-xl bg-white/5 text-white placeholder:text-white/40 border border-white/10 outline-none focus:border-[#e6b800] focus:ring-2 focus:ring-[#e6b800]/20 transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
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
              <p className="text-white/90 text-sm mb-2">
                Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu đến hộp thư của bạn.
              </p>
              <p className="text-white/60 text-xs mb-6">Vui lòng kiểm tra email và thư mục spam.</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Quên mật khẩu</h2>
              <p className="text-white/60 text-sm mb-6">Nhập email đăng ký để nhận link đặt lại mật khẩu.</p>
              {error ? (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              ) : null}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="sr-only">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoComplete="email"
                    className={inputBase}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#e6b800] text-[#0a0a0c] font-semibold hover:bg-[#d4a800] active:scale-[0.99] disabled:opacity-50 transition-all"
                >
                  {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
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
