"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginWithCredentials, signInWithGoogle, signInWithFacebook } from "./actions";

const verifyMessages: Record<string, string> = {
  "1": "Email đã được xác minh. Bạn có thể đăng nhập.",
  invalid_token: "Link xác minh không hợp lệ.",
  expired_token: "Link xác minh đã hết hạn. Vui lòng đăng ký lại hoặc gửi lại email xác minh.",
  missing_token: "Thiếu link xác minh.",
  verify_failed: "Xác minh thất bại. Vui lòng thử lại hoặc đăng ký lại.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  useEffect(() => {
    const verified = searchParams.get("verified");
    const err = searchParams.get("error");
    if (verified) setVerifyMsg(verifyMessages[verified] || "Đã xác minh.");
    if (err && !verified) setVerifyMsg(verifyMessages[err] || "Có lỗi xảy ra.");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await loginWithCredentials(formData);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12">
      <div className="max-w-md mx-auto bg-white/5 rounded-xl p-6 border border-white/10">
        <h1 className="text-xl font-bold text-white mb-6">Đăng nhập</h1>
        {verifyMsg ? (
          <p className={`text-sm mb-4 ${verifyMsg.includes("hết hạn") || verifyMsg.includes("không hợp lệ") ? "text-amber-400" : "text-green-400"}`}>
            {verifyMsg}
          </p>
        ) : null}
        {error ? (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-white border border-white/15 outline-none focus:ring-2 focus:ring-[#ff2a14]"
              required
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Mật khẩu</label>
            <input
              name="password"
              type="password"
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-white border border-white/15 outline-none focus:ring-2 focus:ring-[#ff2a14]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#ff2a14] text-white font-medium disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-white/70 text-sm mb-2">Hoặc đăng nhập với</p>
          <div className="flex gap-2">
            <form action={signInWithGoogle}>
              <button type="submit" className="h-11 px-4 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20">
                Google
              </button>
            </form>
            <form action={signInWithFacebook}>
              <button type="submit" className="h-11 px-4 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20">
                Facebook
              </button>
            </form>
          </div>
        </div>
        <p className="mt-4 text-white/70 text-sm">
          Chưa có tài khoản? <Link href="/register" className="text-[#ff2a14] hover:underline">Đăng ký</Link>
        </p>
        <p className="mt-1 text-white/60 text-sm">
          <Link href="/forgot-password" className="hover:underline">Quên mật khẩu?</Link>
        </p>
      </div>
    </main>
  );
}
