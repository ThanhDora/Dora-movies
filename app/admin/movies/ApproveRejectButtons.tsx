"use client";

import { useState } from "react";

export default function ApproveRejectButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/movies/${id}/approve`, { method: "POST" });
      if (res.ok) window.location.reload();
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    try {
      const res = await fetch(`/api/admin/movies/${id}/reject`, { method: "POST" });
      if (res.ok) window.location.reload();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        onClick={handleApprove}
        disabled={!!loading}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading === "approve" ? "Đang xử lý..." : "Duyệt"}
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={!!loading}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/90 text-sm font-medium border border-white/15 disabled:opacity-50 transition-colors"
      >
        {loading === "reject" ? "Đang xử lý..." : "Từ chối"}
      </button>
    </div>
  );
}
