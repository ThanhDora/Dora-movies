"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đã tạo tài khoản.");
        setEmail("");
        setName("");
        router.refresh();
      } else {
        setMessage(data.error || "Lỗi");
      }
    } catch {
      setMessage("Lỗi");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-white/60 text-xs mb-1.5">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 min-w-[200px] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
          required
        />
      </div>
      <div>
        <label className="block text-white/60 text-xs mb-1.5">Tên (tùy chọn)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 min-w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-lg bg-[#ff2a14] hover:bg-[#e02512] text-white text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? "Đang xử lý..." : "Thêm tài khoản"}
      </button>
      {message ? (
        <span className={message.startsWith("Đã") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
          {message}
        </span>
      ) : null}
    </form>
  );
}
