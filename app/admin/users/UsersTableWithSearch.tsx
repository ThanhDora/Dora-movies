"use client";

import { useState, useMemo } from "react";
import UserRowActions from "./UserRowActions";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  vip_until: string | null;
};

export default function UsersTableWithSearch({
  users,
  currentUserId,
  currentUserRole,
}: {
  users: User[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="font-semibold text-white">Danh sách user ({filtered.length}{search ? ` / ${users.length}` : ""})</h2>
        <input
          type="search"
          placeholder="Tìm theo email hoặc tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:ml-auto w-full sm:w-64 bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-white/70 font-medium">Email</th>
              <th className="px-4 py-3 text-white/70 font-medium">Tên</th>
              <th className="px-4 py-3 text-white/70 font-medium">Role</th>
              <th className="px-4 py-3 text-white/70 font-medium">VIP đến</th>
              <th className="px-4 py-3 text-white/70 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/90">{u.email}</td>
                <td className="px-4 py-3 text-white/70">{u.name ?? "–"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "super_admin"
                        ? "bg-red-500/20 text-red-400"
                        : u.role === "admin"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : u.role === "vip"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-white/10 text-white/70"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/70">
                  {u.vip_until ? new Date(u.vip_until).toLocaleDateString("vi-VN") : "–"}
                </td>
                <td className="px-4 py-3 text-right">
                  <UserRowActions userId={u.id} role={u.role} currentUserId={currentUserId} currentUserRole={currentUserRole} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-white/50 text-sm">
          {search ? "Không có user nào trùng với từ khóa." : "Chưa có user."}
        </div>
      )}
    </div>
  );
}
