"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserRowActions({
  userId,
  role,
  currentUserId,
  currentUserRole,
}: {
  userId: string;
  role: string;
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"remove" | "delete" | "vip" | "removeVip" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = userId === currentUserId;
  const isAdminRole = role === "admin" || role === "super_admin";
  const isVip = role === "vip";
  const isTargetSuperAdmin = role === "super_admin";
  const adminCannotTouch = currentUserRole === "admin" && isTargetSuperAdmin;

  async function handleGrantVip() {
    setLoading("vip");
    try {
      const res = await fetch("/api/admin/users/grant-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, durationDays: 30 }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleRemoveVip() {
    setLoading("removeVip");
    try {
      const res = await fetch("/api/admin/users/remove-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleRemoveAdmin() {
    setLoading("remove");
    try {
      const res = await fetch("/api/admin/users/remove-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading("delete");
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) router.refresh();
      else setConfirmDelete(false);
    } finally {
      setLoading(null);
    }
  }

  if (adminCannotTouch) {
    return <span className="text-white/40 text-xs">–</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <button
        type="button"
        onClick={handleGrantVip}
        disabled={!!loading}
        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium disabled:opacity-50"
      >
        {loading === "vip" ? "..." : "Cấp VIP"}
      </button>
      {isVip && (
        <button
          type="button"
          onClick={handleRemoveVip}
          disabled={!!loading}
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/80 text-xs font-medium disabled:opacity-50"
        >
          {loading === "removeVip" ? "..." : "Gỡ VIP"}
        </button>
      )}
      {isAdminRole && !isSelf && (
        <button
          type="button"
          onClick={handleRemoveAdmin}
          disabled={!!loading}
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500/20 text-white/80 text-xs font-medium disabled:opacity-50"
        >
          {loading === "remove" ? "..." : "Gỡ admin"}
        </button>
      )}
      {!isSelf && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={!!loading}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 ${
            confirmDelete
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "bg-white/10 hover:bg-red-500/20 text-white/80"
          }`}
        >
          {loading === "delete" ? "..." : confirmDelete ? "Xác nhận xóa?" : "Xóa"}
        </button>
      )}
    </div>
  );
}
