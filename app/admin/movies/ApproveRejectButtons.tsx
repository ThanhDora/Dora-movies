"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

export default function ApproveRejectButtons({ id }: { id: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleApprove() {
    setLoading("approve");
    setToast(null);
    try {
      const res = await fetch(`/api/admin/movies/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: "Đã duyệt phim thành công!", type: "success" });
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setToast({ message: data.error || "Không thể duyệt phim. Vui lòng thử lại.", type: "error" });
      }
    } catch (e) {
      setToast({ message: "Có lỗi xảy ra. Vui lòng thử lại.", type: "error" });
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
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
    </>
  );
}
