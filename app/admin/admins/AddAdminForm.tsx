"use client";

import { useState } from "react";

export default function AddAdminForm({ currentUserRole }: { currentUserRole?: string } = {}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const canAddSuperAdmin = currentUserRole === "super_admin";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, role: canAddSuperAdmin ? role : "admin" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đã thêm/cập nhật admin.");
        setEmail("");
        setName("");
      } else {
        setMessage(data.error || "Lỗi");
      }
    } catch {
      setMessage("Lỗi");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="block text-white/70 text-sm mb-1.5">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
          required
        />
      </div>
      <div>
        <label className="block text-white/70 text-sm mb-1.5">Tên (tùy chọn)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
        />
      </div>
      <div>
        <label className="block text-white/70 text-sm mb-1.5">Role</label>
        <select
          value={canAddSuperAdmin ? role : "admin"}
          onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
          className="w-full bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
          disabled={!canAddSuperAdmin}
        >
          <option value="admin">Admin</option>
          {canAddSuperAdmin && <option value="super_admin">Super Admin</option>}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 rounded-lg bg-[#ff2a14] hover:bg-[#e02512] text-white text-sm font-medium w-fit disabled:opacity-50 transition-colors"
      >
        {loading ? "Đang xử lý..." : "Thêm admin"}
      </button>
      {message ? (
        <span className={message.startsWith("Đã") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
          {message}
        </span>
      ) : null}
    </form>
  );
}
