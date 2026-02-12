"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

export default function SyncAndApproveButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleSyncAndApprove() {
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/movies/sync-and-approve", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setToast({
          message: `Đã sync và duyệt ${data.approved} phim thành công!`,
          type: "success",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setToast({
          message: data.error || "Có lỗi xảy ra khi sync và duyệt phim.",
          type: "error",
        });
      }
    } catch (e) {
      setToast({
        message: "Không thể kết nối đến server. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setLoading(false);
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
      <button
        type="button"
        onClick={handleSyncAndApprove}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-[#e6b800] hover:bg-[#d4a800] text-[#0a0a0c] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Đang xử lý..." : "Sync và tự động duyệt tất cả phim"}
      </button>
    </>
  );
}
