"use client";

import { useState } from "react";

export default function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
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
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, role }),
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
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="block text-white/70 text-sm mb-1">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/15 rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-white/70 text-sm mb-1">Tên (tùy chọn)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/10 text-white border border-white/15 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-white/70 text-sm mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
          className="w-full bg-white/10 text-white border border-white/15 rounded px-3 py-2"
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-[#ff2a14] text-white w-fit disabled:opacity-50"
      >
        {loading ? "..." : "Thêm admin"}
      </button>
      {message ? <span className="text-white/80">{message}</span> : null}
    </form>
  );
}
