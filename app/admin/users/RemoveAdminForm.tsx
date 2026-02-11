"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveAdminForm({
  admins,
  currentUserId,
}: {
  admins: { id: string; email: string; role: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const options = admins.filter((a) => a.id !== currentUserId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users/remove-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đã gỡ quyền admin.");
        setUserId("");
        router.refresh();
      } else {
        setMessage(data.error || "Lỗi");
      }
    } catch {
      setMessage("Lỗi");
    }
    setLoading(false);
  }

  if (options.length === 0) return null;

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-white/60 text-xs mb-1.5">Admin cần gỡ</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 min-w-[220px] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
          required
        >
          <option value="">-- Chọn admin --</option>
          {options.map((u) => (
            <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white text-sm font-medium border border-white/15 disabled:opacity-50 transition-colors"
      >
        {loading ? "Đang xử lý..." : "Gỡ quyền admin"}
      </button>
      {message ? (
        <span className={message.startsWith("Đã") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
          {message}
        </span>
      ) : null}
    </form>
  );
}
