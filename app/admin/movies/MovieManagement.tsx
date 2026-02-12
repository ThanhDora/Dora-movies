"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DbMovieApproval } from "@/types/db";
import Toast from "@/components/Toast";
import MovieImage from "./MovieImage";

interface MovieWithName extends DbMovieApproval {
  name?: string;
  origin_name?: string;
}

export default function MovieManagement({
  movies,
  currentPage,
  totalPages,
  total,
  filter = "all",
}: {
  movies: DbMovieApproval[];
  currentPage: number;
  totalPages: number;
  total: number;
  filter?: string;
}) {
  const router = useRouter();
  const [localMovies, setLocalMovies] = useState<MovieWithName[]>(movies);
  const [loading, setLoading] = useState<string | null>(null);
  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [movieNames, setMovieNames] = useState<Record<string, { name: string; origin_name: string }>>({});

  useEffect(() => {
    async function fetchMovieNames() {
      const names: Record<string, { name: string; origin_name: string }> = {};
      const promises = movies.map(async (movie) => {
        try {
          const res = await fetch(`/api/movie-info/${encodeURIComponent(movie.slug)}`);
          if (res.ok) {
            const data = await res.json();
            names[movie.id] = {
              name: data.name || movie.slug,
              origin_name: data.origin_name || "",
            };
          }
        } catch {
          names[movie.id] = {
            name: movie.slug,
            origin_name: "",
          };
        }
      });
      await Promise.allSettled(promises);
      setMovieNames(names);
      setLocalMovies(movies.map(m => ({
        ...m,
        name: names[m.id]?.name,
        origin_name: names[m.id]?.origin_name,
      })));
    }
    fetchMovieNames();
  }, [movies]);

  async function toggleVisibility(id: string, currentVisible: boolean) {
    setLoading(id);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/movies/${id}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !currentVisible }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalMovies((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_visible: !currentVisible } : m))
        );
        setToast({
          message: !currentVisible ? "Đã hiện phim trên web" : "Đã ẩn phim khỏi web",
          type: "success",
        });
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setToast({
          message: data.error || "Có lỗi xảy ra khi cập nhật",
          type: "error",
        });
      }
    } catch (e) {
      setToast({
        message: "Có lỗi xảy ra: " + (e instanceof Error ? e.message : String(e)),
        type: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  async function updateSchedule(id: string, scheduledAt: string | null) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/movies/${id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt }),
      });
      if (res.ok) {
        setLocalMovies((prev) =>
          prev.map((m) => (m.id === id ? { ...m, scheduled_at: scheduledAt } : m))
        );
        setScheduleInputs((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setLoading(null);
    }
  }

  function formatDateTime(dateString: string | null): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function isScheduled(scheduledAt: string | null): boolean {
    if (!scheduledAt) return false;
    return new Date(scheduledAt) > new Date();
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    if (filter !== "all") {
      params.set("filter", filter);
    }
    const search = params.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <ul className="divide-y divide-white/10">
          {localMovies.map((m) => {
          const isScheduledFuture = isScheduled(m.scheduled_at);
          const showInput = scheduleInputs[m.id] !== undefined;
          return (
            <li
              key={m.id}
              className="flex flex-col gap-3 px-4 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex gap-3 min-w-0 flex-1">
                  <MovieImage slug={m.slug} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/phim/${m.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white hover:text-[#ff2a14] hover:underline truncate block"
                      title={m.name || m.slug}
                    >
                      {m.name || m.slug}
                    </Link>
                    {m.origin_name && (
                      <div className="text-white/60 text-sm mt-0.5 truncate">
                        {m.origin_name}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-white/50 text-xs">
                        {m.source} · {new Date(m.created_at).toLocaleDateString("vi-VN")}
                      </span>
                      {m.approved_at && (
                        <span className="text-white/50 text-xs">
                          · Duyệt: {new Date(m.approved_at).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                      {m.scheduled_at && (
                        <span
                          className={`text-xs ${
                            isScheduledFuture ? "text-amber-400" : "text-green-400"
                          }`}
                        >
                          · {isScheduledFuture ? "Hẹn giờ" : "Đã hiện"}:{" "}
                          {new Date(m.scheduled_at).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/phim/${m.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#e6b800] hover:bg-[#d4a800] text-[#0a0a0c] text-sm font-medium transition-colors"
                  >
                    Xem thêm
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(m.id, m.is_visible)}
                    disabled={loading === m.id}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                      m.is_visible
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-red-600/80 hover:bg-red-600 text-white border border-red-500/50"
                    }`}
                    title={m.is_visible ? "Nhấn để ẩn phim" : "Nhấn để hiện phim"}
                  >
                    {loading === m.id ? (
                      "..."
                    ) : m.is_visible ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Đang hiện</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.906 5.236m-1.637-1.637L3 3z" />
                        </svg>
                        <span>Đang ẩn</span>
                      </>
                    )}
                  </button>
                  {!showInput ? (
                    <button
                      type="button"
                      onClick={() =>
                        setScheduleInputs((prev) => ({
                          ...prev,
                          [m.id]: formatDateTime(m.scheduled_at),
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium border border-white/15 transition-colors"
                    >
                      {m.scheduled_at ? "Sửa lịch" : "Hẹn giờ"}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={scheduleInputs[m.id] || ""}
                        onChange={(e) =>
                          setScheduleInputs((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e6b800] focus:ring-1 focus:ring-[#e6b800]"
                      />
                      <button
                        type="button"
                        onClick={() => updateSchedule(m.id, scheduleInputs[m.id] || null)}
                        disabled={loading === m.id}
                        className="px-3 py-1.5 rounded-lg bg-[#e6b800] hover:bg-[#d4a800] text-[#0a0a0c] text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {loading === m.id ? "..." : "Lưu"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setScheduleInputs((prev) => {
                            const next = { ...prev };
                            delete next[m.id];
                            return next;
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium border border-white/15 transition-colors"
                      >
                        Hủy
                      </button>
                      {m.scheduled_at && (
                        <button
                          type="button"
                          onClick={() => updateSchedule(m.id, null)}
                          disabled={loading === m.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium border border-red-500/30 disabled:opacity-50 transition-colors"
                        >
                          Xóa lịch
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
          })}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white/60 text-sm">
            Trang {currentPage} / {totalPages} · Tổng {total} phim
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium border border-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#e6b800] text-[#0a0a0c]"
                        : "bg-white/10 hover:bg-white/15 text-white/90 border border-white/15"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium border border-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
