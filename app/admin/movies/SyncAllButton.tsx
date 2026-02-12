"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

export default function SyncAllButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function handleSyncAll() {
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/movies/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setToast({
          message: `Đồng bộ thành công ${data.synced}/${data.total} phim`,
          type: "success",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setToast({
          message: data.error || "Đồng bộ thất bại",
          type: "error",
        });
      }
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Đồng bộ thất bại",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSyncAll}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-[#e6b800] hover:bg-[#d4a800] text-[#0a0a0c] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Đang đồng bộ..." : "Đồng bộ phim"}
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
