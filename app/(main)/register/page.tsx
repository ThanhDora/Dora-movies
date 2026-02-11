"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Đăng ký thất bại.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12">
        <div className="max-w-md mx-auto bg-white/5 rounded-xl p-6 border border-white/10 text-center">
          <p className="text-white mb-4">Đăng ký thành công. Bạn có thể đăng nhập.</p>
          <Link href="/login" className="text-[#ff2a14] hover:underline">Đi tới đăng nhập</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 py-12">
      <div className="max-w-md mx-auto bg-white/5 rounded-xl p-6 border border-white/10">
        <h1 className="text-xl font-bold text-white mb-6">Đăng ký</h1>
        {error ? <p className="text-red-400 text-sm mb-4">{error}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-white border border-white/15 outline-none focus:ring-2 focus:ring-[#ff2a14]"
              required
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Tên (tùy chọn)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-white border border-white/15 outline-none focus:ring-2 focus:ring-[#ff2a14]"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Mật khẩu (tối thiểu 6 ký tự)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-white border border-white/15 outline-none focus:ring-2 focus:ring-[#ff2a14]"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#ff2a14] text-white font-medium disabled:opacity-50"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>
        <p className="mt-4 text-white/70 text-sm">
          Đã có tài khoản? <Link href="/login" className="text-[#ff2a14] hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </main>
  );
}
