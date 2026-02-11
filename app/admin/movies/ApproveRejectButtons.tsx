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
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={!!loading}
        className="px-3 py-1.5 rounded bg-green-600 text-white text-sm disabled:opacity-50"
      >
        {loading === "approve" ? "..." : "Duyệt"}
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={!!loading}
        className="px-3 py-1.5 rounded bg-red-600 text-white text-sm disabled:opacity-50"
      >
        {loading === "reject" ? "..." : "Từ chối"}
      </button>
    </div>
  );
}
