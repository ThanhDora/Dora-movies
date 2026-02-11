"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới và xác nhận không trùng");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đã đổi mật khẩu.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-white/70 text-sm">Mật khẩu hiện tại</label>
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="w-full max-w-sm bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
        placeholder="Nhập mật khẩu hiện tại"
        required
      />
      <label className="text-white/70 text-sm">Mật khẩu mới</label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full max-w-sm bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
        placeholder="Tối thiểu 6 ký tự"
        required
        minLength={6}
      />
      <label className="text-white/70 text-sm">Xác nhận mật khẩu mới</label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full max-w-sm bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
        placeholder="Nhập lại mật khẩu mới"
        required
        minLength={6}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-fit px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/15 disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
      </button>
      {message ? (
        <span className={message.startsWith("Đã") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>{message}</span>
      ) : null}
    </form>
  );
}
