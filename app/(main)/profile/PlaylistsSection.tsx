"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PlaylistItemRow = {
  id: string;
  movieSlug: string;
  movieTitle: string | null;
  posterUrl: string | null;
  sortOrder: number;
};

type PlaylistRow = {
  id: string;
  name: string;
  createdAt: string;
  items: PlaylistItemRow[];
};

export default function PlaylistsSection({ initialPlaylists }: { initialPlaylists: PlaylistRow[] }) {
  const [playlists, setPlaylists] = useState<PlaylistRow[]>(initialPlaylists);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    setPlaylists(initialPlaylists);
  }, [initialPlaylists]);

  async function fetchPlaylists() {
    try {
      const res = await fetch("/api/profile/playlists");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setPlaylists(data?.playlists ?? []);
    } catch {
      //
    }
  }

  async function createPlaylist() {
    const name = newName.trim() || "Danh sách mới";
    setLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/profile/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowModal(false);
        setNewName("");
        await fetchPlaylists();
      } else {
        setCreateError(typeof data?.error === "string" ? data.error : "Tạo danh sách thất bại.");
      }
    } catch {
      setCreateError("Lỗi kết nối. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePlaylist(playlistId: string) {
    if (!confirm("Xóa danh sách này?")) return;
    const res = await fetch(`/api/profile/playlists/${playlistId}`, { method: "DELETE" });
    if (res.ok) {
      setOpenId((id) => (id === playlistId ? null : id));
      await fetchPlaylists();
    }
  }

  async function removeFromPlaylist(playlistId: string, movieSlug: string) {
    const res = await fetch(`/api/profile/playlists/${playlistId}/items?movieSlug=${encodeURIComponent(movieSlug)}`, { method: "DELETE" });
    if (res.ok) await fetchPlaylists();
  }

  return (
    <section className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Danh sách phát</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-sm font-medium text-[#ff2a14] hover:text-[#ff5a44] transition-colors"
        >
          + Tạo danh sách mới
        </button>
      </div>
      {playlists.length === 0 ? (
        <p className="text-white/50 text-sm">Chưa có danh sách. Nhấn &quot;Tạo danh sách mới&quot; để thêm.</p>
      ) : (
        <div className="space-y-4">
          {playlists.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId((id) => (id === p.id ? null : p.id))}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white">{p.name}</span>
                <span className="text-white/50 text-sm">{p.items.length} phim</span>
              </button>
              {openId === p.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {p.items.map((item) => (
                      <div key={item.id} className="group relative">
                        <Link href={`/phim/${item.movieSlug}`} className="block">
                          <div className="aspect-2/3 rounded-lg overflow-hidden bg-white/10">
                            {item.posterUrl ? (
                              <img src={item.posterUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">No image</div>
                            )}
                          </div>
                          <p className="mt-1 text-white/90 text-xs line-clamp-2">{item.movieTitle || item.movieSlug}</p>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            removeFromPlaylist(p.id, item.movieSlug);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white/80 hover:text-white text-xs flex items-center justify-center"
                          title="Xóa khỏi danh sách"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePlaylist(p.id)}
                    className="mt-3 text-xs text-white/50 hover:text-red-400 transition-colors"
                  >
                    Xóa danh sách
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { if (!loading) { setShowModal(false); setCreateError(null); } }}>
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-3">Tạo danh sách mới</h3>
            {createError && <p className="mb-3 text-red-400 text-sm">{createError}</p>}
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên danh sách (vd: Xem sau)"
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff2a14] mb-4"
              onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => !loading && setShowModal(false)} className="px-4 py-2 rounded-lg text-white/70 hover:text-white">
                Hủy
              </button>
              <button type="button" onClick={createPlaylist} disabled={loading} className="px-4 py-2 rounded-lg bg-[#ff2a14] text-white hover:bg-[#ff4a24] disabled:opacity-50">
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
