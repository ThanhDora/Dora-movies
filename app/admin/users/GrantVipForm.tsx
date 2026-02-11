"use client";

import { useState } from "react";

export default function GrantVipForm({
  users,
}: {
  users: { id: string; email: string }[];
}) {
  const [userId, setUserId] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users/grant-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, durationDays: days }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đã cấp VIP.");
        setUserId("");
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
        <label className="block text-white/70 text-xs mb-1">User</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="bg-white/10 text-white border border-white/15 rounded px-3 py-2 min-w-[200px]"
          required
        >
          <option value="">-- Chọn user --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-white/70 text-xs mb-1">Số ngày</label>
        <input
          type="number"
          min={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-white/10 text-white border border-white/15 rounded px-3 py-2 w-24"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-[#ff2a14] text-white disabled:opacity-50"
      >
        {loading ? "..." : "Cấp VIP"}
      </button>
      {message ? <span className="text-white/80">{message}</span> : null}
    </form>
  );
}
