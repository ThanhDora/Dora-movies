"use client";

import { useState, useEffect } from "react";

type PlaylistRow = { id: string; name: string; items: { movieSlug: string }[] };

export default function AddToPlaylistModal({
  movieSlug,
  movieTitle,
  posterUrl,
  onClose,
}: {
  movieSlug: string;
  movieTitle?: string | null;
  posterUrl?: string | null;
  onClose: () => void;
}) {
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/profile/playlists")
      .then((r) => {
        if (r.status === 401) {
          setNeedsAuth(true);
          return { playlists: [] };
        }
        return r.json().catch(() => ({ playlists: [] }));
      })
      .then((data) => {
        setPlaylists(data?.playlists ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function addToPlaylist(playlistId: string) {
    const res = await fetch(`/api/profile/playlists/${playlistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieSlug, movieTitle: movieTitle ?? null, posterUrl: posterUrl ?? null }),
    });
    if (res.ok) onClose();
  }

  async function createAndAdd() {
    const name = newName.trim() || "Danh sách mới";
    setCreating(true);
    try {
      const res = await fetch("/api/profile/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data?.id) {
        await addToPlaylist(data.id);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-sm mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold">Thêm vào danh sách phát</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-white/50 text-sm">Đang tải...</p>
          ) : needsAuth ? (
            <p className="text-white/70 text-sm">Đăng nhập để thêm vào danh sách phát.</p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-white/10 text-[#ff2a14] hover:bg-white/15 text-sm font-medium mb-3"
              >
                + Tạo danh sách mới
              </button>
              {showCreate && (
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tên danh sách"
                    className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a14] mb-2"
                    onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowCreate(false); setNewName(""); }} className="px-3 py-1.5 text-white/70 text-sm">Hủy</button>
                    <button type="button" onClick={createAndAdd} disabled={creating} className="px-3 py-1.5 rounded bg-[#ff2a14] text-white text-sm disabled:opacity-50">Tạo và thêm</button>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                {playlists.map((p) => {
                  const hasMovie = p.items.some((i) => i.movieSlug === movieSlug);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => !hasMovie && addToPlaylist(p.id)}
                      disabled={hasMovie}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10 disabled:opacity-50 disabled:cursor-default text-sm"
                    >
                      {p.name}{hasMovie ? " (đã có)" : ""}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
