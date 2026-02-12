import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlaylistById, addToPlaylist, removeFromPlaylist } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: playlistId } = await params;
  if (!playlistId) {
    return NextResponse.json({ error: "Playlist id required" }, { status: 400 });
  }
  const playlist = await getPlaylistById(session.user.id, playlistId);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }
  let body: { movieSlug?: unknown; movieTitle?: unknown; posterUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const movieSlug = typeof body.movieSlug === "string" ? body.movieSlug.trim() : "";
  if (!movieSlug) {
    return NextResponse.json({ error: "movieSlug required" }, { status: 400 });
  }
  const movieTitle = typeof body.movieTitle === "string" ? body.movieTitle : null;
  const posterUrl = typeof body.posterUrl === "string" ? body.posterUrl : null;
  await addToPlaylist(playlistId, { movieSlug, movieTitle, posterUrl });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: playlistId } = await params;
  if (!playlistId) {
    return NextResponse.json({ error: "Playlist id required" }, { status: 400 });
  }
  const playlist = await getPlaylistById(session.user.id, playlistId);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }
  const u = new URL(req.url);
  const movieSlug = u.searchParams.get("movieSlug")?.trim() ?? "";
  if (!movieSlug) {
    return NextResponse.json({ error: "movieSlug required" }, { status: 400 });
  }
  await removeFromPlaylist(playlistId, movieSlug);
  return NextResponse.json({ ok: true });
}
