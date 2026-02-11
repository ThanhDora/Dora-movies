"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditNameForm({ initialName, inline }: { initialName: string | null; inline?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Đã lưu tên.");
        router.refresh();
      } else {
        setMessage(data.error || "Lỗi");
      }
    } catch {
      setMessage("Lỗi");
    }
    setLoading(false);
  }

  if (inline) {
    return (
      <form onSubmit={submit} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[160px] bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
            placeholder="Nhập tên hiển thị"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-[#ff2a14] hover:bg-[#e02512] text-white text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {loading ? "Đang lưu..." : "Lưu tên"}
          </button>
        </div>
        {message ? (
          <span className={message.startsWith("Đã") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>{message}</span>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="text-white/70 text-sm">Tên hiển thị</label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[200px] bg-white/10 text-white border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14]/50"
          placeholder="Nhập tên"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-[#ff2a14] hover:bg-[#e02512] text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu tên"}
        </button>
      </div>
      {message ? (
        <span className={message.startsWith("Đã") ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>{message}</span>
      ) : null}
    </form>
  );
}
